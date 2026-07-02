import { Router } from "express";
import { getGlobalSettings, updateGlobalSettings } from "../controllers/globalSettingsController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Public route to fetch settings
router.get("/", getGlobalSettings);

// Admin only route to update settings
router.post("/", protect, requireRole(["admin"]), updateGlobalSettings);

export default router;
