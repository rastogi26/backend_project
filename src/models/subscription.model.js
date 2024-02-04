import mongoose, { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom a subscriber is subscribing a channel
      ref: "User",
    },
  },

  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
