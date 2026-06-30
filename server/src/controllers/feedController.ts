import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import FeedCategory from "../models/FeedCategory";
import FeedBrand from "../models/FeedBrand";
import FeedProduct from "../models/FeedProduct";
import FeedBanner from "../models/FeedBanner";

// ==========================================
// 1. Admin Category Management
// ==========================================

export const adminCreateCategory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }
    const category = await FeedCategory.create({ name, slug, description });
    return res.status(201).json(category);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminUpdateCategory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;
    const category = await FeedCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;
    await category.save();
    return res.json(category);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminDeleteCategory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const category = await FeedCategory.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminListCategories = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const categories = await FeedCategory.find({}).sort({ name: 1 });
    return res.json(categories);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ==========================================
// 2. Admin Brand Management
// ==========================================

export const adminCreateBrand = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }
    const brand = await FeedBrand.create({ name, slug, description });
    return res.status(201).json(brand);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminUpdateBrand = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;
    const brand = await FeedBrand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    if (name) brand.name = name;
    if (slug) brand.slug = slug;
    if (description !== undefined) brand.description = description;
    await brand.save();
    return res.json(brand);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminDeleteBrand = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const brand = await FeedBrand.findByIdAndDelete(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminListBrands = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const brands = await FeedBrand.find({}).sort({ name: 1 });
    return res.json(brands);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ==========================================
// 3. Admin Feed Product Management
// ==========================================

export const adminCreateProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { name, category_id, brand_id, description, specifications, price_per_kg, weights, image_urls, stock } = req.body;
    if (!name || !category_id || !brand_id || price_per_kg === undefined) {
      return res.status(400).json({ message: "Name, category, brand, and price are required" });
    }
    const product = await FeedProduct.create({
      name,
      category_id,
      brand_id,
      description,
      specifications: specifications || {},
      price_per_kg,
      weights: weights || [1, 5, 10, 25],
      image_urls: image_urls || [],
      stock: stock !== undefined ? stock : 0,
    });
    return res.status(201).json(product);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminUpdateProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const patch = req.body;
    const product = await FeedProduct.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Feed Product not found" });
    }
    Object.assign(product, patch);
    await product.save();
    return res.json(product);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminDeleteProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const product = await FeedProduct.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Feed Product not found" });
    }
    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminListProducts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const products = await FeedProduct.find({})
      .populate("category_id", "name")
      .populate("brand_id", "name")
      .sort({ created_at: -1 });
    return res.json(products);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ==========================================
// 4. Admin Banner Management
// ==========================================

export const adminCreateBanner = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { title, image_url, link, active } = req.body;
    if (!image_url) {
      return res.status(400).json({ message: "Image URL is required" });
    }
    const banner = await FeedBanner.create({ title, image_url, link, active });
    return res.status(201).json(banner);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminUpdateBanner = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, image_url, link, active } = req.body;
    const banner = await FeedBanner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    if (title !== undefined) banner.title = title;
    if (image_url) banner.image_url = image_url;
    if (link !== undefined) banner.link = link;
    if (active !== undefined) banner.active = active;
    await banner.save();
    return res.json(banner);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminDeleteBanner = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const banner = await FeedBanner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const adminListBanners = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const banners = await FeedBanner.find({}).sort({ created_at: -1 });
    return res.json(banners);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ==========================================
// 5. Buyer Feed Marketplace APIs
// ==========================================

export const getFeedMarketplace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { category, brand, search } = req.query;

    const query: any = {
      stock: { $gt: 0 }
    };

    if (category && category !== "all") {
      const cat = await FeedCategory.findOne({ slug: category });
      if (cat) {
        query.category_id = cat._id;
      }
    }

    if (brand && brand !== "all") {
      const b = await FeedBrand.findOne({ slug: brand });
      if (b) {
        query.brand_id = b._id;
      }
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const [banners, categories, brands, products] = await Promise.all([
      FeedBanner.find({ active: true }).sort({ created_at: -1 }),
      FeedCategory.find({}).sort({ name: 1 }),
      FeedBrand.find({}).sort({ name: 1 }),
      FeedProduct.find(query)
        .populate("category_id", "name slug")
        .populate("brand_id", "name slug")
        .sort({ created_at: -1 })
    ]);

    return res.json({
      banners,
      categories,
      brands,
      products
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const getFeedProduct = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const product = await FeedProduct.findById(id)
      .populate("category_id", "name slug")
      .populate("brand_id", "name slug")
      .populate("ratings.user_id", "full_name");

    if (!product) {
      return res.status(404).json({ message: "Feed Product not found" });
    }

    return res.json(product);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const createProductReview = async (req: AuthRequest, res: Promise<any> | any): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const product = await FeedProduct.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Feed Product not found" });
    }

    // Check if user already reviewed
    const existingIndex = product.ratings.findIndex(
      (r) => r.user_id.toString() === req.user!.id
    );

    const newReview = {
      user_id: req.user.id as any,
      rating: Number(rating),
      review: review || "",
      created_at: new Date()
    };

    if (existingIndex > -1) {
      product.ratings[existingIndex] = newReview;
    } else {
      product.ratings.push(newReview);
    }

    await product.save();
    return res.json({ ok: true, ratings: product.ratings });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
