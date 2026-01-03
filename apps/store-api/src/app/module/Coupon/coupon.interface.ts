export type CouponType =
  | "percentage"
  | "fixed_amount"
  | "free_shipping"
  | "buy_x_get_y"
  | "first_order";

export type CouponStatus = "active" | "inactive" | "expired" | "scheduled";

export interface BuyXGetYConfig {
  buyQuantity: number;
  getQuantity: number;
  productId?: string;
  categoryId?: string;
}

export interface CouponUsageLimit {
  totalUses?: number;
  usesPerCustomer?: number;
  currentUses?: number;
}

export interface CouponConditions {
  minPurchaseAmount?: number;
  maxPurchaseAmount?: number;
  applicableCategories?: string[];
  excludedCategories?: string[];
  applicableProducts?: string[];
  excludedProducts?: string[];
  firstOrderOnly?: boolean;
}

export interface TCoupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  status: CouponStatus;
  discountValue: number;
  maxDiscountAmount?: number;
  buyXGetY?: BuyXGetYConfig;
  startDate: string;
  endDate: string;
  usageLimit: CouponUsageLimit;
  conditions: CouponConditions;
  totalRevenue?: number;
  averageOrderValue?: number;
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
