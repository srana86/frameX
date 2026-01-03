import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import type { Coupon, CouponUsageRecord } from "@/lib/coupon-types";

interface RecordUsageRequest {
  couponId: string;
  couponCode: string;
  orderId: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  discountApplied: number;
  orderTotal: number;
}

// POST /api/coupons/record-usage - Record coupon usage after order completion
export async function POST(request: Request) {
  try {
    const body: RecordUsageRequest = await request.json();
    const { couponId, couponCode, orderId, customerId, customerEmail, customerPhone, discountApplied, orderTotal } = body;

    if (!couponId || !orderId) {
      return NextResponse.json({ error: "Coupon ID and Order ID are required" }, { status: 400 });
    }

    const couponsCollection = await getCollection<Coupon>("coupons");
    const usageCollection = await getCollection<CouponUsageRecord>("coupon_usage");

    // Check if usage already recorded for this order
    const existingUsage = await usageCollection.findOne({ orderId, couponId });
    if (existingUsage) {
      return NextResponse.json({
        success: true,
        message: "Usage already recorded",
      });
    }

    // Record the usage
    const usageRecord: CouponUsageRecord = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      couponId,
      couponCode: couponCode.toUpperCase(),
      orderId,
      customerId,
      customerEmail: customerEmail?.toLowerCase(),
      customerPhone,
      discountApplied,
      orderTotal,
      usedAt: new Date().toISOString(),
    };

    await usageCollection.insertOne(usageRecord);

    // Increment usage count on coupon
    const coupon = await couponsCollection.findOne({ id: couponId });
    if (coupon) {
      const newCurrentUses = (coupon.usageLimit.currentUses || 0) + 1;
      const newTotalRevenue = (coupon.totalRevenue || 0) + orderTotal;
      const totalOrders = newCurrentUses;
      const newAverageOrderValue = newTotalRevenue / totalOrders;

      await couponsCollection.updateOne(
        { id: couponId },
        {
          $set: {
            "usageLimit.currentUses": newCurrentUses,
            totalRevenue: newTotalRevenue,
            averageOrderValue: Math.round(newAverageOrderValue * 100) / 100,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      // Check if usage limit reached and update status
      if (coupon.usageLimit.totalUses && newCurrentUses >= coupon.usageLimit.totalUses) {
        await couponsCollection.updateOne({ id: couponId }, { $set: { status: "inactive" } });
      }
    }

    console.log(`[Coupons API] Recorded usage for coupon ${couponCode} on order ${orderId}`);
    return NextResponse.json({ success: true, usageRecord });
  } catch (error: unknown) {
    console.error("[Coupons API] Error recording usage:", error);
    return NextResponse.json({ error: "Failed to record coupon usage" }, { status: 500 });
  }
}

// GET /api/coupons/record-usage - Get usage records for a coupon
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get("couponId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!couponId) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const usageCollection = await getCollection<CouponUsageRecord>("coupon_usage");

    const total = await usageCollection.countDocuments({ couponId });
    const records = await usageCollection
      .find({ couponId })
      .sort({ usedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("[Coupons API] Error fetching usage records:", error);
    return NextResponse.json({ error: "Failed to fetch usage records" }, { status: 500 });
  }
}
