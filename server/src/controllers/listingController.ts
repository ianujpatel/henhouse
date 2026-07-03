import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Listing from "../models/Listing";
import User from "../models/User";
import Notification from "../models/Notification";
import { deleteFromCloudinary } from "../config/cloudinary";

export const createListing = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Role check (must be farmer or admin)
    if (!req.user.roles.includes("farmer") && !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Forbidden: Only farmers or admins can create listings" });
    }

    // Approval check
    if (req.user.status !== "approved" && !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Forbidden: Account not approved" });
    }

    const { title, category, breed, quantity, unit, farmer_price, location, description, images, status, brand, feed_category, is_featured_banner, specifications, target_audience } = req.body;

    const isAdmin = req.user.roles.includes("admin");
    if (!isAdmin && category === "feed") {
      return res.status(403).json({ message: "Forbidden: Only admins can manage feed listings" });
    }
    const finalFarmerPrice = isAdmin ? (Number(farmer_price) || 0) : 0;

    const listing = await Listing.create({
      farmer_id: req.user.id,
      title,
      category,
      breed,
      quantity,
      unit: unit || "bird",
      farmer_price: finalFarmerPrice,
      buyer_price: isAdmin ? (req.body.buyer_price || finalFarmerPrice) : undefined,
      location,
      description,
      images: images || [],
      status: isAdmin ? (status || "live") : "pending_pricing",
      brand,
      feed_category,
      is_featured_banner: is_featured_banner || false,
      specifications,
      target_audience: target_audience || "both",
    });

    // Notify admins if pending pricing
    if (listing.status === "pending_pricing") {
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

    if (!req.user.roles.includes("farmer") && !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Forbidden: Only farmers or admins can edit listings" });
    }

    const { id } = req.params;
    const patch = req.body;

    const isAdmin = req.user.roles.includes("admin");
    if (!isAdmin) {
      delete patch.farmer_price;
      delete patch.buyer_price;
    }

    let query: any = { _id: id };
    if (!isAdmin) {
      query.farmer_id = req.user.id;
    }

    const listing = await Listing.findOne(query);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or not owned by you" });
    }

    if (!isAdmin && (patch.category === "feed" || listing.category === "feed")) {
      return res.status(403).json({ message: "Forbidden: Only admins can manage feed listings" });
    }

    // Compare images to find removed ones and delete from Cloudinary
    if (patch.images) {
      const oldImages = listing.images || [];
      const newPublicIds = new Set(patch.images.map((img: any) => img.public_id));
      const removedImages = oldImages.filter((img) => !newPublicIds.has(img.public_id));
      
      for (const img of removedImages) {
        if (img.public_id) {
          try {
            await deleteFromCloudinary(img.public_id);
          } catch (err) {
            console.error("Cloudinary deletion failed for:", img.public_id, err);
          }
        }
      }
    }

    // Apply updates
    Object.assign(listing, patch);
    
    // For admin, allow editing buyer_price directly
    if (req.user.roles.includes("admin") && patch.buyer_price !== undefined) {
      listing.buyer_price = patch.buyer_price;
    }

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

    let query: any = { _id: id };
    if (!req.user.roles.includes("admin")) {
      query.farmer_id = req.user.id;
    }

    const listing = await Listing.findOne(query);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or not owned by you" });
    }

    // Delete images from Cloudinary when archiving
    if (listing.images && listing.images.length > 0) {
      for (const img of listing.images) {
        if (img.public_id) {
          try {
            await deleteFromCloudinary(img.public_id);
          } catch (err) {
            console.error("Cloudinary deletion failed for:", img.public_id, err);
          }
        }
      }
      listing.images = [];
      listing.image_urls = [];
    }

    listing.status = "archived";
    await listing.save();

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// Farmer/Admin view their own listings: never returns buyer_price unless they are admin
export const listMyListings = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!req.user.roles.includes("farmer") && !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Forbidden: Only farmers or admins can view their listings" });
    }

    const listings = await Listing.find({ farmer_id: req.user.id })
      .select("id title category breed quantity unit farmer_price buyer_price status location description images image_urls brand feed_category is_featured_banner specifications created_at updated_at")
      .sort({ created_at: -1 });

    return res.json(listings);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// Buyer marketplace: never returns farmer_price, populates farmer_id roles
export const listMarketplace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { category, search } = req.query;

    const query: any = {
      status: "live",
      quantity: { $gt: 0 },
    };

    if (!req.user.roles.includes("admin")) {
      const allowedAudiences: string[] = ["both"];
      if (req.user.roles.includes("buyer")) {
        allowedAudiences.push("buyer");
      }
      if (req.user.roles.includes("farmer")) {
        allowedAudiences.push("farmer");
      }
      query.target_audience = { $in: allowedAudiences };
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const listings = await Listing.find(query)
      .populate("farmer_id", "roles farm_name full_name")
      .select("id title category breed quantity unit buyer_price location images image_urls brand feed_category is_featured_banner specifications target_audience created_at farmer_id")
      .sort({ created_at: -1 });

    return res.json(listings);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const getListingForBuyer = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    const query: any = { _id: id, status: "live" };
    if (!req.user.roles.includes("admin")) {
      const allowedAudiences: string[] = ["both"];
      if (req.user.roles.includes("buyer")) {
        allowedAudiences.push("buyer");
      }
      if (req.user.roles.includes("farmer")) {
        allowedAudiences.push("farmer");
      }
      query.target_audience = { $in: allowedAudiences };
    }

    const listing = await Listing.findOne(query)
      .populate("farmer_id", "roles farm_name full_name")
      .select("id title category breed quantity unit buyer_price location description images image_urls brand feed_category is_featured_banner specifications target_audience created_at farmer_id");

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

    const secure_url = (req.file as any).path;
    const public_id = (req.file as any).filename || (req.file as any).public_id || `temp-${Date.now()}`;

    return res.json({
      public_id,
      secure_url,
      url: secure_url,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const getListingForEdit = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    let query: any = { _id: id };
    if (!req.user.roles.includes("admin")) {
      query.farmer_id = req.user.id;
    }

    const listing = await Listing.findOne(query);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or not authorized" });
    }

    return res.json(listing);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
