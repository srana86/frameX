import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { Coupon, CouponUsageRecord, ApplyCouponRequest, ApplyCouponResponse } from "@/lib/coupon-types";
import { isCouponActive, calculateDiscount } from "@/lib/coupon-types";

// Helper to check if customer has previous orders
// Returns: true = first order, false = has previous orders, null = can't verify (no identifier)
async function checkIsFirstOrder(customerEmail?: string, customerPhone?: string): Promise<boolean | null> {
  if (!customerEmail && !customerPhone) {
    // Can't verify without customer identifier - return null to indicate unknown
    return null;
  }

  try {
    const ordersCollection = await getCollection("orders");

    // Build query to find any existing orders for this customer
    const orConditions: Record<string, unknown>[] = [];

    if (customerEmail) {
      orConditions.push({ "customer.email": customerEmail.toLowerCase() });
    }
    if (customerPhone) {
      // Normalize phone number for comparison
      const normalizedPhone = customerPhone.replace(/\D/g, "").slice(-11);
      orConditions.push(
        { "customer.phone": customerPhone },
        { "customer.phone": normalizedPhone },
        { "customer.phone": { $regex: normalizedPhone.slice(-10) + "$" } }
      );
    }

    if (orConditions.length === 0) {
      return null;
    }

    // Check if any order exists for this customer
    const existingOrder = await ordersCollection.findOne({ $or: orConditions });

    // If no existing order found, this IS a first order
    return existingOrder === null;
  } catch (error) {
    console.error("[Coupons API] Error checking first order status:", error);
    // If error, return null to indicate we couldn't verify
    return null;
  }
}

// POST /api/coupons/apply - Validate and apply a coupon
export async function POST(request: Request) {
  try {
    const body: ApplyCouponRequest = await request.json();
    const { code, cartSubtotal, cartItems, customerEmail, customerPhone } = body;

    if (!code) {
      return NextResponse.json<ApplyCouponResponse>({
        success: false,
        discount: 0,
        discountType: "percentage",
        message: "Please enter a coupon code",
        error: "missing_code",
      });
    }

    const normalizedCode = code.toUpperCase().trim();
    const collection = await getCollection<Coupon>("coupons");

    // Find the coupon
    const coupon = await collection.findOne({ code: normalizedCode });

    if (!coupon) {
      return NextResponse.json<ApplyCouponResponse>({
        success: false,
        discount: 0,
        discountType: "percentage",
        message: "Invalid coupon code",
        error: "invalid_code",
      });
    }

    // Check if coupon is active
    if (!isCouponActive(coupon)) {
      const now = new Date();
      const startDate = new Date(coupon.startDate);
      const endDate = new Date(coupon.endDate);

      if (coupon.status === "inactive") {
        return NextResponse.json<ApplyCouponResponse>({
          success: false,
          discount: 0,
          discountType: coupon.type,
          message: "This coupon is currently inactive",
          error: "inactive",
        });
      }

      if (now < startDate) {
        return NextResponse.json<ApplyCouponResponse>({
          success: false,
          discount: 0,
          discountType: coupon.type,
          message: `This coupon is not active yet. It starts on ${startDate.toLocaleDateString()}`,
          error: "not_started",
        });
      }

      if (now > endDate) {
        return NextResponse.json<ApplyCouponResponse>({
          success: false,
          discount: 0,
          discountType: coupon.type,
          message: "This coupon has expired",
          error: "expired",
        });
      }

      if (coupon.usageLimit.totalUses && coupon.usageLimit.currentUses >= coupon.usageLimit.totalUses) {
        return NextResponse.json<ApplyCouponResponse>({
          success: false,
          discount: 0,
          discountType: coupon.type,
          message: "This coupon has reached its usage limit",
          error: "usage_limit_reached",
        });
      }
    }

    // Check customer-specific usage limits
    if (coupon.usageLimit.usesPerCustomer && (customerEmail || customerPhone)) {
      const usageCollection = await getCollection<CouponUsageRecord>("coupon_usage");
      const customerQuery: Record<string, unknown> = { couponId: coupon.id };

      if (customerEmail) {
        customerQuery.customerEmail = customerEmail;
      } else if (customerPhone) {
        customerQuery.customerPhone = customerPhone;
      }

      const customerUses = await usageCollection.countDocuments(customerQuery);

      if (customerUses >= coupon.usageLimit.usesPerCustomer) {
        return NextResponse.json<ApplyCouponResponse>({
          success: false,
          discount: 0,
          discountType: coupon.type,
          message: `You have already used this coupon ${customerUses} time(s)`,
          error: "customer_usage_limit",
        });
      }
    }

    // Check conditions
    const { conditions } = coupon;

    // First order only check - automatically verify from database
    if (conditions.isFirstOrderOnly) {
      const isFirstOrder = await checkIsFirstOrder(customerEmail, customerPhone);

      // isFirstOrder: true = first order, false = has previous orders, null = can't verify
      if (isFirstOrder === false) {
        // Customer definitely has previous orders
        return NextResponse.json<ApplyCouponResponse>({
          success: false,
          discount: 0,
          discountType: coupon.type,
          message: "This coupon is only valid for first-time customers",
          error: "first_order_only",
        });
      }
      // If null (can't verify) or true (first order), allow the coupon
      // Will be re-verified at checkout with customer info
    }

    // Authentication check
    if (conditions.requiresAuthentication && !customerEmail) {
      return NextResponse.json<ApplyCouponResponse>({
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: "Please log in to use this coupon",
        error: "requires_auth",
      });
    }

    // Minimum order value check
    if (conditions.minOrderValue && cartSubtotal < conditions.minOrderValue) {
      return NextResponse.json<ApplyCouponResponse>({
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: `Minimum order value of ${conditions.minOrderValue} required`,
        error: "min_order_not_met",
      });
    }

    // Maximum order value check
    if (conditions.maxOrderValue && cartSubtotal > conditions.maxOrderValue) {
      return NextResponse.json<ApplyCouponResponse>({
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: "Order value exceeds coupon limit",
        error: "max_order_exceeded",
      });
    }

    // Minimum items check
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (conditions.minItems && totalItems < conditions.minItems) {
      return NextResponse.json<ApplyCouponResponse>({
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: `Minimum ${conditions.minItems} items required in cart`,
        error: "min_items_not_met",
      });
    }

    // Customer email restriction
    if (conditions.customerEmails && conditions.customerEmails.length > 0) {
      if (!customerEmail || !conditions.customerEmails.includes(customerEmail.toLowerCase())) {
        return NextResponse.json<ApplyCouponResponse>({
          success: false,
          discount: 0,
          discountType: coupon.type,
          message: "This coupon is not available for your account",
          error: "customer_restricted",
        });
      }
    }

    // Calculate applicable subtotal based on conditions
    let applicableSubtotal = cartSubtotal;

    if (conditions.applicableTo === "products" && conditions.productIds?.length) {
      applicableSubtotal = cartItems
        .filter((item) => conditions.productIds!.includes(item.productId))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    } else if (conditions.applicableTo === "categories" && conditions.categoryIds?.length) {
      applicableSubtotal = cartItems
        .filter((item) => item.categoryId && conditions.categoryIds!.includes(item.categoryId))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    // Exclude specific products/categories
    if (conditions.excludedProductIds?.length) {
      const excludedAmount = cartItems
        .filter((item) => conditions.excludedProductIds!.includes(item.productId))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
      applicableSubtotal -= excludedAmount;
    }

    if (applicableSubtotal <= 0) {
      return NextResponse.json<ApplyCouponResponse>({
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: "No eligible products in cart for this coupon",
        error: "no_eligible_products",
      });
    }

    // Calculate the discount
    const shippingCost = 0; // This will be passed from checkout when free shipping is relevant
    const { discount, freeShipping } = calculateDiscount(coupon, cartSubtotal, applicableSubtotal, shippingCost);

    // Handle Buy X Get Y
    let freeItems: Array<{ productId: string; quantity: number }> | undefined;
    if (coupon.type === "buy_x_get_y" && coupon.buyXGetY) {
      const { buyQuantity, getQuantity, getProductIds, maxSets } = coupon.buyXGetY;
      const eligibleSets = Math.floor(totalItems / buyQuantity);
      const actualSets = maxSets ? Math.min(eligibleSets, maxSets) : eligibleSets;

      if (actualSets > 0) {
        // If specific products are defined for free items
        if (getProductIds && getProductIds.length > 0) {
          freeItems = getProductIds.map((productId) => ({
            productId,
            quantity: getQuantity * actualSets,
          }));
        }
      }
    }

    // Build success response
    const response: ApplyCouponResponse = {
      success: true,
      coupon,
      discount,
      discountType: coupon.type,
      message: getCouponSuccessMessage(coupon, discount, freeShipping),
      freeItems,
      freeShipping,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("[Coupons API] Error applying coupon:", error);
    return NextResponse.json<ApplyCouponResponse>(
      {
        success: false,
        discount: 0,
        discountType: "percentage",
        message: "Failed to apply coupon. Please try again.",
        error: "server_error",
      },
      { status: 500 }
    );
  }
}

function getCouponSuccessMessage(coupon: Coupon, discount: number, freeShipping: boolean): string {
  switch (coupon.type) {
    case "percentage":
      return `${coupon.discountValue}% off applied! You save ${discount.toFixed(2)}`;
    case "fixed_amount":
      return `${discount.toFixed(2)} off applied!`;
    case "free_shipping":
      return "Free shipping applied!";
    case "buy_x_get_y":
      return `Buy ${coupon.buyXGetY?.buyQuantity} Get ${coupon.buyXGetY?.getQuantity} Free applied!`;
    case "first_order":
      return `First order discount of ${coupon.discountValue}% applied! You save ${discount.toFixed(2)}`;
    default:
      return `Coupon applied! You save ${discount.toFixed(2)}`;
  }
}
