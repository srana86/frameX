import { Schema, model } from "mongoose";
import type { CouponUsageRecord } from "./coupon.interface";

const couponUsageRecordSchema = new Schema<CouponUsageRecord>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    couponId: {
      type: String,
      required: true,
      index: true,
    },
    couponCode: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
    },
    customerEmail: {
      type: String,
    },
    customerPhone: {
      type: String,
    },
    discountApplied: {
      type: Number,
      required: true,
    },
    orderTotal: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "coupon_usage",
  }
);

// Compound index to prevent duplicate usage records
couponUsageRecordSchema.index({ couponId: 1, orderId: 1 }, { unique: true });

export const CouponUsageRecordModel = model<CouponUsageRecord>(
  "CouponUsage",
  couponUsageRecordSchema
);
