import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryMovement extends Document {
  listing_id: mongoose.Types.ObjectId;
  delta: number;
  reason: string;
  created_at: Date;
}

const InventoryMovementSchema: Schema = new Schema(
  {
    listing_id: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    delta: { type: Number, required: true },
    reason: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  }
);

InventoryMovementSchema.virtual("id").get(function (this: IInventoryMovement) {
  return this._id.toString();
});

InventoryMovementSchema.set("toJSON", { virtuals: true });
InventoryMovementSchema.set("toObject", { virtuals: true });

export default mongoose.model<IInventoryMovement>("InventoryMovement", InventoryMovementSchema);
