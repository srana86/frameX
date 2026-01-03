import { Schema, model } from "mongoose";
import { TCoupon } from "./coupon.interface";

const couponSchema = new Schema<TCoupon>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: [
        "percentage",
        "fixed_amount",
        "free_shipping",
        "buy_x_get_y",
        "first_order",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "scheduled"],
      default: "active",
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscountAmount: Number,
    buyXGetY: {
      buyQuantity: Number,
      getQuantity: Number,
      productId: String,
      categoryId: String,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    usageLimit: {
      totalUses: Number,
      usesPerCustomer: Number,
      currentUses: { type: Number, default: 0 },
    },
    conditions: {
      minPurchaseAmount: Number,
      maxPurchaseAmount: Number,
      applicableCategories: [String],
      excludedCategories: [String],
      applicableProducts: [String],
      excludedProducts: [String],
      firstOrderOnly: Boolean,
    },
    totalRevenue: Number,
    averageOrderValue: Number,
  },
  {
    timestamps: true,
  }
);

export const Coupon = model<TCoupon>("Coupon", couponSchema);
