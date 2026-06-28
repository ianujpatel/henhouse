import { Router } from "express";
import {
  adminListUsers,
  adminSetUserStatus,
  adminListAllListings,
  adminSetBuyerPrice,
  adminListAllOrders,
  adminSetOrderStatus,
  adminAnalytics,
  adminGetSettings,
  adminUpdateSettings,
} from "../controllers/adminController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Restrict all these endpoints to Admins only
router.use(protect, requireRole(["admin"]));

router.get("/users", adminListUsers);
router.post("/set-user-status", adminSetUserStatus);
router.get("/listings", adminListAllListings);
router.post("/set-buyer-price", adminSetBuyerPrice);
router.get("/orders", adminListAllOrders);
router.post("/set-order-status", adminSetOrderStatus);
router.get("/analytics", adminAnalytics);
router.get("/settings", adminGetSettings);
router.post("/settings", adminUpdateSettings);

export default router;

