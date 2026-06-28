import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Settings from "../models/Settings";
import { AuthRequest } from "../middleware/authMiddleware";

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
