import { Schema, model } from "mongoose";
import { ISale, SaleStatus, SaleType } from "./sales.interface";

const saleSchema = new Schema<ISale>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    merchantId: {
      type: String,
      required: true,
    },
    merchantName: String,
    merchantEmail: String,
    subscriptionId: String,
    planId: {
      type: String,
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    billingCycleMonths: {
      type: Number,
      default: 1,
    },
    paymentMethod: {
      type: String,
      default: "sslcommerz",
    },
    transactionId: String,
    status: {
      type: String,
      enum: ["completed", "pending", "failed", "refunded"],
      default: "completed",
    },
    type: {
      type: String,
      enum: ["new", "renewal", "upgrade", "downgrade"],
      default: "new",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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

saleSchema.index({ merchantId: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ type: 1 });
saleSchema.index({ createdAt: -1 });

export const Sale = model<ISale>("sales", saleSchema);
