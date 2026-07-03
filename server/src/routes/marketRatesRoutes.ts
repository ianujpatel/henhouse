import { Router } from "express";
import {
  getMarketRatesPublicData,
  saveMarketMetadata,
  createMarketRate,
  updateMarketRate,
  deleteMarketRate,
  reorderMarketRates,
  saveMarketRateHistory,
  deleteMarketRateHistory,
} from "../controllers/marketRatesController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

// Public routes
router.get("/", getMarketRatesPublicData);

// Admin routes
router.post("/metadata", protect, requireRole(["admin"]), saveMarketMetadata);
router.post("/rate", protect, requireRole(["admin"]), createMarketRate);
router.put("/rate/:id", protect, requireRole(["admin"]), updateMarketRate);
router.delete("/rate/:id", protect, requireRole(["admin"]), deleteMarketRate);
router.post("/reorder", protect, requireRole(["admin"]), reorderMarketRates);
router.post("/history", protect, requireRole(["admin"]), saveMarketRateHistory);
router.delete("/history/:id", protect, requireRole(["admin"]), deleteMarketRateHistory);

export default router;
