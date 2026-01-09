"use server";

import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { Order, OrderStatus } from "@/lib/types";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type OrdersResponse = {
  orders: Order[];
  pagination: PaginationData;
};

export async function getOrders(
  page: number = 1,
  limit: number = 30,
  status?: OrderStatus | "all",
  search?: string
): Promise<OrdersResponse> {
  try {
    const skip = (page - 1) * limit;
    const col = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();
    let query: any = { ...baseQuery };

    // Add status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Add search filter - search across multiple fields
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      const orConditions: any[] = [
        { id: searchRegex },
        { "customer.fullName": searchRegex },
        { "customer.phone": searchRegex },
        { "customer.email": searchRegex },
        { "customer.addressLine1": searchRegex },
        { "customer.addressLine2": searchRegex },
        { "customer.city": searchRegex },
        { "customer.postalCode": searchRegex },
        { paymentTransactionId: searchRegex },
        { paymentValId: searchRegex },
        { couponCode: searchRegex },
        { affiliateCode: searchRegex },
        { "items.name": searchRegex },
        { "items.slug": searchRegex },
      ];

      // If search term is a number, also search in numeric fields (total, subtotal, shipping, etc.)
      const numericValue = parseFloat(searchTerm);
      if (!isNaN(numericValue)) {
        orConditions.push(
          { total: numericValue },
          { subtotal: numericValue },
          { shipping: numericValue },
          { discountAmount: numericValue },
          { vatTaxAmount: numericValue },
          { paidAmount: numericValue },
          { affiliateCommission: numericValue }
        );
      }

      query.$or = orConditions;
    }

    // Get total count for pagination
    const totalCount = await col.countDocuments(query);

    // Fetch orders with pagination
    const docs = (await col.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray()) as any[];

    const items: Order[] = docs.map((d) => {
      const order: Order = {
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
        timeline: d.timeline || [],
      };
      // Include fraudCheck data if available (not part of Order type but stored in DB)
      if (d.fraudCheck) {
        (order as any).fraudCheck = d.fraudCheck;
      }
      return order;
    });

    return {
      orders: items,
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
    console.error("Failed to fetch orders:", error);
    throw new Error(error?.message || "Failed to fetch orders");
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const { ObjectId } = await import("@/lib/api-helpers");
    const col = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();
    const query = { ...baseQuery, _id: new ObjectId(orderId) };

    const result = await col.updateOne(query, {
      $set: { status, updatedAt: new Date().toISOString() },
    });

    if (result.matchedCount === 0) {
      throw new Error("Order not found");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    throw new Error(error?.message || "Failed to update order status");
  }
}
