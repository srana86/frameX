import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { Coupon, CouponStatus } from "@/lib/coupon-types";
import { validateCouponCode } from "@/lib/coupon-types";
import { CACHE_TAGS, CACHE_HEADERS, revalidateCache } from "@/lib/cache-helpers";

// Cache coupons for 30 seconds (they change less frequently)
export const revalidate = 30;
export const dynamic = "force-dynamic";

// GET /api/coupons - Get all coupons
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CouponStatus | null;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const collection = await getCollection<Coupon>("coupons");

    // Build query
    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [{ code: { $regex: search, $options: "i" } }, { name: { $regex: search, $options: "i" } }];
    }

    // Get total count
    const total = await collection.countDocuments(query);

    // Get paginated results
    const coupons = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Update expired status for old coupons
    const now = new Date();
    const updatedCoupons = coupons.map((coupon) => {
      if (coupon.status === "active" && new Date(coupon.endDate) < now) {
        return { ...coupon, status: "expired" as CouponStatus };
      }
      if (coupon.status === "scheduled" && new Date(coupon.startDate) <= now && new Date(coupon.endDate) > now) {
        return { ...coupon, status: "active" as CouponStatus };
      }
      return coupon;
    });

    return NextResponse.json(
      {
        coupons: updatedCoupons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          ...CACHE_HEADERS.SEMI_STATIC,
          "X-Cache-Tags": CACHE_TAGS.COUPONS,
        },
      }
    );
  } catch (error: unknown) {
    console.error("[Coupons API] Error fetching coupons:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

// POST /api/coupons - Create a new coupon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      type,
      status,
      discountValue,
      maxDiscountAmount,
      buyXGetY,
      startDate,
      endDate,
      usageLimit,
      conditions,
    } = body;

    // Validate required fields
    if (!code || !name || !type) {
      return NextResponse.json({ error: "Code, name, and type are required" }, { status: 400 });
    }

    // Validate coupon code format
    const normalizedCode = code.toUpperCase().trim();
    if (!validateCouponCode(normalizedCode)) {
      return NextResponse.json(
        { error: "Invalid coupon code format. Use 3-20 alphanumeric characters, dashes, or underscores." },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const collection = await getCollection<Coupon>("coupons");
    const existing = await collection.findOne({ code: normalizedCode });
    if (existing) {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 400 });
    }

    // Validate discount value
    if (type === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({ error: "Percentage discount must be between 0 and 100" }, { status: 400 });
    }

    if (type === "fixed_amount" && discountValue < 0) {
      return NextResponse.json({ error: "Fixed amount discount must be positive" }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate || new Date());
    const end = new Date(endDate);
    if (end <= start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const now = new Date();
    const couponId = `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine initial status
    let initialStatus: CouponStatus = status || "active";
    if (start > now) {
      initialStatus = "scheduled";
    } else if (end < now) {
      initialStatus = "expired";
    }

    const newCoupon: Coupon = {
      id: couponId,
      code: normalizedCode,
      name,
      description: description || "",
      type,
      status: initialStatus,
      discountValue: Number(discountValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      buyXGetY: type === "buy_x_get_y" ? buyXGetY : undefined,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      usageLimit: {
        totalUses: usageLimit?.totalUses || undefined,
        usesPerCustomer: usageLimit?.usesPerCustomer || 1,
        currentUses: 0,
      },
      conditions: {
        applicableTo: conditions?.applicableTo || "all",
        minOrderValue: conditions?.minOrderValue || 0,
        maxOrderValue: conditions?.maxOrderValue,
        minItems: conditions?.minItems,
        maxItems: conditions?.maxItems,
        categoryIds: conditions?.categoryIds,
        productIds: conditions?.productIds,
        excludedProductIds: conditions?.excludedProductIds,
        excludedCategoryIds: conditions?.excludedCategoryIds,
        customerEmails: conditions?.customerEmails,
        isFirstOrderOnly: conditions?.isFirstOrderOnly || false,
        requiresAuthentication: conditions?.requiresAuthentication || false,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      totalRevenue: 0,
      averageOrderValue: 0,
    };

    await collection.insertOne(newCoupon);

    // Revalidate cache after creating coupon
    await revalidateCache([CACHE_TAGS.COUPONS, CACHE_TAGS.COUPON(newCoupon.id)]);

    console.log(`[Coupons API] Created coupon: ${normalizedCode}`);
    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error: unknown) {
    console.error("[Coupons API] Error creating coupon:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
