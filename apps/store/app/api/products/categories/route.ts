import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export interface ProductCategory {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    const col = await getMerchantCollectionForAPI<ProductCategory>("product_categories");
    const query = await buildMerchantQuery();

    // Get total count for pagination
    const totalCount = await col.countDocuments(query);

    // Fetch categories with pagination
    const categories = await col.find(query).sort({ order: 1, name: 1 }).skip(skip).limit(limit).toArray();

    // Remove MongoDB _id field
    const categoriesWithoutId = categories.map(({ _id, ...cat }) => cat);

    return NextResponse.json(
      {
        categories: categoriesWithoutId,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/products/categories error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI<ProductCategory>("product_categories");
    const query = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    if (!body.name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const existing = await col.findOne({ ...query, name: body.name });
    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }

    const maxOrderDoc = await col.find(query).sort({ order: -1 }).limit(1).toArray();
    const maxOrder = maxOrderDoc.length > 0 ? maxOrderDoc[0].order : 0;

    const now = new Date().toISOString();
    const newCategory: any = {
      id: body.name.toLowerCase().replace(/\s+/g, "-"),
      name: body.name,
      order: body.order ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        newCategory.merchantId = merchantId;
      }
    }

    await col.insertOne(newCategory);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products/categories error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI<ProductCategory>("product_categories");
    const query = await buildMerchantQuery();

    if (!body.categories || !Array.isArray(body.categories)) {
      return NextResponse.json({ error: "Missing required field: categories (array)" }, { status: 400 });
    }

    const updates = body.categories.map((cat: ProductCategory, index: number) => ({
      updateOne: {
        filter: { ...query, id: cat.id },
        update: {
          $set: {
            order: index + 1,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    }));

    await col.bulkWrite(updates);

    const updated = await col.find(query).sort({ order: 1 }).toArray();
    const categoriesWithoutId = updated.map(({ _id, ...cat }) => cat);

    return NextResponse.json(categoriesWithoutId);
  } catch (error: any) {
    console.error("PUT /api/products/categories error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update categories" }, { status: 500 });
  }
}
