export type CouponType = "PERCENTAGE" | "FIXED";

export interface TCoupon {
  id: string;
  code: string;
  discountType: CouponType;
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string | Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CouponUsageRecord {
  id: string;
  couponId: string;
  couponCode: string;
  orderId: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  discountApplied: number;
  orderTotal: number;
  createdAt?: Date;
}
