import mongoose, { Schema, Document } from "mongoose";

export interface IUsage extends Document {
  _id: string;
  userId?: mongoose.Types.ObjectId;
  apiId: mongoose.Types.ObjectId;
  apiKeyId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string;
  ip: string;
  country?: string;
  error?: string;
  timestamp: Date;
  date: string; // YYYY-MM-DD for aggregation
  hour: string; // YYYY-MM-DDTHH for aggregation
}

const UsageSchema = new Schema<IUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    apiId: {
      type: Schema.Types.ObjectId,
      ref: "API",
      required: true,
    },
    apiKeyId: {
      type: Schema.Types.ObjectId,
      ref: "APIKey",
      default: null,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    method: {
      type: String,
      required: true,
      uppercase: true,
    },
    path: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
      min: 0,
    },
    requestSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    responseSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    userAgent: {
      type: String,
      maxlength: 500,
    },
    ip: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      maxlength: 2,
    },
    error: {
      type: String,
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    date: {
      type: String,
      required: true,
    },
    hour: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
  }
);

UsageSchema.index({ apiId: 1, date: -1 });
UsageSchema.index({ apiId: 1, hour: -1 });
UsageSchema.index({ userId: 1, timestamp: -1 });
UsageSchema.index({ apiKeyId: 1, timestamp: -1 });
UsageSchema.index({ timestamp: -1 });
UsageSchema.index({ date: 1 });
UsageSchema.index({ hour: 1 });

UsageSchema.pre("save", function (next) {
  const timestamp = this.timestamp || new Date();
  this.date = timestamp.toISOString().split("T")[0];
  this.hour = timestamp.toISOString().slice(0, 13);
  next();
});

export const Usage =
  mongoose.models.Usage || mongoose.model<IUsage>("Usage", UsageSchema);
