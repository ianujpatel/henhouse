import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    status: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Decode token
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "henhouse_jwt_secret_key_123456"
      );

      // Fetch user from DB to ensure they still exist and status is up to date
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      req.user = {
        id: user._id.toString(),
        email: user.email,
        roles: user.roles,
        status: user.status,
      };

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Check if user is approved
export const requireApproved = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): any => {
  if (req.user && req.user.status === "approved") {
    return next();
  }
  return res.status(403).json({ message: "Access forbidden, account not approved" });
};

// Check if user has a required role
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (hasRole) {
      return next();
    }

    return res.status(403).json({ message: "Access forbidden, insufficient permissions" });
  };
};
