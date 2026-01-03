import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { removeDomainViaSuperAdmin } from "@/lib/super-admin-client";

/**
 * Remove domain from project
 * Uses super-admin proxy API for domain management
 */
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth("merchant");
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Use merchantId if available, otherwise fall back to user.id
    const merchantId = user.merchantId || user.id;

    // Remove domain via super-admin proxy
    const result = await removeDomainViaSuperAdmin(merchantId, domain);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error removing domain:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to remove domain" }, { status: 500 });
  }
}
