/**
 * POST /api/affiliate/assign-coupon - Assign a coupon to an affiliate (merchant only)
 */

import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "merchant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { affiliateId, couponId } = body;

    if (!affiliateId) {
      return NextResponse.json({ error: "Affiliate ID is required" }, { status: 400 });
    }

    if (!ObjectId.isValid(affiliateId)) {
      return NextResponse.json({ error: "Invalid affiliate ID format" }, { status: 400 });
    }

    const affiliatesCol = await getMerchantCollectionForAPI("affiliates");
    const baseQuery = await buildMerchantQuery();

    // Verify affiliate exists
    const affiliate = await affiliatesCol.findOne({
      ...baseQuery,
      _id: new ObjectId(affiliateId),
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    // Normalize couponId: convert "none", empty string, or null to null
    const normalizedCouponId = couponId && couponId !== "none" && couponId !== "" ? couponId : null;

    // If couponId is provided, verify it exists
    // Note: Coupons use a custom 'id' field (not MongoDB _id), so we query by 'id' directly
    if (normalizedCouponId) {
      try {
        // Coupons use getCollection, not getMerchantCollectionForAPI
        const { getCollection } = await import("@/lib/mongodb");
        const couponsCol = await getCollection("coupons");
        const coupon = await couponsCol.findOne({
          id: normalizedCouponId,
        });

        if (!coupon) {
          return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
        }
      } catch (couponError: any) {
        console.error("Error verifying coupon:", couponError);
        return NextResponse.json({ error: "Failed to verify coupon: " + (couponError?.message || "Unknown error") }, { status: 500 });
      }
    }

    // Update affiliate with coupon assignment
    await affiliatesCol.updateOne(
      { ...baseQuery, _id: new ObjectId(affiliateId) },
      {
        $set: {
          assignedCouponId: normalizedCouponId,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/affiliate/assign-coupon error:", error);
    return NextResponse.json({ error: error?.message || "Failed to assign coupon" }, { status: 500 });
  }
}
