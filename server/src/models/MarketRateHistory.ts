import mongoose, { Schema, Document } from "mongoose";

export interface IMarketRateHistory extends Document {
  date: Date;
  market_name: string;
  vehicles_arrived?: number;
  rates: {
    weight_category: string;
    price: number;
  }[];
  created_at: Date;
  updated_at: Date;
}

const MarketRateHistorySchema: Schema = new Schema(
  {
    date: { type: Date, required: true, unique: true, index: true },
    market_name: { type: String, required: true, default: "Bihar Market Rates" },
    vehicles_arrived: { type: Number, default: 0 },
    rates: [
      {
        weight_category: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model<IMarketRateHistory>("MarketRateHistory", MarketRateHistorySchema);
