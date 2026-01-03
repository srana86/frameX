import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

/**
 * Get merchant database by merchantId
 * GET /api/merchants/[id]/database
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;
    console.log(`\n🔍 [Super-Admin API] GET /api/merchants/${merchantId}/database`);
    console.log(`📋 Requesting database for merchantId: ${merchantId}`);

    // Get merchant database
    const databasesCol = await getCollection("merchant_databases");
    console.log(`🔎 Querying merchant_databases collection for merchantId: ${merchantId}`);
    const database = await databasesCol.findOne({
      $or: [{ merchantId }, { id: merchantId }],
    });

    if (!database) {
      console.log(`❌ No database found for merchantId: ${merchantId}`);
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    console.log(`✅ Found database in database (before masking):`, JSON.stringify(database, null, 2));

    const { _id, ...databaseData } = database as any;

    // Don't expose the connection string for security
    const result = {
      ...databaseData,
      connectionString: databaseData.connectionString ? "***encrypted***" : undefined,
    };

    console.log(`\n💾 [Super-Admin API] Final Database Response Data (connection string masked):`);
    console.log(JSON.stringify(result, null, 2));
    console.log(`✅ [Super-Admin API] Returning database data for merchantId: ${merchantId}\n`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/merchants/[id]/database error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get merchant database" }, { status: 500 });
  }
}
