/**
 * GET /api/affiliate/me - Get current user's affiliate information
 * POST /api/affiliate/me - Create affiliate account for current user
 */

import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";
import { generatePromoCode } from "@/lib/affiliate-helpers";
import type { Affiliate } from "@/lib/affiliate-types";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if affiliate system is enabled
    const settingsCol = await getMerchantCollectionForAPI("affiliate_settings");
    const settings = await settingsCol.findOne(await buildMerchantQuery({ id: "affiliate_settings_v1" }));

    if (!settings || !settings.enabled) {
      return NextResponse.json({
        affiliate: null,
        enabled: false,
        message: "Affiliate system is not enabled",
      });
    }

    const affiliatesCol = await getMerchantCollectionForAPI<Affiliate>("affiliates");
    const baseQuery = await buildMerchantQuery();
    const affiliate = await affiliatesCol.findOne({
      ...baseQuery,
      userId: user.id,
    });

    if (!affiliate) {
      return NextResponse.json({
        affiliate: null,
        enabled: true,
      });
    }

    // Calculate actual available balance from delivered orders only (server-side validation)
    const commissionsCol = await getMerchantCollectionForAPI("affiliate_commissions");
    const ordersCol = await getMerchantCollectionForAPI("orders");

    // Get all approved commissions
    const approvedCommissions = await commissionsCol
      .find({
        ...baseQuery,
        affiliateId: String(affiliate._id),
        status: "approved",
      })
      .toArray();

    // Verify these commissions are from delivered orders
    const approvedOrderIds = approvedCommissions.map((c) => c.orderId).filter(Boolean);
    const deliveredOrders =
      approvedOrderIds.length > 0
        ? await ordersCol
            .find({
              ...baseQuery,
              _id: { $in: approvedOrderIds.map((id) => new ObjectId(id)) },
              status: "delivered",
            })
            .toArray()
        : [];

    const deliveredOrderIds = new Set(deliveredOrders.map((o) => String(o._id)));
    const deliveredCommissions = approvedCommissions.filter((c) => deliveredOrderIds.has(c.orderId));

    // Calculate available balance from delivered orders only
    const deliveredEarnings = deliveredCommissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
    const totalWithdrawn = affiliate.totalWithdrawn || 0;
    const actualAvailableBalance = Math.max(0, deliveredEarnings - totalWithdrawn);

    // Update affiliate's availableBalance if it's incorrect
    if (Math.abs((affiliate.availableBalance || 0) - actualAvailableBalance) > 0.01) {
      await affiliatesCol.updateOne(
        { ...baseQuery, _id: affiliate._id },
        { $set: { availableBalance: actualAvailableBalance, totalEarnings: deliveredEarnings } }
      );
    }

    return NextResponse.json({
      affiliate: {
        id: String(affiliate._id),
        userId: affiliate.userId,
        promoCode: affiliate.promoCode,
        status: affiliate.status,
        totalEarnings: deliveredEarnings, // Only delivered earnings
        totalWithdrawn: affiliate.totalWithdrawn || 0,
        availableBalance: actualAvailableBalance, // Calculated from delivered orders only
        totalOrders: affiliate.totalOrders || 0,
        deliveredOrders: affiliate.deliveredOrders || 0,
        currentLevel: affiliate.currentLevel || 1,
        assignedCouponId: affiliate.assignedCouponId,
        createdAt: affiliate.createdAt,
        updatedAt: affiliate.updatedAt,
      },
      enabled: true,
    });
  } catch (error: any) {
    console.error("GET /api/affiliate/me error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch affiliate info" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliatesCol = await getMerchantCollectionForAPI<Affiliate>("affiliates");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    // Check if affiliate already exists
    const existing = await affiliatesCol.findOne({
      ...baseQuery,
      userId: user.id,
    });

    if (existing) {
      return NextResponse.json({ error: "Affiliate account already exists" }, { status: 400 });
    }

    // Generate unique promo code
    let promoCode = generatePromoCode(user.id, user.fullName);
    let attempts = 0;
    while (await affiliatesCol.findOne({ ...baseQuery, promoCode })) {
      promoCode = generatePromoCode(user.id, user.fullName);
      attempts++;
      if (attempts > 10) {
        // Fallback to timestamp-based code
        promoCode = `AFF${Date.now().toString(36).toUpperCase()}`;
        break;
      }
    }

    // Create affiliate record
    const now = new Date().toISOString();
    const newAffiliate: Omit<Affiliate, "id"> & { _id?: ObjectId } = {
      userId: user.id,
      promoCode,
      status: "active",
      totalEarnings: 0,
      totalWithdrawn: 0,
      availableBalance: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      currentLevel: 1,
      createdAt: now,
      updatedAt: now,
    };

    if (merchantId) {
      const { isUsingSharedDatabase } = await import("@/lib/api-helpers");
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        newAffiliate.merchantId = merchantId;
      }
    }

    const result = await affiliatesCol.insertOne(newAffiliate as any);
    const affiliateId = String(result.insertedId);

    return NextResponse.json({
      affiliate: {
        id: affiliateId,
        ...newAffiliate,
      },
    });
  } catch (error: any) {
    console.error("POST /api/affiliate/me error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create affiliate account" }, { status: 500 });
  }
}
