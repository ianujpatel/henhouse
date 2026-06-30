import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem extends Document {
  order_id: mongoose.Types.ObjectId;
  product_type: "chicken" | "feed";
  listing_id?: mongoose.Types.ObjectId; // For Chicken products
  feed_product_id?: mongoose.Types.ObjectId; // For Feed products
  weight?: number; // Selected weight (kg) for Feed products
  farmer_id: mongoose.Types.ObjectId; // User ID of the seller (farmer or admin)
  quantity: number;
  unit_buyer_price: number;
  unit_farmer_price: number;
  created_at: Date;
}

const OrderItemSchema: Schema = new Schema(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    product_type: { type: String, enum: ["chicken", "feed"], default: "chicken", required: true },
    listing_id: { type: Schema.Types.ObjectId, ref: "Listing", required: false },
    feed_product_id: { type: Schema.Types.ObjectId, ref: "FeedProduct", required: false },
    weight: { type: Number, required: false },
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
