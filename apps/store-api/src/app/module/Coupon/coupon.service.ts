/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Coupon } from "./coupon.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TCoupon } from "./coupon.interface";

// Get all coupons with pagination, filter, and search
const getAllCouponsFromDB = async (query: Record<string, unknown>) => {
  const couponQuery = new QueryBuilder(Coupon.find(), query)
    .search(["code", "name", "description"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await couponQuery.modelQuery;
  const meta = await couponQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

// Get single coupon by ID or code
const getSingleCouponFromDB = async (idOrCode: string) => {
  const result = await Coupon.findOne({
    $or: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Coupon not found");
  }

  return result;
};

// Create coupon
const createCouponIntoDB = async (payload: TCoupon) => {
  // Generate ID if not provided
  if (!payload.id) {
    payload.id = `CPN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  // Normalize code to uppercase
  if (payload.code) {
    payload.code = payload.code.toUpperCase().trim();
  }

  // Check if code already exists
  const existingCoupon = await Coupon.findOne({ code: payload.code });
  if (existingCoupon) {
    throw new AppError(StatusCodes.CONFLICT, "Coupon code already exists");
  }

  // Initialize usage limit if not provided
  if (!payload.usageLimit) {
    payload.usageLimit = { currentUses: 0 };
  } else {
    payload.usageLimit.currentUses = payload.usageLimit.currentUses || 0;
  }

  const result = await Coupon.create(payload);
  return result;
};

// Update coupon
const updateCouponIntoDB = async (
  idOrCode: string,
  payload: Partial<TCoupon>
) => {
  // Normalize code if provided
  if (payload.code) {
    payload.code = payload.code.toUpperCase().trim();

    // Check if code already exists for another coupon
    const existingCoupon = await Coupon.findOne({
      code: payload.code,
      id: { $ne: idOrCode },
    });
    if (existingCoupon) {
      throw new AppError(StatusCodes.CONFLICT, "Coupon code already exists");
    }
  }

  const result = await Coupon.findOneAndUpdate(
    {
      $or: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
    },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Coupon not found");
  }

  return result;
};

// Delete coupon
const deleteCouponFromDB = async (idOrCode: string) => {
  const result = await Coupon.findOneAndDelete({
    $or: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Coupon not found");
  }

  return { success: true, message: "Coupon deleted" };
};

// Apply coupon to cart
const applyCouponToCart = async (payload: any) => {
  const {
    code,
    cartSubtotal,
    cartItems,
    customerEmail,
    customerPhone,
    isFirstOrder,
  } = payload;

  if (!code) {
    return {
      success: false,
      discount: 0,
      discountType: "percentage" as const,
      message: "Please enter a coupon code",
      error: "missing_code",
    };
  }

  const normalizedCode = code.toUpperCase().trim();
  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    return {
      success: false,
      discount: 0,
      discountType: "percentage" as const,
      message: "Invalid coupon code",
      error: "invalid_code",
    };
  }

  const { isCouponActive, calculateDiscount } = await import("./coupon.helper");

  // Check if coupon is active
  if (!isCouponActive(coupon)) {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (coupon.status === "inactive") {
      return {
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: "This coupon is currently inactive",
        error: "inactive",
      };
    }

    if (now < startDate) {
      return {
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: `This coupon is not active yet. It starts on ${startDate.toLocaleDateString()}`,
        error: "not_started",
      };
    }

    if (now > endDate) {
      return {
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: "This coupon has expired",
        error: "expired",
      };
    }

    if (
      coupon.usageLimit.totalUses &&
      (coupon.usageLimit.currentUses || 0) >= coupon.usageLimit.totalUses
    ) {
      return {
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: "This coupon has reached its usage limit",
        error: "usage_limit_reached",
      };
    }
  }

  // Check customer-specific usage limits
  if (coupon.usageLimit.usesPerCustomer && (customerEmail || customerPhone)) {
    const { CouponUsageRecordModel } = await import("./couponUsage.model");
    const customerQuery: any = { couponId: coupon.id };

    if (customerEmail) {
      customerQuery.customerEmail = customerEmail.toLowerCase();
    } else if (customerPhone) {
      customerQuery.customerPhone = customerPhone;
    }

    const customerUses =
      await CouponUsageRecordModel.countDocuments(customerQuery);

    if (customerUses >= (coupon.usageLimit.usesPerCustomer || 0)) {
      return {
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: `You have already used this coupon ${customerUses} time(s)`,
        error: "customer_usage_limit",
      };
    }
  }

  // Check conditions
  const { conditions } = coupon;

  // First order only check
  if (conditions.firstOrderOnly) {
    if (isFirstOrder === false) {
      return {
        success: false,
        discount: 0,
        discountType: coupon.type,
        message: "This coupon is only valid for first-time customers",
        error: "first_order_only",
      };
    }
  }

  // Minimum purchase amount check
  if (
    conditions.minPurchaseAmount &&
    cartSubtotal < conditions.minPurchaseAmount
  ) {
    return {
      success: false,
      discount: 0,
      discountType: coupon.type,
      message: `Minimum order value of ${conditions.minPurchaseAmount} required`,
      error: "min_order_not_met",
    };
  }

  // Maximum purchase amount check
  if (
    conditions.maxPurchaseAmount &&
    cartSubtotal > conditions.maxPurchaseAmount
  ) {
    return {
      success: false,
      discount: 0,
      discountType: coupon.type,
      message: "Order value exceeds coupon limit",
      error: "max_order_exceeded",
    };
  }

  // Calculate applicable subtotal based on conditions
  let applicableSubtotal = cartSubtotal;

  if (conditions.applicableCategories?.length) {
    applicableSubtotal = cartItems
      .filter(
        (item: any) =>
          item.categoryId &&
          conditions.applicableCategories!.includes(item.categoryId)
      )
      .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  }

  if (conditions.applicableProducts?.length) {
    applicableSubtotal = cartItems
      .filter((item: any) =>
        conditions.applicableProducts!.includes(item.productId)
      )
      .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  }

  // Exclude specific products/categories
  if (conditions.excludedProducts?.length) {
    const excludedAmount = cartItems
      .filter((item: any) =>
        conditions.excludedProducts!.includes(item.productId)
      )
      .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    applicableSubtotal -= excludedAmount;
  }

  if (conditions.excludedCategories?.length) {
    const excludedAmount = cartItems
      .filter(
        (item: any) =>
          item.categoryId &&
          conditions.excludedCategories!.includes(item.categoryId)
      )
      .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    applicableSubtotal -= excludedAmount;
  }

  if (applicableSubtotal <= 0) {
    return {
      success: false,
      discount: 0,
      discountType: coupon.type,
      message: "No eligible products in cart for this coupon",
      error: "no_eligible_products",
    };
  }

  // Calculate the discount
  const shippingCost = 0; // This will be passed from checkout when free shipping is relevant
  const { discount, freeShipping } = calculateDiscount(
    coupon,
    cartSubtotal,
    applicableSubtotal,
    shippingCost
  );

  // Handle Buy X Get Y
  let freeItems: Array<{ productId: string; quantity: number }> | undefined;
  if (coupon.type === "buy_x_get_y" && coupon.buyXGetY) {
    const totalItems = cartItems.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    const { buyQuantity, getQuantity } = coupon.buyXGetY;
    const eligibleSets = Math.floor(totalItems / buyQuantity);

    if (eligibleSets > 0 && coupon.buyXGetY.productId) {
      freeItems = [
        {
          productId: coupon.buyXGetY.productId,
          quantity: getQuantity * eligibleSets,
        },
      ];
    }
  }

  // Build success response
  const message = getCouponSuccessMessage(coupon, discount, freeShipping);

  return {
    success: true,
    coupon,
    discount,
    discountType: coupon.type,
    message,
    freeItems,
    freeShipping,
  };
};

function getCouponSuccessMessage(
  coupon: TCoupon,
  discount: number,
  freeShipping: boolean
): string {
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

// Record coupon usage
const recordCouponUsage = async (payload: any) => {
  const { CouponUsageRecordModel } = await import("./couponUsage.model");
  const {
    couponId,
    couponCode,
    orderId,
    customerId,
    customerEmail,
    customerPhone,
    discountApplied,
    orderTotal,
  } = payload;

  if (!couponId || !orderId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Coupon ID and Order ID are required"
    );
  }

  // Check if usage already recorded for this order
  const existingUsage = await CouponUsageRecordModel.findOne({
    orderId,
    couponId,
  });
  if (existingUsage) {
    return {
      success: true,
      message: "Usage already recorded",
    };
  }

  // Record the usage
  const usageId = `USG${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  const usageRecord = await CouponUsageRecordModel.create({
    id: usageId,
    couponId,
    couponCode: couponCode.toUpperCase(),
    orderId,
    customerId,
    customerEmail: customerEmail?.toLowerCase(),
    customerPhone,
    discountApplied,
    orderTotal,
  });

  // Increment usage count on coupon
  const coupon = await Coupon.findOne({ id: couponId });
  if (coupon) {
    const newCurrentUses = (coupon.usageLimit.currentUses || 0) + 1;
    const newTotalRevenue = (coupon.totalRevenue || 0) + orderTotal;
    const totalOrders = newCurrentUses;
    const newAverageOrderValue = newTotalRevenue / totalOrders;

    await Coupon.updateOne(
      { id: couponId },
      {
        $set: {
          "usageLimit.currentUses": newCurrentUses,
          totalRevenue: newTotalRevenue,
          averageOrderValue: Math.round(newAverageOrderValue * 100) / 100,
        },
      }
    );

    // Check if usage limit reached and update status
    if (
      coupon.usageLimit.totalUses &&
      newCurrentUses >= coupon.usageLimit.totalUses
    ) {
      await Coupon.updateOne(
        { id: couponId },
        { $set: { status: "inactive" } }
      );
    }
  }

  return {
    success: true,
    usageRecord,
  };
};

// Get coupon usage records
const getCouponUsageRecords = async (query: Record<string, unknown>) => {
  const { CouponUsageRecordModel } = await import("./couponUsage.model");
  const { couponId, page = 1, limit = 20 } = query;

  if (!couponId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Coupon ID is required");
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const total = await CouponUsageRecordModel.countDocuments({
    couponId: String(couponId),
  });
  const records = await CouponUsageRecordModel.find({
    couponId: String(couponId),
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    records,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage: Math.ceil(total / limitNum),
    },
  };
};

export const CouponServices = {
  getAllCouponsFromDB,
  getSingleCouponFromDB,
  createCouponIntoDB,
  updateCouponIntoDB,
  deleteCouponFromDB,
  applyCouponToCart,
  recordCouponUsage,
  getCouponUsageRecords,
};
