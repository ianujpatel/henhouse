import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem extends Document {
  order_id: mongoose.Types.ObjectId;
  listing_id: mongoose.Types.ObjectId;
  farmer_id: mongoose.Types.ObjectId;
  quantity: number;
  unit_buyer_price: number;
  unit_farmer_price: number;
  created_at: Date;
}

const OrderItemSchema: Schema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    listing_id: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    farmer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_buyer_price: { type: Number, required: true },
    unit_farmer_price: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
  }
);

OrderItemSchema.virtual("id").get(function (this: IOrderItem) {
  return this._id.toString();
});

OrderItemSchema.set("toJSON", { virtuals: true });
OrderItemSchema.set("toObject", { virtuals: true });

export default mongoose.model<IOrderItem>("OrderItem", OrderItemSchema);
