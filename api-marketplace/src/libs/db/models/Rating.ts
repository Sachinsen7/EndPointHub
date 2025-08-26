import mongoose, { Schema, Document } from "mongoose";

export interface IRating extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  apiId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

RatingSchema.index({ userId: 1, apiId: 1 }, { unique: true }); // One rating per user per API
RatingSchema.index({ apiId: 1 });
RatingSchema.index({ rating: -1 });

export const Rating =
  mongoose.models.Rating || mongoose.model<IRating>("Rating", RatingSchema);
