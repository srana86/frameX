import { Schema, model } from "mongoose";
import { IMerchant, MerchantStatus } from "./merchant.interface";

const merchantSchema = new Schema<IMerchant>(
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
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "trial", "inactive"],
      default: "active",
    },
    customDomain: {
      type: String,
      default: "",
    },
    deploymentUrl: {
      type: String,
      default: "",
    },
    subscriptionId: {
      type: String,
      default: "",
    },
    settings: {
      brandName: String,
      logo: String,
      theme: {
        primaryColor: String,
      },
      currency: {
        type: String,
        default: "USD",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
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
    timestamps: false, // We're using custom createdAt/updatedAt
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Index for common queries
// Note: id field has unique: true, which automatically creates an index
merchantSchema.index({ email: 1 });
merchantSchema.index({ status: 1 });
merchantSchema.index({ createdAt: -1 });

export const Merchant = model<IMerchant>("merchants", merchantSchema);
