import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { MongoClient } from "mongodb";

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI || "";
    if (!uri) {
      return NextResponse.json({ error: "MONGODB_URI not configured" }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();

    // Get all databases
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();

    // Get merchant databases info
    let dbInfo: any[] = [];
    try {
      const merchantDatabases = await getCollection("merchant_databases");
      dbInfo = await merchantDatabases.find({}).toArray();
    } catch (error) {
      // Collection might not exist yet
      console.log("merchant_databases collection not found, continuing...");
    }

    // Map database info
    const databasesList = databases
      .filter((db) => db.name !== "admin" && db.name !== "local" && db.name !== "config")
      .map((db) => {
        const info = dbInfo.find((d: any) => d.databaseName === db.name);
        return {
          name: db.name,
          sizeOnDisk: db.sizeOnDisk,
          empty: db.empty,
          merchantId: info?.merchantId || null,
          createdAt: info?.createdAt || null,
          connectionString: info?.connectionString ? "***encrypted***" : null,
        };
      });

    await client.close();

    return NextResponse.json(databasesList);
  } catch (error: any) {
    console.error("GET /api/databases error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get databases" }, { status: 500 });
  }
}
