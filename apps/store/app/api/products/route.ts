import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import type { Product } from "@/lib/types";
import { ObjectId } from "mongodb";
import { CACHE_TAGS, CACHE_HEADERS, revalidateCache } from "@/lib/cache-helpers";

// Use Next.js caching with revalidation
export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
  const category = searchParams.get("category") || undefined;
  const skip = (page - 1) * limit;

  const col = await getMerchantCollectionForAPI("products");
  let query = await buildMerchantQuery();

  // Add category filter if provided
  if (category && category !== "all") {
    query = { ...query, category };
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
    buyPrice: d.buyPrice !== undefined ? Number(d.buyPrice) : undefined,
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

  // Get unique categories for filtering
  const categories = await col.distinct("category", query);

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
      categories: categories.filter(Boolean).sort(),
    },
    {
      headers: {
        ...CACHE_HEADERS.SEMI_STATIC,
        "X-Cache-Tags": CACHE_TAGS.PRODUCTS,
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Product> & { id?: string };
    const col = await getMerchantCollectionForAPI("products");
    const merchantId = await getMerchantIdForAPI();
    const doc: any = {
      slug: body.slug,
      name: body.name,
      brand: body.brand,
      category: body.category,
      description: body.description ?? "",
      price: Number(body.price ?? 0),
      buyPrice: body.buyPrice !== undefined ? Number(body.buyPrice) : undefined,
      images: Array.isArray(body.images) ? body.images : [],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      materials: Array.isArray(body.materials) ? body.materials : [],
      weight: body.weight || undefined,
      dimensions: body.dimensions || undefined,
      sku: body.sku || undefined,
      condition: body.condition || undefined,
      warranty: body.warranty || undefined,
      tags: Array.isArray(body.tags) ? body.tags : [],
      discountPercentage: body.discountPercentage !== undefined ? Number(body.discountPercentage) : undefined,
      featured: Boolean(body.featured ?? false),
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      order: body.order !== undefined ? Number(body.order) : undefined,
      _id: body.id ? new ObjectId(body.id) : undefined,
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        doc.merchantId = merchantId;
      }
    }
    const res = await col.insertOne(doc);
    const id = String(res.insertedId || doc._id);
    const created: Product = {
      ...body,
      id,
      price: Number(body.price ?? 0),
      images: doc.images,
      sizes: doc.sizes,
      featured: doc.featured,
      stock: doc.stock,
    } as Product;

    // Revalidate cache after creating product
    await revalidateCache([CACHE_TAGS.PRODUCTS, CACHE_TAGS.CATEGORIES]);

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI("products");
    const query = await buildMerchantQuery();

    if (!body.products || !Array.isArray(body.products)) {
      return NextResponse.json({ error: "Missing required field: products (array)" }, { status: 400 });
    }

    // Update order for all products
    const updates = body.products.map((product: Product, index: number) => {
      const baseQuery = ObjectId.isValid(product.id) ? { _id: new ObjectId(product.id) } : { slug: product.id };
      const filter = { ...query, ...baseQuery };
      return {
        updateOne: {
          filter,
          update: {
            $set: {
              order: index + 1,
            },
          },
        },
      };
    });

    await col.bulkWrite(updates);

    // Revalidate cache after updating products
    await revalidateCache([CACHE_TAGS.PRODUCTS]);

    // Return updated products
    const updated = await col.find(query).sort({ order: 1, _id: -1 }).toArray();
    const products = updated.map((d: any) => ({
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
      featured: Boolean(d.featured ?? false),
      stock: d.stock !== undefined ? Number(d.stock) : undefined,
      order: d.order !== undefined ? Number(d.order) : undefined,
    }));

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("PUT /api/products error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update products" }, { status: 500 });
  }
}
