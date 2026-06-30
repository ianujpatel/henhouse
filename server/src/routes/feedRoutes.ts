import { Router } from "express";
import {
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminCreateBrand,
  adminUpdateBrand,
  adminDeleteBrand,
  adminListBrands,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListProducts,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
  adminListBanners,
  getFeedMarketplace,
  getFeedProduct,
  createProductReview
} from "../controllers/feedController";
import { protect, requireApproved, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Public / Buyer Marketplace routes
router.get("/marketplace", protect, requireApproved, getFeedMarketplace);
router.get("/product/:id", protect, requireApproved, getFeedProduct);
router.post("/product/:id/review", protect, requireApproved, requireRole(["buyer"]), createProductReview);

// Admin Category Routes
router.post("/admin/categories", protect, requireRole(["admin"]), adminCreateCategory);
router.post("/admin/categories/:id", protect, requireRole(["admin"]), adminUpdateCategory);
router.delete("/admin/categories/:id", protect, requireRole(["admin"]), adminDeleteCategory);
router.get("/admin/categories", protect, requireRole(["admin"]), adminListCategories);

// Admin Brand Routes
router.post("/admin/brands", protect, requireRole(["admin"]), adminCreateBrand);
router.post("/admin/brands/:id", protect, requireRole(["admin"]), adminUpdateBrand);
router.delete("/admin/brands/:id", protect, requireRole(["admin"]), adminDeleteBrand);
router.get("/admin/brands", protect, requireRole(["admin"]), adminListBrands);

// Admin Product Routes
router.post("/admin/products", protect, requireRole(["admin"]), adminCreateProduct);
router.post("/admin/products/:id", protect, requireRole(["admin"]), adminUpdateProduct);
router.delete("/admin/products/:id", protect, requireRole(["admin"]), adminDeleteProduct);
router.get("/admin/products", protect, requireRole(["admin"]), adminListProducts);

// Admin Banner Routes
router.post("/admin/banners", protect, requireRole(["admin"]), adminCreateBanner);
router.post("/admin/banners/:id", protect, requireRole(["admin"]), adminUpdateBanner);
router.delete("/admin/banners/:id", protect, requireRole(["admin"]), adminDeleteBanner);
router.get("/admin/banners", protect, requireRole(["admin"]), adminListBanners);

export default router;
