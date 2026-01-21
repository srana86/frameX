"use server";

import { getTenantCollectionForAPI, buildTenantQuery } from "@/lib/api-helpers";
import type { Order, Product } from "@/lib/types";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type CategoryStat = {
  name: string;
  orders: number;
  revenue: number;
  items: number;
  quantity: number;
};

export async function getCategoryStatistics(
  page: number = 1,
  limit: number = 30
): Promise<{ stats: CategoryStat[]; pagination: PaginationData }> {
  try {
    const skip = (page - 1) * limit;
    const ordersCol = await getTenantCollectionForAPI("orders");
    const productsCol = await getTenantCollectionForAPI("products");
    const baseQuery = await buildTenantQuery();

    // Fetch all orders (for statistics calculation)
    const allOrdersDocs = (await ordersCol.find(baseQuery).sort({ _id: -1 }).toArray()) as any[];
    const allOrders: Order[] = allOrdersDocs.map((d) => ({
      id: String(d._id),
      createdAt: d.createdAt || new Date().toISOString(),
      status: d.status || "pending",
      orderType: d.orderType || "online",
      items: d.items || [],
      subtotal: Number(d.subtotal ?? 0),
      discountPercentage: d.discountPercentage !== undefined ? Number(d.discountPercentage) : undefined,
      discountAmount: d.discountAmount !== undefined ? Number(d.discountAmount) : undefined,
      vatTaxPercentage: d.vatTaxPercentage !== undefined ? Number(d.vatTaxPercentage) : undefined,
      vatTaxAmount: d.vatTaxAmount !== undefined ? Number(d.vatTaxAmount) : undefined,
      shipping: Number(d.shipping ?? 0),
      total: Number(d.total ?? 0),
      paymentMethod: d.paymentMethod || "cod",
      paymentStatus: d.paymentStatus,
      paidAmount: d.paidAmount !== undefined ? Number(d.paidAmount) : undefined,
      paymentTransactionId: d.paymentTransactionId,
      paymentValId: d.paymentValId,
      customer: d.customer,
      courier: d.courier,
      couponCode: d.couponCode,
      couponId: d.couponId,
      affiliateCode: d.affiliateCode,
      affiliateId: d.affiliateId,
      affiliateCommission: d.affiliateCommission,
    }));

    // Fetch all products
    const productsDocs = (await productsCol.find(baseQuery).toArray()) as any[];
    const products: Product[] = productsDocs.map((d) => ({
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

    // Calculate category statistics
    const categoryMap = new Map<
      string,
      {
        name: string;
        orders: Set<string>;
        revenue: number;
        items: number;
        quantity: number;
      }
    >();

    // Create product map for quick lookup
    const productMap = new Map<string, Product>();
    products.forEach((product) => {
      productMap.set(product.id, product);
    });

    // Process all orders
    allOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const product = productMap.get(item.productId);
          if (product && product.category) {
            const categoryName = product.category;
            const existing = categoryMap.get(categoryName);

            if (existing) {
              existing.orders.add(order.id);
              existing.revenue += item.price * item.quantity;
              existing.items += 1;
              existing.quantity += item.quantity;
            } else {
              categoryMap.set(categoryName, {
                name: categoryName,
                orders: new Set([order.id]),
                revenue: item.price * item.quantity,
                items: 1,
                quantity: item.quantity,
              });
            }
          }
        });
      }
    });

    // Convert to array and sort
    const allStats = Array.from(categoryMap.values())
      .map((stat) => ({
        name: stat.name,
        orders: stat.orders.size,
        revenue: stat.revenue,
        items: stat.items,
        quantity: stat.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Apply pagination
    const totalCount = allStats.length;
    const paginatedStats = allStats.slice(skip, skip + limit);

    return {
      stats: paginatedStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch category statistics:", error);
    throw new Error(error?.message || "Failed to fetch category statistics");
  }
}
