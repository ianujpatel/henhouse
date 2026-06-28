import { Router } from "express";
import { placeOrder, listMyOrders, listFarmerOrders } from "../controllers/orderController";
import { protect, requireApproved, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/place", protect, requireApproved, requireRole(["buyer"]), placeOrder);
router.get("/my-orders", protect, requireApproved, requireRole(["buyer"]), listMyOrders);
router.get("/farmer-orders", protect, requireApproved, requireRole(["farmer"]), listFarmerOrders);

export default router;
