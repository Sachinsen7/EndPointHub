import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: "user" | "admin" | "provider";
  emailVerified: boolean;
  isActive: boolean;
  avatar?: string;
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
  lastLogin: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "provider"],
      default: "user",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    company: {
      type: String,
      maxlength: 100,
    },
    website: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Website must be a valid URL",
      },
    },
    location: {
      type: String,
      maxlength: 100,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = require("crypto").randomBytes(32).toString("hex");
  this.passwordResetToken = require("crypto")
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

UserSchema.methods.generateEmailVerificationToken = function (): string {
  const verifyToken = require("crypto").randomBytes(32).toString("hex");
  this.emailVerificationToken = require("crypto")
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");
  return verifyToken;
};

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
