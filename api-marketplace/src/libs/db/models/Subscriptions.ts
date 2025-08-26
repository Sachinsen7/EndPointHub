import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  apiId: mongoose.Types.ObjectId;
  plan: "free" | "basic" | "premium" | "enterprise";
  status: "active" | "cancelled" | "expired" | "suspended";
  startDate: Date;
  endDate?: Date;
  requestsLimit: number;
  requestsUsed: number;
  price: number;
  paymentMethod?: string;
  stripeSubscriptionId?: string;
  features: string[];
  metadata: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apiId: {
      type: Schema.Types.ObjectId,
      ref: "API",
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "suspended"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    requestsLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    requestsUsed: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "crypto", "free"],
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true,
    },
    features: [
      {
        type: String,
      },
    ],
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

SubscriptionSchema.index({ userId: 1, apiId: 1 }, { unique: true });
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ apiId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ endDate: 1 });

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
