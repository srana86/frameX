/* eslint-disable @typescript-eslint/no-explicit-any */
import { TCoupon } from "./coupon.interface";

export function isCouponActive(coupon: TCoupon): boolean {
  const now = new Date();
  const startDate = new Date(coupon.startDate);
  const endDate = new Date(coupon.endDate);

  if (coupon.status !== "active") return false;
  if (now < startDate) return false;
  if (now > endDate) return false;

  // Check usage limits
  if (
    coupon.usageLimit.totalUses &&
    (coupon.usageLimit.currentUses || 0) >= coupon.usageLimit.totalUses
  ) {
    return false;
  }

  return true;
}

export function calculateDiscount(
  coupon: TCoupon,
  cartSubtotal: number,
  applicableSubtotal: number,
  shippingCost: number
): { discount: number; freeShipping: boolean } {
  let discount = 0;
  let freeShipping = false;

  switch (coupon.type) {
    case "percentage":
      discount = (applicableSubtotal * coupon.discountValue) / 100;
      // Apply max discount cap if set
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
      break;

    case "fixed_amount":
      discount = Math.min(coupon.discountValue, applicableSubtotal);
      break;

    case "free_shipping":
      freeShipping = true;
      discount = shippingCost;
      break;

    case "first_order":
      // First order discount is typically percentage
      discount = (applicableSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
      break;

    case "buy_x_get_y":
      // Discount calculated separately based on free items
      // This is handled in the checkout logic
      break;
  }

  return { discount: Math.round(discount * 100) / 100, freeShipping };
}
