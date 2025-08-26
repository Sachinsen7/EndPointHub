import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

export interface IAPIKey extends Document {
  _id: string;
  name: string;
  key: string;
  keyHash: string;
  userId: mongoose.Types.ObjectId;
  permissions: mongoose.Types.ObjectId[];
  rateLimit: number;
  isActive: boolean;
  lastUsed?: Date;
  expiresAt?: Date;
  ipWhitelist: string[];
  usage: {
    requests: number;
    lastReset: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  generateKey(): string;
}

const APIKeySchema = new Schema<IAPIKey>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "API",
      },
    ],
    rateLimit: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
      default: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    ipWhitelist: [
      {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v) || v === "*";
          },
          message: "Invalid IP address format",
        },
      },
    ],
    usage: {
      requests: {
        type: Number,
        default: 0,
      },
      lastReset: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.keyPreview = ret.key ? `${ret.key.substring(0, 8)}...` : undefined;
        delete ret?.key;
        delete ret.keyHash;
        return ret;
      },
    },
  }
);

APIKeySchema.index({ userId: 1 });
APIKeySchema.index({ keyHash: 1 }, { unique: true });
APIKeySchema.index({ isActive: 1 });
APIKeySchema.index({ expiresAt: 1 });

APIKeySchema.methods.generateKey = function (): string {
  const key = `ehub_${crypto.randomBytes(32).toString("hex")}`;
  this.key = key;
  this.keyHash = crypto.createHash("sha256").update(key).digest("hex");
  return key;
};

APIKeySchema.pre("save", function (next) {
  if (this.isNew && !this.key) {
    this.generateKey();
  }
  next();
});

export const APIKey =
  mongoose.models.APIKey || mongoose.model<IAPIKey>("APIKey", APIKeySchema);
