import { Schema, model } from "mongoose";
import { IPlan } from "./plan.interface";

const planSchema = new Schema<IPlan>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    billingCycleMonths: {
      type: Number,
      required: true,
      enum: [1, 6, 12],
    },
    featuresList: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    buttonText: {
      type: String,
      default: "Get Started",
    },
    buttonVariant: {
      type: String,
      enum: ["default", "outline", "gradient"],
      default: "outline",
    },
    iconType: {
      type: String,
      enum: ["star", "grid", "sparkles"],
      default: "star",
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
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

// Note: id field has unique: true, which automatically creates an index
planSchema.index({ isActive: 1 });
planSchema.index({ billingCycleMonths: 1 });
planSchema.index({ sortOrder: 1, createdAt: -1 });

export const Plan = model<IPlan>("subscription_plans", planSchema);
