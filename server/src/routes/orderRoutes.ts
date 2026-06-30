import { Router } from "express";
import {
  createCheckoutSession,
  verifyPayment,
  retryPayment,
  getInvoice,
  listMyOrders,
  listFarmerOrders
} from "../controllers/orderController";
import { protect, requireApproved, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Checkout & Payments (Buyer required)
router.post("/checkout", protect, requireApproved, requireRole(["buyer"]), createCheckoutSession);
router.post("/verify", protect, requireApproved, requireRole(["buyer"]), verifyPayment);
router.post("/retry", protect, requireApproved, requireRole(["buyer"]), retryPayment);

// Invoices
router.get("/:id/invoice", protect, requireApproved, getInvoice);

// Orders listings
router.get("/my-orders", protect, requireApproved, requireRole(["buyer"]), listMyOrders);
router.get("/farmer-orders", protect, requireApproved, requireRole(["farmer", "admin"]), listFarmerOrders);

export default router;
