import mongoose, { Schema, Document } from "mongoose";

export interface IListing extends Document {
  farmer_id: mongoose.Types.ObjectId;
  title: string;
  category: "broiler" | "layer" | "chick" | "egg" | "feed" | "other";
  breed?: string;
  quantity: number;
  unit: string;
  farmer_price: number;
  buyer_price?: number;
  status: "draft" | "pending_pricing" | "live" | "sold_out" | "archived";
  location?: string;
  description?: string;
  brand?: string;
  is_featured_banner?: boolean;
  specifications?: string;
  images: { public_id: string; secure_url: string; }[];
  image_urls: string[];
  target_audience: "buyer" | "farmer" | "both";
  created_at: Date;
  updated_at: Date;
}

const ListingSchema: Schema = new Schema(
  {
    farmer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["broiler", "layer", "chick", "egg", "feed", "other"],
      required: true,
    },
    breed: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "bird", trim: true },
    farmer_price: { type: Number, required: true, min: 0 },
    buyer_price: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["draft", "pending_pricing", "live", "sold_out", "archived"],
      default: "pending_pricing",
    },
    location: { type: String, trim: true },
    description: { type: String, trim: true },
    images: {
      type: [
        {
          public_id: { type: String, required: true },
          secure_url: { type: String, required: true },
        },
      ],
      default: [],
    },
    image_urls: { type: [String], default: [] },
    brand: { type: String, trim: true },
    is_featured_banner: { type: Boolean, default: false },
    specifications: { type: String, trim: true },
    target_audience: {
      type: String,
      enum: ["buyer", "farmer", "both"],
      default: "both",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Auto-sync image_urls with images array on save to maintain client compatibility
ListingSchema.pre("save", function (this: IListing, next) {
  if (this.isModified("images")) {
    this.image_urls = this.images.map((img) => img.secure_url);
  }
  next();
});

ListingSchema.virtual("id").get(function (this: IListing) {
  return this._id.toString();
});

ListingSchema.set("toJSON", { virtuals: true });
ListingSchema.set("toObject", { virtuals: true });

export default mongoose.model<IListing>("Listing", ListingSchema);
