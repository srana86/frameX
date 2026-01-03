import { Schema, model } from "mongoose";
import {
  IFeatureRequest,
  FeatureRequestStatus,
  FeatureRequestPriority,
} from "./featureRequest.interface";

const featureRequestSchema = new Schema<IFeatureRequest>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    contactEmail: String,
    contactPhone: String,
    merchantId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "in_review", "resolved"],
      default: "new",
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

featureRequestSchema.index({ merchantId: 1 });
featureRequestSchema.index({ status: 1 });
featureRequestSchema.index({ createdAt: -1 });

export const FeatureRequest = model<IFeatureRequest>(
  "feature_requests",
  featureRequestSchema
);
