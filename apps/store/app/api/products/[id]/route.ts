import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";
import type { Product } from "@/lib/types";
import { CACHE_TAGS, CACHE_HEADERS, revalidateCache } from "@/lib/cache-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const col = await getMerchantCollectionForAPI("products");
  const baseQuery = await buildMerchantQuery();
  const query = ObjectId.isValid(id) ? { ...baseQuery, _id: new ObjectId(id) } : { ...baseQuery, slug: id };
  const d = (await col.findOne(query)) as any;
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const product: Product = {
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
  };
  return NextResponse.json(product, {
    headers: {
      ...CACHE_HEADERS.SEMI_STATIC,
      "X-Cache-Tags": `${CACHE_TAGS.PRODUCTS},${CACHE_TAGS.PRODUCT(product.id)}`,
    },
  });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = (await request.json()) as Partial<Product> & { stock?: number | string | null };
    const col = await getMerchantCollectionForAPI("products");
    const baseQuery = await buildMerchantQuery();
    const query = ObjectId.isValid(id) ? { ...baseQuery, _id: new ObjectId(id) } : { ...baseQuery, slug: id };

    // Check if product exists first
    const existing = await col.findOne(query);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Build the update object
    const updateSet: any = {
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
    };

    // Handle order field
    if (body.order !== undefined) {
      updateSet.order = Number(body.order);
    }

    // Handle stock field - only include if it's a valid number
    if (body.stock !== undefined && body.stock !== null) {
      const stockValue = typeof body.stock === "string" ? (body.stock === "" ? null : Number(body.stock)) : body.stock;
      if (stockValue !== null && !isNaN(stockValue)) {
        updateSet.stock = stockValue;
      }
    }

    const update = { $set: updateSet };
    const updateResult = await col.updateOne(query, update);

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch the updated document
    const d = (await col.findOne(query)) as any;
    if (!d) {
      return NextResponse.json({ error: "Update succeeded but failed to retrieve updated product" }, { status: 500 });
    }

    const product: Product = {
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
      featured: Boolean(d.featured ?? false),
      stock: d.stock !== undefined ? Number(d.stock) : undefined,
      order: d.order !== undefined ? Number(d.order) : undefined,
    };

    // Revalidate cache after updating product
    await revalidateCache([CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(product.id), CACHE_TAGS.CATEGORIES]);

    return NextResponse.json(product, {
      headers: {
        ...CACHE_HEADERS.SEMI_STATIC,
        "X-Cache-Tags": `${CACHE_TAGS.PRODUCTS},${CACHE_TAGS.PRODUCT(product.id)}`,
      },
    });
  } catch (e: any) {
    console.error("PUT /api/products/[id] error:", e);
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const col = await getMerchantCollectionForAPI("products");
  const baseQuery = await buildMerchantQuery();
  const query = ObjectId.isValid(id) ? { ...baseQuery, _id: new ObjectId(id) } : { ...baseQuery, slug: id };
  const res = await col.deleteOne(query);
  if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Revalidate cache after deleting product
  await revalidateCache([CACHE_TAGS.PRODUCTS, CACHE_TAGS.PRODUCT(id), CACHE_TAGS.CATEGORIES]);

  return NextResponse.json({ ok: true });
}
