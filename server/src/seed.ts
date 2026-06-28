import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import User from "./models/User";
import { connectDB } from "./config/db";

// Load environment variables from server directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@henhouse.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

    // Check if any admin user exists
    const adminExists = await User.findOne({ roles: "admin" });

    if (adminExists) {
      console.log(`Admin user already exists: ${adminExists.email}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const newAdmin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        full_name: "System Admin",
        roles: ["admin"],
        status: "approved",
      });

      console.log(`Successfully seeded default admin user: ${newAdmin.email}`);
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error}`);
    process.exit(1);
  }
};

seedAdmin();
