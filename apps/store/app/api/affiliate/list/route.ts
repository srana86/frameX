/**
 * GET /api/affiliate/list - Get all affiliates (merchant only)
 */

import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import type { Affiliate } from "@/lib/affiliate-types";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "merchant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const affiliatesCol = await getMerchantCollectionForAPI<Affiliate>("affiliates");
    const usersCol = await getMerchantCollectionForAPI("users");
    const commissionsCol = await getMerchantCollectionForAPI("affiliate_commissions");
    const baseQuery = await buildMerchantQuery();

    // Get all affiliates
    const affiliates = await affiliatesCol
      .find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await affiliatesCol.countDocuments(baseQuery);

    // Enrich with user data and commission stats
    const enrichedAffiliates = await Promise.all(
      affiliates.map(async (affiliate) => {
        // Get user info
        let user = null;
        try {
          if (ObjectId.isValid(affiliate.userId)) {
            user = await usersCol.findOne({ _id: new ObjectId(affiliate.userId), ...baseQuery });
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }

        // Get commission stats
        const affiliateId = String(affiliate._id);
        const totalCommissions = await commissionsCol.countDocuments({
          ...baseQuery,
          affiliateId,
        });
        const pendingCommissions = await commissionsCol.countDocuments({
          ...baseQuery,
          affiliateId,
          status: "pending",
        });
        const completedCommissions = await commissionsCol.countDocuments({
          ...baseQuery,
          affiliateId,
          status: "approved",
        });

        return {
          id: String(affiliate._id),
          userId: affiliate.userId,
          promoCode: affiliate.promoCode,
          status: affiliate.status,
          totalEarnings: affiliate.totalEarnings || 0,
          totalWithdrawn: affiliate.totalWithdrawn || 0,
          availableBalance: affiliate.availableBalance || 0,
          totalOrders: affiliate.totalOrders || 0,
          deliveredOrders: affiliate.deliveredOrders || 0,
          currentLevel: affiliate.currentLevel || 1,
          assignedCouponId: affiliate.assignedCouponId,
          createdAt: affiliate.createdAt,
          updatedAt: affiliate.updatedAt,
          user: user
            ? {
                id: String(user._id),
                fullName: user.fullName || "Unknown",
                email: user.email,
                phone: user.phone,
              }
            : {
                id: affiliate.userId,
                fullName: "Unknown User",
                email: undefined,
                phone: undefined,
              },
          totalCommissions,
          pendingCommissions,
          completedCommissions,
        };
      })
    );

    return NextResponse.json({
      affiliates: enrichedAffiliates,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("GET /api/affiliate/list error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch affiliates" }, { status: 500 });
  }
}

