import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body?: string;
  read_at?: Date;
  created_at: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String },
    read_at: { type: Date },
    created_at: { type: Date, default: Date.now },
  }
);

NotificationSchema.virtual("id").get(function (this: INotification) {
  return this._id.toString();
});

NotificationSchema.set("toJSON", { virtuals: true });
NotificationSchema.set("toObject", { virtuals: true });

export default mongoose.model<INotification>("Notification", NotificationSchema);
