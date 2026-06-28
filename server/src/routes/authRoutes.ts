import { Router } from "express";
import { register, login, getMe, updateProfile } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/update-profile", protect, updateProfile);

export default router;
