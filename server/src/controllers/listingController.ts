import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Listing from "../models/Listing";
import User from "../models/User";
import Notification from "../models/Notification";

export const createListing = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Role check (must be farmer)
    if (!req.user.roles.includes("farmer")) {
      return res.status(403).json({ message: "Forbidden: Only farmers can create listings" });
    }

    // Approval check
    if (req.user.status !== "approved") {
      return res.status(403).json({ message: "Forbidden: Account not approved" });
    }

    const { title, category, breed, quantity, unit, farmer_price, location, description, image_urls } = req.body;

    const listing = await Listing.create({
      farmer_id: req.user.id,
      title,
      category,
      breed,
      quantity,
      unit: unit || "bird",
      farmer_price,
      location,
      description,
      image_urls: image_urls || [],
      status: "pending_pricing",
    });

    // Notify admins
    const admins = await User.find({ roles: "admin" });
    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin._id,
        type: "listing.pending_pricing",
        title: "New listing needs pricing",
        body: title,
      }));
      await Notification.insertMany(notifications);
    }

    return res.status(201).json({ id: listing._id.toString() });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const updateListing = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!req.user.roles.includes("farmer")) {
      return res.status(403).json({ message: "Forbidden: Only farmers can edit listings" });
    }

    const { id } = req.params;
    const patch = req.body;

    const listing = await Listing.findOne({ _id: id, farmer_id: req.user.id });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or not owned by you" });
    }

    // Apply updates
    Object.assign(listing, patch);
    await listing.save();

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const archiveListing = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    const listing = await Listing.findOne({ _id: id, farmer_id: req.user.id });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or not owned by you" });
    }

    listing.status = "archived";
    await listing.save();

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// Farmer view: never returns buyer_price
export const listMyListings = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!req.user.roles.includes("farmer")) {
      return res.status(403).json({ message: "Forbidden: Only farmers can view their listings" });
    }

    const listings = await Listing.find({ farmer_id: req.user.id })
      .select("id title category breed quantity unit farmer_price status location description image_urls created_at updated_at")
      .sort({ created_at: -1 });

    return res.json(listings);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// Buyer marketplace: never returns farmer_price
export const listMarketplace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { category, search } = req.query;

    const query: any = {
      status: "live",
      quantity: { $gt: 0 },
    };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const listings = await Listing.find(query)
      .select("id title category breed quantity unit buyer_price location image_urls created_at")
      .sort({ created_at: -1 });

    return res.json(listings);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const getListingForBuyer = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const listing = await Listing.findOne({ _id: id, status: "live" })
      .select("id title category breed quantity unit buyer_price location description image_urls created_at");

    if (!listing) {
      return res.status(404).json({ message: "Listing not available" });
    }

    return res.json(listing);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// Handle Image Uploads to Cloudinary or Local FS
export const uploadImage = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let fileUrl = "";
    if ("path" in req.file && (req.file as any).path.startsWith("http")) {
      // Cloudinary upload returns an absolute HTTPS path
      fileUrl = (req.file as any).path;
    } else {
      // Local fallback: return local route pointing to the uploads path
      fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    return res.json({ url: fileUrl });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
