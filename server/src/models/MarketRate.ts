import mongoose, { Schema, Document } from "mongoose";

export interface IMarketRate extends Document {
  weight_category: string;
  today_price: number;
  yesterday_price: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const MarketRateSchema: Schema = new Schema(
  {
    weight_category: { type: String, required: true, trim: true },
    today_price: { type: Number, required: true, default: 0 },
    yesterday_price: { type: Number, required: true, default: 0 },
    sort_order: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model<IMarketRate>("MarketRate", MarketRateSchema);
