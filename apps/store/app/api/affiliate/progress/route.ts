/**
 * GET /api/affiliate/progress - Get affiliate progress and level information
 */

import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";
import { calculateAffiliateLevel, getNextLevelProgress } from "@/lib/affiliate-helpers";
import type { AffiliateSettings } from "@/lib/affiliate-types";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliatesCol = await getMerchantCollectionForAPI("affiliates");
    const settingsCol = await getMerchantCollectionForAPI<AffiliateSettings>("affiliate_settings");
    const baseQuery = await buildMerchantQuery();

    const affiliate = await affiliatesCol.findOne({
      ...baseQuery,
      userId: user.id,
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const settings = await settingsCol.findOne(
      await buildMerchantQuery({ id: "affiliate_settings_v1" })
    );

    if (!settings) {
      return NextResponse.json({ error: "Affiliate settings not found" }, { status: 404 });
    }

    const deliveredOrders = affiliate.deliveredOrders || 0;
    const currentLevel = affiliate.currentLevel || 1;
    
    // Calculate actual level based on current delivered orders
    const actualLevel = calculateAffiliateLevel(deliveredOrders, settings);
    
    // Get next level progress
    const nextLevelInfo = getNextLevelProgress(actualLevel, deliveredOrders, settings);

    return NextResponse.json({
      currentLevel: actualLevel,
      deliveredOrders,
      nextLevel: nextLevelInfo.nextLevel,
      nextLevelRequiredSales: nextLevelInfo.requiredSales,
      progress: nextLevelInfo.progress,
      settings: {
        commissionLevels: settings.commissionLevels,
      },
    });
  } catch (error: any) {
    console.error("GET /api/affiliate/progress error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch progress" }, { status: 500 });
  }
}

