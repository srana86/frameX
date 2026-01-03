import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import type { FooterCategory } from "../route";

export async function GET() {
  try {
    const col = await getMerchantCollectionForAPI<FooterCategory>("footer_categories");
    const query = await buildMerchantQuery();
    const categories = await col.find(query).sort({ order: 1, name: 1 }).toArray();
    
    // Remove MongoDB _id field
    const categoriesWithoutId = categories.map(({ _id, ...cat }) => cat);
    
    return NextResponse.json(categoriesWithoutId);
  } catch (error: any) {
    console.error("GET /api/pages/categories error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI<FooterCategory>("footer_categories");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    // Check if category already exists
    const existing = await col.findOne({ ...baseQuery, name: body.name });
    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }

    // Get max order value
    const maxOrderDoc = await col.find(baseQuery).sort({ order: -1 }).limit(1).toArray();
    const maxOrder = maxOrderDoc.length > 0 ? maxOrderDoc[0].order : 0;

    const now = new Date().toISOString();
    const newCategory: any = {
      id: body.name.toLowerCase().replace(/\s+/g, "-"),
      name: body.name,
      order: body.order ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        newCategory.merchantId = merchantId;
      }
    }

    await col.insertOne(newCategory);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/pages/categories error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create category" }, { status: 500 });
  }
}

