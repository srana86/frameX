/**
 * POST /api/affiliate/set-cookie - Set affiliate cookie from promo code (public, no auth required)
 */

import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { createAffiliateCookieData, getAffiliateCookieName } from "@/lib/affiliate-helpers";
import type { Affiliate, AffiliateSettings } from "@/lib/affiliate-types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promoCode } = body;

    if (!promoCode || typeof promoCode !== "string") {
      return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
    }

    // Get affiliate settings to check if enabled
    const settingsCol = await getMerchantCollectionForAPI<AffiliateSettings>("affiliate_settings");
    const settings = await settingsCol.findOne(
      await buildMerchantQuery({ id: "affiliate_settings_v1" })
    );

    if (!settings || !settings.enabled) {
      return NextResponse.json({ error: "Affiliate system is not enabled" }, { status: 400 });
    }

    // Find affiliate by promo code
    const affiliatesCol = await getMerchantCollectionForAPI<Affiliate>("affiliates");
    const baseQuery = await buildMerchantQuery();
    const affiliate = await affiliatesCol.findOne({
      ...baseQuery,
      promoCode: promoCode.toUpperCase(),
      status: "active",
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
    }

    // Create cookie data
    const cookieData = createAffiliateCookieData(
      affiliate.promoCode,
      String(affiliate._id),
      settings.cookieExpiryDays || 30
    );

    // Set cookie
    const response = NextResponse.json({ success: true, promoCode: affiliate.promoCode });
    const cookieName = getAffiliateCookieName();
    const expiryDate = new Date(cookieData.expiry);
    const cookieValue = encodeURIComponent(JSON.stringify(cookieData));

    response.cookies.set(cookieName, cookieValue, {
      httpOnly: false, // Allow client-side access for display
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiryDate,
      path: "/",
      maxAge: settings.cookieExpiryDays * 24 * 60 * 60, // Also set maxAge for better browser support
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/affiliate/set-cookie error:", error);
    return NextResponse.json({ error: error?.message || "Failed to set affiliate cookie" }, { status: 500 });
  }
}

