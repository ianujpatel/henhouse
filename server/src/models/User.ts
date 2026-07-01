import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  full_name: string;
  phone?: string;
  farm_name?: string;
  status: "pending" | "approved" | "rejected";
  roles: Array<"admin" | "farmer" | "buyer">;
  reset_password_token?: string;
  reset_password_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    full_name: { type: String, default: "" },
    phone: { type: String },
    farm_name: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    roles: { type: [String], enum: ["admin", "farmer", "buyer"], default: ["buyer"] },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Virtual for id mapping to keep compatibility with client-side expectations (id instead of _id)
UserSchema.virtual("id").get(function (this: IUser) {
  return this._id.toString();
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export default mongoose.model<IUser>("User", UserSchema);
