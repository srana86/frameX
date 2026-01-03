import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/most-loved
 * Returns products sorted by number of sales (most sold products first)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const ordersCol = await getMerchantCollectionForAPI("orders");
    const productsCol = await getMerchantCollectionForAPI("products");
    const baseQuery = await buildMerchantQuery();

    // Get all orders (only delivered/shipped/processing count as sales)
    const orders = (await ordersCol
      .find(baseQuery)
      .toArray()) as any[];

    // Count sales for each product
    const productSalesCount = new Map<string, number>();

    orders.forEach((order) => {
      // Only count orders that are not cancelled
      if (order.status !== "cancelled" && order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productId = item.productId;
          if (productId) {
            const currentCount = productSalesCount.get(productId) || 0;
            const quantity = item.quantity || 1;
            productSalesCount.set(productId, currentCount + quantity);
          }
        });
      }
    });

    // Sort products by sales count (descending)
    const sortedProductIds = Array.from(productSalesCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productId)
      .slice(0, limit);

    // Fetch product details
    const products: any[] = [];
    for (const productId of sortedProductIds) {
      if (ObjectId.isValid(productId)) {
        const product = (await productsCol.findOne({
          ...baseQuery,
          _id: new ObjectId(productId),
        })) as any;

        if (product) {
          const salesCount = productSalesCount.get(productId) || 0;
          products.push({
            ...product,
            salesCount,
          });
        }
      }
    }

    // If we don't have enough products from sales, fill with featured/ordered products
    if (products.length < limit) {
      const existingIds = new Set(products.map((p) => String(p._id)));
      const additionalProducts = await productsCol
        .find({
          ...baseQuery,
          _id: { $nin: Array.from(existingIds).map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : null)).filter(Boolean) },
        })
        .sort({ featured: -1, order: 1, _id: -1 })
        .limit(limit - products.length)
        .toArray();

      additionalProducts.forEach((product: any) => {
        products.push({
          ...product,
          salesCount: 0,
        });
      });
    }

    // Format products
    const formattedProducts = products.map((product) => ({
      id: String(product._id),
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description ?? "",
      price: Number(product.price ?? 0),
      images: Array.isArray(product.images) ? product.images : [],
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      colors: Array.isArray(product.colors) ? product.colors : [],
      materials: Array.isArray(product.materials) ? product.materials : [],
      weight: product.weight || undefined,
      dimensions: product.dimensions || undefined,
      sku: product.sku || undefined,
      condition: product.condition || undefined,
      warranty: product.warranty || undefined,
      tags: Array.isArray(product.tags) ? product.tags : [],
      discountPercentage: product.discountPercentage !== undefined ? Number(product.discountPercentage) : undefined,
      featured: Boolean(product.featured ?? false),
      stock: product.stock !== undefined ? Number(product.stock) : undefined,
      order: product.order !== undefined ? Number(product.order) : undefined,
      salesCount: product.salesCount || 0,
    }));

    return NextResponse.json(formattedProducts, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error("GET /api/products/most-loved error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch most loved products" },
      { status: 500 }
    );
  }
}

