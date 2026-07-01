import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User";
import Settings from "../models/Settings";
import { AuthRequest } from "../middleware/authMiddleware";
import { sendResetPasswordEmail } from "../config/mailer";

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "henhouse_jwt_secret_key_123456", {
    expiresIn: "30d",
  });
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, full_name, phone, farm_name, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Initial role verification (prevent self-grant admin)
    const assignedRole = role === "admin" ? "buyer" : role || "buyer";

    // Check auto-approval setting
    const autoApproveSetting = await Settings.findOne({ key: "auto_approve_users" });
    const autoApprove = autoApproveSetting ? !!autoApproveSetting.value : false;
    const defaultStatus = autoApprove ? "approved" : "pending";

    const user = await User.create({
      email,
      password: hashedPassword,
      full_name: full_name || email,
      phone,
      farm_name: assignedRole === "farmer" ? farm_name : undefined,
      roles: [assignedRole],
      status: defaultStatus,
    });

    if (user) {
      const token = generateToken(user._id.toString());
      return res.status(201).json({
        user: {
          id: user._id.toString(),
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          farm_name: user.farm_name,
          roles: user.roles,
          status: user.status,
        },
        session: {
          access_token: token,
          expires_in: 30 * 24 * 60 * 60, // 30 days
          token_type: "bearer",
          user: {
            id: user._id.toString(),
            email: user.email,
          }
        }
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password || ""))) {
      const token = generateToken(user._id.toString());
      return res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          farm_name: user.farm_name,
          roles: user.roles,
          status: user.status,
        },
        session: {
          access_token: token,
          expires_in: 30 * 24 * 60 * 60, // 30 days
          token_type: "bearer",
          user: {
            id: user._id.toString(),
            email: user.email,
          }
        }
      });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      userId: user._id.toString(),
      profile: {
        id: user._id.toString(),
        full_name: user.full_name,
        phone: user.phone,
        farm_name: user.farm_name,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      roles: user.roles,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { full_name, phone, farm_name } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.full_name = full_name || user.full_name;
    user.phone = phone !== undefined ? phone : user.phone;
    if (user.roles.includes("farmer")) {
      user.farm_name = farm_name !== undefined ? farm_name : user.farm_name;
    }

    await user.save();

    return res.json({ ok: true });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.reset_password_token = resetToken;
    user.reset_password_expires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    try {
      await sendResetPasswordEmail(user.email, resetLink);
      return res.json({ message: "Password reset link sent to your email" });
    } catch (mailError: any) {
      console.error("Mailer error:", mailError);
      user.reset_password_token = undefined;
      user.reset_password_expires = undefined;
      await user.save();
      return res.status(500).json({ message: "Could not send password reset email. Please try again." });
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const user = await User.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    return res.json({ message: "Password has been reset successfully" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};
