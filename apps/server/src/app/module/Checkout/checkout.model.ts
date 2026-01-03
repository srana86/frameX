import { Schema, model } from "mongoose";
import { ICheckoutSession, CheckoutStatus } from "./checkout.interface";

const checkoutSessionSchema = new Schema<ICheckoutSession>(
  {
    tranId: {
      type: String,
      required: true,
      unique: true,
    },
    planId: {
      type: String,
      required: true,
    },
    planName: String,
    planPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    billingCycle: String,
    merchantName: String,
    merchantEmail: String,
    merchantPhone: String,
    merchantId: {
      type: String,
    },
    customSubdomain: String,
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    customerAddress: String,
    customerCity: String,
    customerState: String,
    customerPostcode: String,
    customerCountry: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    sessionkey: String,
    card_type: String,
    card_no: String,
    bank_tran_id: String,
    val_id: String,
    paymentMethod: String,
    error: String,
    completedAt: String,
    failedAt: String,
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

// Note: tranId field has unique: true, which automatically creates an index
checkoutSessionSchema.index({ merchantId: 1 });
checkoutSessionSchema.index({ status: 1 });
checkoutSessionSchema.index({ createdAt: -1 });

export const CheckoutSession = model<ICheckoutSession>(
  "checkout_sessions",
  checkoutSessionSchema
);
