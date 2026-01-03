import { NextResponse } from "next/server";
import { getMerchantDatabaseFromSuperAdmin } from "@/lib/super-admin-client";
import { getMerchantIdFromRequest } from "@/lib/merchant-loader";

/**
 * Get merchant database from super-admin
 * GET /api/super-admin/merchants/[id]/database
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: merchantId } = await params;
    
    // Optionally verify the merchantId matches the current merchant context
    const currentMerchantId = await getMerchantIdFromRequest();
    if (currentMerchantId && currentMerchantId !== merchantId) {
      return NextResponse.json(
        { error: "Unauthorized: Merchant ID mismatch" },
        { status: 403 }
      );
    }

    const database = await getMerchantDatabaseFromSuperAdmin(merchantId);
    
    console.log("💾 [my-app] Merchant Database Response:", JSON.stringify(database, null, 2));
    
    if (!database) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(database);
  } catch (error: any) {
    console.error("GET /api/super-admin/merchants/[id]/database error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to get merchant database" },
      { status: 500 }
    );
  }
}

