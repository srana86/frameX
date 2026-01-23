/* eslint-disable @typescript-eslint/no-explicit-any */
import { TCoupon } from "./coupon.interface";

export function isCouponActive(coupon: TCoupon): boolean {
  const now = new Date();
  const createdAt = coupon.createdAt ? new Date(coupon.createdAt) : new Date(0);
  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;

  if (!coupon.isActive) return false;
  if (now < createdAt) return false;
  if (expiresAt && now > expiresAt) return false;

  // Check usage limits
  if (
    coupon.maxUses &&
    (coupon.usedCount || 0) >= coupon.maxUses
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
  const freeShipping = false;

  switch (coupon.discountType) {
    case "PERCENTAGE":
      discount = (applicableSubtotal * coupon.discountValue) / 100;
      break;

    case "FIXED":
      discount = Math.min(coupon.discountValue, applicableSubtotal);
      break;
  }

  return { discount: Math.round(discount * 100) / 100, freeShipping };
}
