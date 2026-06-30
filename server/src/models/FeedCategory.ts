import mongoose, { Schema, Document } from "mongoose";

export interface IFeedCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const FeedCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

FeedCategorySchema.virtual("id").get(function (this: IFeedCategory) {
  return this._id.toString();
});

FeedCategorySchema.set("toJSON", { virtuals: true });
FeedCategorySchema.set("toObject", { virtuals: true });

export default mongoose.model<IFeedCategory>("FeedCategory", FeedCategorySchema);
