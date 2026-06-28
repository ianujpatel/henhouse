import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Notification from "../models/Notification";

export const listMyNotifications = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(30);

    return res.json(notifications);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, user_id: req.user.id });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read_at = new Date();
    await notification.save();

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
