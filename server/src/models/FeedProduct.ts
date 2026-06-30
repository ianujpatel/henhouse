import mongoose, { Schema, Document } from "mongoose";

export interface IFeedReview {
  user_id: mongoose.Types.ObjectId;
  rating: number;
  review?: string;
  created_at: Date;
}

export interface IFeedProduct extends Document {
  name: string;
  category_id: mongoose.Types.ObjectId;
  brand_id: mongoose.Types.ObjectId;
  description?: string;
  specifications: Map<string, string>;
  price_per_kg: number;
  weights: number[];
  image_urls: string[];
  stock: number;
  ratings: IFeedReview[];
  created_at: Date;
  updated_at: Date;
}

const FeedReviewSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, trim: true },
  created_at: { type: Date, default: Date.now },
});

const FeedProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category_id: { type: Schema.Types.ObjectId, ref: "FeedCategory", required: true },
    brand_id: { type: Schema.Types.ObjectId, ref: "FeedBrand", required: true },
    description: { type: String, trim: true },
    specifications: { type: Map, of: String, default: {} },
    price_per_kg: { type: Number, required: true, min: 0 },
    weights: { type: [Number], default: [1, 5, 10, 25] },
    image_urls: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    ratings: { type: [FeedReviewSchema], default: [] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

FeedProductSchema.virtual("id").get(function (this: IFeedProduct) {
  return this._id.toString();
});

FeedProductSchema.set("toJSON", { virtuals: true });
FeedProductSchema.set("toObject", { virtuals: true });

export default mongoose.model<IFeedProduct>("FeedProduct", FeedProductSchema);
