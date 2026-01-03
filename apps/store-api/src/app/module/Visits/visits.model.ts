import { Schema, model } from "mongoose";
import { TVisit } from "./visits.interface";

const visitSchema = new Schema<TVisit>(
  {
    id: {
      type: String,
      unique: true,
      sparse: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      default: "/",
      index: true,
    },
    referrer: String,
    userAgent: String,
    visitCount: {
      type: Number,
      default: 1,
    },
    ipGeolocation: {
      type: Schema.Types.Mixed,
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying by IP and path
visitSchema.index({ ipAddress: 1, path: 1, createdAt: -1 });

export const Visit = model<TVisit>("Visit", visitSchema);
