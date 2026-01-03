import { Schema, model } from "mongoose";
import { TOrder } from "./order.interface";

const orderSchema = new Schema<TOrder>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      required: true,
    },
    orderType: {
      type: String,
      enum: ["online", "offline"],
    },
    items: {
      type: [
        {
          productId: String,
          slug: String,
          name: String,
          price: Number,
          image: String,
          size: String,
          color: String,
          quantity: Number,
          category: String,
        },
      ],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discountPercentage: Number,
    discountAmount: Number,
    vatTaxPercentage: Number,
    vatTaxAmount: Number,
    shipping: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    paidAmount: Number,
    paymentTransactionId: String,
    paymentValId: String,
    customer: {
      fullName: { type: String, required: true },
      email: String,
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      notes: String,
    },
    courier: {
      serviceId: String,
      consignmentId: String,
      trackingNumber: String,
      status: String,
    },
    fraudCheck: {
      riskScore: Number,
      flagged: Boolean,
      reason: String,
    },
    couponCode: String,
    couponId: String,
    affiliateCode: String,
    affiliateId: String,
    affiliateCommission: Number,
    sourceTracking: {
      source: String,
      medium: String,
      campaign: String,
      referrer: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<TOrder>("Order", orderSchema);
