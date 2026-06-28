import { Router } from "express";
import { listMyNotifications, markNotificationRead } from "../controllers/notificationController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/my-notifications", protect, listMyNotifications);
router.post("/mark-read/:id", protect, markNotificationRead);

export default router;
