import mongoose, { Schema, Document } from "mongoose";

export interface IAPIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  parameters: {
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    required: boolean;
    description: string;
    example?: any;
  }[];
  responses: {
    statusCode: number;
    description: string;
    schema?: any;
  }[];
  deprecated: boolean;
  rateLimit?: number;
}

export interface IAPI extends Document {
  _id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  baseUrl: string;
  category: string;
  tags: string[];
  rating: number;
  totalRatings: number;
  price: number;
  pricingModel: "free" | "freemium" | "subscription" | "pay-per-use";
  isPublic: boolean;
  isActive: boolean;
  documentation: string;
  swaggerUrl?: string;
  redocUrl?: string;
  endpoints: IAPIEndpoint[];
  provider: mongoose.Types.ObjectId;
  authType?: "none" | "apikey" | "bearer" | "oauth2";
  authHeader?: string;
  authToken?: string;
  requiresSigning: boolean;
  signingSecret?: string;
  timeoutMs: number;
  maxRetries: number;
  healthCheckUrl?: string;
  lastHealthCheck?: Date;
  healthStatus: "healthy" | "unhealthy" | "unknown";
  monthlyRequests: number;
  totalRequests: number;
  createdAt: Date;
  updatedAt: Date;
}

const APIEndpointSchema = new Schema<IAPIEndpoint>(
  {
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    parameters: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["string", "number", "boolean", "array", "object"],
          required: true,
        },
        required: { type: Boolean, default: false },
        description: { type: String, required: true },
        example: Schema.Types.Mixed,
      },
    ],
    responses: [
      {
        statusCode: { type: Number, required: true },
        description: { type: String, required: true },
        schema: Schema.Types.Mixed,
      },
    ],
    deprecated: {
      type: Boolean,
      default: false,
    },
    rateLimit: {
      type: Number,
      min: 1,
    },
  },
  { _id: false }
);

const APISchema = new Schema<IAPI>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    version: {
      type: String,
      required: true,
      match: /^\d+\.\d+\.\d+$/,
    },
    baseUrl: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: "Base URL must be a valid HTTP/HTTPS URL",
      },
    },
    category: {
      type: String,
      required: true,
      enum: [
        "finance",
        "social",
        "utilities",
        "data",
        "ai",
        "communication",
        "entertainment",
        "productivity",
        "other",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    pricingModel: {
      type: String,
      enum: ["free", "freemium", "subscription", "pay-per-use"],
      default: "free",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    documentation: {
      type: String,
      maxlength: 10000,
    },
    swaggerUrl: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Swagger URL must be a valid HTTP/HTTPS URL",
      },
    },
    redocUrl: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Redoc URL must be a valid HTTP/HTTPS URL",
      },
    },
    endpoints: [APIEndpointSchema],
    provider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authType: {
      type: String,
      enum: ["none", "apikey", "bearer", "oauth2"],
      default: "none",
    },
    authHeader: {
      type: String,
      default: "Authorization",
    },
    authToken: {
      type: String,
      select: false, // Don't include in queries by default
    },
    requiresSigning: {
      type: Boolean,
      default: false,
    },
    signingSecret: {
      type: String,
      select: false,
    },
    timeoutMs: {
      type: Number,
      default: 30000,
      min: 1000,
      max: 120000,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10,
    },
    healthCheckUrl: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Health check URL must be a valid HTTP/HTTPS URL",
      },
    },
    lastHealthCheck: {
      type: Date,
      default: null,
    },
    healthStatus: {
      type: String,
      enum: ["healthy", "unhealthy", "unknown"],
      default: "unknown",
    },
    monthlyRequests: {
      type: Number,
      default: 0,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

APISchema.index({ slug: 1 }, { unique: true });
APISchema.index({ provider: 1 });
APISchema.index({ category: 1 });
APISchema.index({ isPublic: 1, isActive: 1 });
APISchema.index({ rating: -1 });
APISchema.index({ totalRequests: -1 });
APISchema.index({ createdAt: -1 });
APISchema.index({ tags: 1 });
APISchema.index({ name: "text", description: "text" });

APISchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

export const API =
  mongoose.models.API || mongoose.model<IAPI>("API", APISchema);
