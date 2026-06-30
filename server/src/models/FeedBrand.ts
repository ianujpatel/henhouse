import mongoose, { Schema, Document } from "mongoose";

export interface IFeedBrand extends Document {
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const FeedBrandSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

FeedBrandSchema.virtual("id").get(function (this: IFeedBrand) {
  return this._id.toString();
});

FeedBrandSchema.set("toJSON", { virtuals: true });
FeedBrandSchema.set("toObject", { virtuals: true });

export default mongoose.model<IFeedBrand>("FeedBrand", FeedBrandSchema);
