import { Router } from "express";
import {
  createListing,
  updateListing,
  archiveListing,
  listMyListings,
  listMarketplace,
  getListingForBuyer,
  uploadImage,
} from "../controllers/listingController";
import { protect, requireApproved, requireRole } from "../middleware/authMiddleware";
import { upload } from "../config/cloudinary";

const router = Router();

// Public / general auth endpoints
router.get("/marketplace", protect, requireApproved, listMarketplace);
router.get("/buyer/:id", protect, requireApproved, getListingForBuyer);

// Farmer only endpoints
router.post("/create", protect, requireApproved, requireRole(["farmer"]), createListing);
router.post("/update/:id", protect, requireApproved, requireRole(["farmer"]), updateListing);
router.post("/archive/:id", protect, requireApproved, requireRole(["farmer"]), archiveListing);
router.get("/my-listings", protect, requireApproved, requireRole(["farmer"]), listMyListings);

// Image upload endpoint
router.post("/upload", protect, requireApproved, upload.single("image"), uploadImage);

export default router;
