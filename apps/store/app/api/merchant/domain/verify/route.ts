import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { verifyDomainViaSuperAdmin } from "@/lib/super-admin-client";

export async function POST(request: Request) {
  try {
    const user = await requireAuth("merchant");
    const body = await request.json();

    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Use merchantId if available, otherwise fall back to user.id
    const merchantId = user.merchantId || user.id;

    // Verify domain via super-admin proxy
    const result = await verifyDomainViaSuperAdmin(merchantId, domain);

    if (!result.verified) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          misconfigured: result.misconfigured,
          message: result.message || "Domain verification failed. Please check your DNS records and try again.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: result.message || "Domain verified successfully!",
    });
  } catch (error: any) {
    console.error("Error verifying domain:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to verify domain" }, { status: 500 });
  }
}
