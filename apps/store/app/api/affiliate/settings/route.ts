/**
 * GET /api/affiliate/settings - Get affiliate settings (merchant only)
 * PUT /api/affiliate/settings - Update affiliate settings (merchant only)
 */

import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";
import type { AffiliateSettings, CommissionLevel } from "@/lib/affiliate-types";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "merchant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsCol = await getMerchantCollectionForAPI<AffiliateSettings>("affiliate_settings");
    const baseQuery = await buildMerchantQuery({ id: "affiliate_settings_v1" });
    const settings = await settingsCol.findOne(baseQuery);

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        settings: {
          id: "affiliate_settings_v1",
          enabled: false,
          minWithdrawalAmount: 100,
          commissionLevels: {
            1: { percentage: 5, enabled: true },
          },
          salesThresholds: {
            1: 0,
            2: 10,
            3: 25,
            4: 50,
            5: 100,
          },
          cookieExpiryDays: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      settings: {
        id: settings.id,
        enabled: settings.enabled,
        minWithdrawalAmount: settings.minWithdrawalAmount,
        commissionLevels: settings.commissionLevels,
        salesThresholds: (settings as any).salesThresholds || {},
        cookieExpiryDays: settings.cookieExpiryDays,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("GET /api/affiliate/settings error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "merchant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, minWithdrawalAmount, commissionLevels, salesThresholds, cookieExpiryDays } = body;

    const settingsCol = await getMerchantCollectionForAPI<AffiliateSettings>("affiliate_settings");
    const baseQuery = await buildMerchantQuery({ id: "affiliate_settings_v1" });
    const merchantId = await getMerchantIdForAPI();

    const now = new Date().toISOString();
    const existing = await settingsCol.findOne(baseQuery);

    const settingsData: Partial<AffiliateSettings> = {
      id: "affiliate_settings_v1",
      enabled: enabled ?? false,
      minWithdrawalAmount: minWithdrawalAmount ?? 100,
      commissionLevels: commissionLevels || {},
      salesThresholds: salesThresholds || {},
      cookieExpiryDays: cookieExpiryDays ?? 30,
      updatedAt: now,
    };

    if (merchantId) {
      const { isUsingSharedDatabase } = await import("@/lib/api-helpers");
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        settingsData.merchantId = merchantId;
      }
    }

    if (existing) {
      await settingsCol.updateOne(baseQuery, { $set: settingsData });
    } else {
      await settingsCol.insertOne({
        ...settingsData,
        createdAt: now,
      } as any);
    }

    return NextResponse.json({
      settings: {
        id: "affiliate_settings_v1",
        ...settingsData,
        createdAt: existing?.createdAt || now,
      },
    });
  } catch (error: any) {
    console.error("PUT /api/affiliate/settings error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update settings" }, { status: 500 });
  }
}

