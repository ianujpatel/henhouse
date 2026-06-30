import mongoose, { Schema, Document } from "mongoose";

export interface IFeedBanner extends Document {
  title?: string;
  image_url: string;
  link?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

const FeedBannerSchema: Schema = new Schema(
  {
    title: { type: String, trim: true },
    image_url: { type: String, required: true },
    link: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

FeedBannerSchema.virtual("id").get(function (this: IFeedBanner) {
  return this._id.toString();
});

FeedBannerSchema.set("toJSON", { virtuals: true });
FeedBannerSchema.set("toObject", { virtuals: true });

export default mongoose.model<IFeedBanner>("FeedBanner", FeedBannerSchema);
