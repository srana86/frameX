import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const col = await getCollection("merchants");
    const merchant = await col.findOne({ id });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const { _id, ...data } = merchant as any;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/merchants/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get merchant" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const col = await getCollection("merchants");

    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    delete updateData.id; // Don't update the id

    const result = await col.updateOne(
      { id },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const updated = await col.findOne({ id });
    const { _id, ...data } = updated as any;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PUT /api/merchants/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update merchant" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: merchantId } = await params;

  try {
    // Verify merchant exists first
    const merchantCol = await getCollection("merchants");
    const merchant = await merchantCol.findOne({ id: merchantId });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const deletionResults: Record<string, number> = {};

    // Delete from collections that use 'id' field (core merchant collections)
    const idBasedCollections = [
      { name: "merchants", query: { id: merchantId } },
      { name: "merchant_deployments", query: { $or: [{ merchantId }, { id: merchantId }] } },
      { name: "merchant_databases", query: { $or: [{ merchantId }, { id: merchantId }] } },
      { name: "merchant_subscriptions", query: { merchantId } },
    ];

    for (const { name, query } of idBasedCollections) {
      try {
        const col = await getCollection(name);
        const result = await col.deleteMany(query);
        deletionResults[name] = result.deletedCount;
      } catch (err: any) {
        console.warn(`Could not delete from ${name}:`, err.message);
        deletionResults[name] = 0;
      }
    }

    // Delete from subscription-related collections
    const subscriptionCollections = ["subscription_usage", "subscription_invoices", "subscription_payments"];

    for (const collectionName of subscriptionCollections) {
      try {
        const col = await getCollection(collectionName);
        const result = await col.deleteMany({ merchantId });
        deletionResults[collectionName] = result.deletedCount;
      } catch (err: any) {
        console.warn(`Could not delete from ${collectionName}:`, err.message);
        deletionResults[collectionName] = 0;
      }
    }

    // Delete from merchant-specific data collections (use merchantId)
    const merchantDataCollections = [
      "products",
      "orders",
      "categories",
      "inventory",
      "brand_config",
      "sslcommerz_config",
      "ads_config",
      "oauth_config",
      "pages",
      "hero_slides",
      "reviews",
      "customers",
      "cart_items",
      "wishlist_items",
    ];

    for (const collectionName of merchantDataCollections) {
      try {
        const col = await getCollection(collectionName);
        const result = await col.deleteMany({ merchantId });
        deletionResults[collectionName] = result.deletedCount;
      } catch (err: any) {
        // If collection doesn't exist or has no merchantId field, skip it
        console.warn(`Could not delete from ${collectionName}:`, err.message);
        deletionResults[collectionName] = 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Merchant and all associated data deleted successfully",
      deletedCounts: deletionResults,
    });
  } catch (error: any) {
    console.error("DELETE /api/merchants/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete merchant" }, { status: 500 });
  }
}
