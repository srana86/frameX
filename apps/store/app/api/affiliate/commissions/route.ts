/**
 * GET /api/affiliate/commissions - Get commissions for an affiliate
 * Query params: affiliateId (required for merchant), or uses current user's affiliateId
 */

import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import type { AffiliateCommission } from "@/lib/affiliate-types";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const affiliateIdParam = searchParams.get("affiliateId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const commissionsCol = await getMerchantCollectionForAPI<AffiliateCommission>("affiliate_commissions");
    const affiliatesCol = await getMerchantCollectionForAPI("affiliates");
    const ordersCol = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();

    let affiliateId: string | null = null;

    if (affiliateIdParam && user.role === "merchant") {
      // Merchant can view any affiliate's commissions
      affiliateId = affiliateIdParam;
    } else {
      // User can only view their own commissions
      const affiliate = await affiliatesCol.findOne({
        ...baseQuery,
        userId: user.id,
      });
      if (!affiliate) {
        return NextResponse.json({ commissions: [], total: 0, page, limit });
      }
      affiliateId = String(affiliate._id);
    }

    if (!affiliateId) {
      return NextResponse.json({ commissions: [], total: 0, page, limit });
    }

    // Get commissions
    const commissions = await commissionsCol
      .find({ ...baseQuery, affiliateId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await commissionsCol.countDocuments({ ...baseQuery, affiliateId });

    // Enrich with order data
    const enrichedCommissions = await Promise.all(
      commissions.map(async (commission) => {
        let order = null;
        try {
          if (ObjectId.isValid(commission.orderId)) {
            order = await ordersCol.findOne({
              _id: new ObjectId(commission.orderId),
              ...baseQuery,
            });
          }
        } catch (error) {
          console.error("Error fetching order:", error);
        }

        return {
          id: String(commission._id),
          affiliateId: commission.affiliateId,
          orderId: commission.orderId,
          level: commission.level,
          orderTotal: commission.orderTotal,
          commissionPercentage: commission.commissionPercentage,
          commissionAmount: commission.commissionAmount,
          status: commission.status,
          createdAt: commission.createdAt,
          updatedAt: commission.updatedAt,
          order: order
            ? {
                id: String(order._id),
                total: order.total || 0,
                status: order.status,
                createdAt: order.createdAt,
                customer: order.customer,
                courier: order.courier, // Include courier/tracking information
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      commissions: enrichedCommissions,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("GET /api/affiliate/commissions error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch commissions" }, { status: 500 });
  }
}
