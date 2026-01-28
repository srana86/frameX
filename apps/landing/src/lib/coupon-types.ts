/**
 * Coupon Types and Validation for E-commerce
 * Supports multiple coupon types with flexible configurations
 */

export type CouponType =
  | "percentage" // Percentage discount (e.g., 10% off)
  | "fixed_amount" // Fixed amount off (e.g., $10 off)
  | "free_shipping" // Free shipping
  | "buy_x_get_y" // Buy X items get Y items free
  | "first_order"; // First order discount

export type CouponStatus = "active" | "inactive" | "expired" | "scheduled";

export type CouponApplicability =
  | "all" // All products
  | "categories" // Specific categories
  | "products"; // Specific products

export interface CouponUsageLimit {
  totalUses?: number; // Maximum total uses across all customers
  usesPerCustomer?: number; // Maximum uses per customer
  currentUses: number; // Current total uses
}

export interface CouponConditions {
  minOrderValue?: number; // Minimum cart value to apply
  maxOrderValue?: number; // Maximum cart value (for targeting)
  minItems?: number; // Minimum items in cart
  maxItems?: number; // Maximum items (for small order perks)
  applicableTo: CouponApplicability;
  categoryIds?: string[]; // If applicableTo is "categories"
  productIds?: string[]; // If applicableTo is "products"
  excludedProductIds?: string[]; // Products excluded from discount
  excludedCategoryIds?: string[]; // Categories excluded from discount
  customerEmails?: string[]; // Restrict to specific customers
  isFirstOrderOnly?: boolean; // Only for first-time customers
  requiresAuthentication?: boolean; // Must be logged in to use
}

export interface BuyXGetYConfig {
  buyQuantity: number; // Number of items to buy
  getQuantity: number; // Number of free items
  getProductIds?: string[]; // Specific products that can be free
  maxSets?: number; // Maximum sets of buy X get Y per order
}

export interface Coupon {
  id: string;
  code: string; // Unique coupon code (uppercase)
  name: string; // Display name
  description?: string; // Description shown to customers
  type: CouponType;
  status: CouponStatus;

  // Discount value
  discountValue: number; // Percentage (0-100) or fixed amount
  maxDiscountAmount?: number; // Cap on discount for percentage coupons

  // Special configs
  buyXGetY?: BuyXGetYConfig; // For buy_x_get_y type

  // Validity period
  startDate: string; // ISO date string
  endDate: string; // ISO date string

  // Usage limits
  usageLimit: CouponUsageLimit;

  // Conditions
  conditions: CouponConditions;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // Admin/tenant who created it

  // Analytics
  totalRevenue?: number; // Revenue generated with this coupon
  averageOrderValue?: number; // Average order value when used
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
  usedAt: string;
}

export interface ApplyCouponRequest {
  code: string;
  cartSubtotal: number;
  cartItems: Array<{
    productId: string;
    categoryId?: string;
    quantity: number;
    price: number;
  }>;
  customerEmail?: string;
  customerPhone?: string;
  isFirstOrder?: boolean;
}

export interface ApplyCouponResponse {
  success: boolean;
  coupon?: Coupon;
  discount: number;
  discountType: CouponType;
  message: string;
  error?: string;
  freeItems?: Array<{ productId: string; quantity: number }>; // For buy_x_get_y
  freeShipping?: boolean;
}

// Validation helpers
export function validateCouponCode(code: string): boolean {
  // Code must be 3-20 characters, alphanumeric with optional dashes/underscores
  const regex = /^[A-Z0-9_-]{3,20}$/;
  return regex.test(code.toUpperCase());
}

export function isCouponActive(coupon: Coupon): boolean {
  const now = new Date();
  const startDate = new Date(coupon.startDate);
  const endDate = new Date(coupon.endDate);

  if (coupon.status !== "active") return false;
  if (now < startDate) return false;
  if (now > endDate) return false;

  // Check usage limits
  if (coupon.usageLimit.totalUses && coupon.usageLimit.currentUses >= coupon.usageLimit.totalUses) {
    return false;
  }

  return true;
}

export function calculateDiscount(
  coupon: Coupon,
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

// Default coupon for new creation
export const defaultCoupon: Omit<Coupon, "id" | "createdAt" | "updatedAt"> = {
  code: "",
  name: "",
  description: "",
  type: "percentage",
  status: "inactive",
  discountValue: 10,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  usageLimit: {
    totalUses: undefined,
    usesPerCustomer: 1,
    currentUses: 0,
  },
  conditions: {
    applicableTo: "all",
    minOrderValue: 0,
    isFirstOrderOnly: false,
    requiresAuthentication: false,
  },
};

// Coupon type display names
export const couponTypeLabels: Record<CouponType, string> = {
  percentage: "Percentage Off",
  fixed_amount: "Fixed Amount Off",
  free_shipping: "Free Shipping",
  buy_x_get_y: "Buy X Get Y Free",
  first_order: "First Order Discount",
};

// Coupon status display names
export const couponStatusLabels: Record<CouponStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  scheduled: "Scheduled",
};
