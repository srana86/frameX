import { Schema, model } from "mongoose";
import { TReview } from "./review.interface";

const reviewSchema = new Schema<TReview>(
  {
    productSlug: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
    initials: String,
    date: String,
    verified: {
      type: Boolean,
      default: false,
    },
    avatarColor: String,
    images: [String],
  },
  {
    timestamps: true,
  }
);

export const Review = model<TReview>("Review", reviewSchema);
