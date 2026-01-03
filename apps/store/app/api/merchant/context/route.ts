import { NextResponse } from "next/server";
import { loadMerchantData, getCurrentMerchantId } from "@/lib/merchant-loader";

/**
 * GET /api/merchant/context
 * Get current merchant context data
 */
export async function GET(request: Request) {
  try {
    // Get merchant ID from query params or headers
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");

    // Load merchant data
    const context = await loadMerchantData(merchantId || undefined);

    if (!context) {
      return NextResponse.json(
        { error: "Merchant not found or not configured" },
        { status: 404 }
      );
    }

    // Return context (mask sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        merchant: {
          id: context.merchant.id,
          name: context.merchant.name,
          email: context.merchant.email,
          status: context.merchant.status,
          settings: context.merchant.settings,
        },
        database: context.database
          ? {
              id: context.database.id,
              databaseName: context.database.databaseName,
              useSharedDatabase: context.database.useSharedDatabase,
              status: context.database.status,
            }
          : null,
        deployment: context.deployment
          ? {
              id: context.deployment.id,
              deploymentUrl: context.deployment.deploymentUrl,
              deploymentStatus: context.deployment.deploymentStatus,
              deploymentType: context.deployment.deploymentType,
            }
          : null,
        dbName: context.dbName,
        hasConnectionString: !!context.connectionString,
      },
    });
  } catch (error: any) {
    console.error("Error loading merchant context:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load merchant context" },
      { status: 500 }
    );
  }
}

