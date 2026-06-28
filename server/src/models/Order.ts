import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  buyer_id: mongoose.Types.ObjectId;
  status: "pending" | "placed" | "confirmed" | "fulfilled" | "cancelled";
  total: number;
  notes?: string;
  placed_at: Date;
  updated_at: Date;
  delivery_full_name?: string;
  delivery_mobile?: string;
  delivery_alternate_mobile?: string;
  delivery_address?: string;
  delivery_landmark?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_district?: string;
  delivery_pincode?: string;
  delivery_notes?: string;
}

const OrderSchema: Schema = new Schema(
  {
    buyer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "placed", "confirmed", "fulfilled", "cancelled"],
      default: "pending",
    },
    total: { type: Number, required: true, default: 0 },
    notes: { type: String, trim: true },
    delivery_full_name: { type: String },
    delivery_mobile: { type: String },
    delivery_alternate_mobile: { type: String },
    delivery_address: { type: String },
    delivery_landmark: { type: String },
    delivery_city: { type: String },
    delivery_state: { type: String },
    delivery_district: { type: String },
    delivery_pincode: { type: String },
    delivery_notes: { type: String },
  },
  {
    timestamps: { createdAt: "placed_at", updatedAt: "updated_at" },
  }
);

OrderSchema.virtual("id").get(function (this: IOrder) {
  return this._id.toString();
});

OrderSchema.set("toJSON", { virtuals: true });
OrderSchema.set("toObject", { virtuals: true });

export default mongoose.model<IOrder>("Order", OrderSchema);
