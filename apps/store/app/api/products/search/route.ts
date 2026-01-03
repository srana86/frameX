import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { Product } from "@/lib/types";
import { CACHE_TAGS, CACHE_HEADERS } from "@/lib/cache-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const featured = searchParams.get("featured") === "true";
    const newest = searchParams.get("newest") === "true" || (!query.trim() && !featured);
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const col = await getMerchantCollectionForAPI("products");
    const baseQuery = await buildMerchantQuery();

    let searchQuery = baseQuery;
    let sortOrder: any = { featured: -1, order: 1, _id: -1 };

    // If featured is requested, return featured products
    if (featured) {
      searchQuery = { ...baseQuery, featured: true };
      sortOrder = { featured: -1, order: 1, _id: -1 };
    } else if (newest || (!query.trim() && !featured)) {
      // Return newest products (sorted by _id descending which is creation date)
      searchQuery = baseQuery;
      sortOrder = { _id: -1, order: 1 };
    } else if (query.trim()) {
      // Create search regex for case-insensitive search
      const searchRegex = { $regex: query.trim(), $options: "i" };

      // Search across multiple fields
      searchQuery = {
        ...baseQuery,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { brand: searchRegex },
          { category: searchRegex },
          { sku: searchRegex },
          { tags: { $in: [new RegExp(query.trim(), "i")] } },
        ],
      };
      sortOrder = { featured: -1, order: 1, _id: -1 };
    }

    // Fetch products with limit and prioritize featured products
    const docs = (await col.find(searchQuery).sort(sortOrder).limit(limit).toArray()) as any[];

    const products: Product[] = docs.map((d) => ({
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
      { products },
      {
        headers: {
          ...CACHE_HEADERS.SEMI_STATIC,
          "X-Cache-Tags": CACHE_TAGS.PRODUCTS,
        },
      }
    );
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ products: [], error: error?.message || "Search failed" }, { status: 500 });
  }
}
