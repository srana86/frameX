import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { Product } from "@/lib/types";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const stockFilter = searchParams.get("stockFilter") || "all";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const col = await getMerchantCollectionForAPI("products");
    const baseQuery = await buildMerchantQuery();
    let query: any = { ...baseQuery };

    // Build stock filter
    if (stockFilter === "in-stock") {
      const lowStockThreshold = parseInt(searchParams.get("lowStockThreshold") || "10", 10);
      query.stock = { $gt: lowStockThreshold };
    } else if (stockFilter === "low-stock") {
      const lowStockThreshold = parseInt(searchParams.get("lowStockThreshold") || "10", 10);
      query.stock = { $gt: 0, $lte: lowStockThreshold };
    } else if (stockFilter === "out-of-stock") {
      // For out-of-stock, we need to use $or which requires $and structure
      const outOfStockCondition = {
        $or: [{ stock: 0 }, { stock: { $exists: false } }, { stock: null }],
      };
      if (query.$and) {
        query.$and.push(outOfStockCondition);
      } else {
        query.$and = [outOfStockCondition];
      }
    }
    // "all" - no stock filter

    // Add search filter
    if (search.trim()) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchCondition = {
        $or: [{ name: searchRegex }, { sku: searchRegex }, { category: searchRegex }, { brand: searchRegex }],
      };
      if (query.$and) {
        query.$and.push(searchCondition);
      } else {
        query.$and = [searchCondition];
      }
    }

    // Get total count for pagination
    const totalCount = await col.countDocuments(query);

    // Fetch products with pagination
    const docs = (await col.find(query).sort({ order: 1, _id: -1 }).skip(skip).limit(limit).toArray()) as any[];

    const items: Product[] = docs.map((d) => ({
      id: String(d._id),
      slug: d.slug,
      name: d.name,
      brand: d.brand,
      category: d.category,
      description: d.description ?? "",
      price: Number(d.price ?? 0),
      images: Array.isArray(d.images) ? d.images : [],
      sizes: Array.isArray(d.sizes) ? d.sizes : [],
      colors: Array.isArray(d.colors) ? d.colors : [],
      materials: Array.isArray(d.materials) ? d.materials : [],
      weight: d.weight || undefined,
      dimensions: d.dimensions || undefined,
      sku: d.sku || undefined,
      condition: d.condition || undefined,
      warranty: d.warranty || undefined,
      tags: Array.isArray(d.tags) ? d.tags : [],
      discountPercentage: d.discountPercentage !== undefined ? Number(d.discountPercentage) : undefined,
      featured: Boolean(d.featured ?? false),
      stock: d.stock !== undefined ? Number(d.stock) : undefined,
      order: d.order !== undefined ? Number(d.order) : undefined,
    }));

    return NextResponse.json(
      {
        products: items,
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
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch inventory products:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch products" }, { status: 500 });
  }
}
