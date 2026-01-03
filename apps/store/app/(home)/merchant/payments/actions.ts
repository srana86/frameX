"use server";

import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";

export interface PaymentTransaction {
  _id?: string;
  orderId: string;
  transactionId: string;
  valId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  bankTranId?: string;
  cardType?: string;
  cardNo?: string;
  cardIssuer?: string;
  cardBrand?: string;
  createdAt: string;
  order?: {
    id: string;
    status: string;
    customer: any;
    items: any[];
    total: number;
  };
}

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type PaymentsResponse = {
  payments: PaymentTransaction[];
  pagination: PaginationData;
  stats: {
    total: number;
    completed: number;
    failed: number;
    totalAmount: number;
  };
};

export async function getPayments(page: number = 1, limit: number = 30, status?: string, search?: string): Promise<PaymentsResponse> {
  try {
    const skip = (page - 1) * limit;
    const paymentsCol = await getMerchantCollectionForAPI("payment_transactions");
    const ordersCol = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();

    // Build query with filters
    let query: any = { ...baseQuery };

    // Apply status filter
    if (status && status !== "all") {
      const statusLower = status.toLowerCase();
      if (statusLower === "valid" || statusLower === "completed") {
        query.status = { $in: ["VALID", "valid", "completed", "COMPLETED"] };
      } else {
        query.status = { $regex: new RegExp(`^${statusLower}$`, "i") };
      }
    }

    // Get all payments for stats calculation (before search filter)
    const allPayments = await paymentsCol.find(baseQuery).sort({ createdAt: -1 }).toArray();

    // Apply search filter
    let searchQuery = { ...query };
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: "i" };
      searchQuery.$or = [{ transactionId: searchRegex }, { orderId: searchRegex }, { bankTranId: searchRegex }, { valId: searchRegex }];
    }

    // Get total count for pagination
    const totalCount = await paymentsCol.countDocuments(searchQuery);

    // Fetch payments with pagination
    const payments = await paymentsCol.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    // Enrich payments with order information
    const enrichedPayments = await Promise.all(
      payments.map(async (payment: any) => {
        if (payment.orderId) {
          try {
            const orderId = ObjectId.isValid(payment.orderId) ? new ObjectId(payment.orderId) : payment.orderId;
            const orderQuery = { ...baseQuery, _id: orderId };
            const order = await ordersCol.findOne(orderQuery);
            if (order) {
              return {
                ...payment,
                _id: String(payment._id),
                orderId: String(payment.orderId),
                order: {
                  id: String(order._id),
                  status: order.status,
                  customer: order.customer,
                  items: order.items,
                  total: order.total,
                },
              };
            }
          } catch (error) {
            // Order ID might not be valid ObjectId, skip
          }
        }
        return {
          ...payment,
          _id: String(payment._id),
          orderId: String(payment.orderId || ""),
        };
      })
    );

    // Calculate statistics from all payments (not filtered by search)
    const completed = allPayments.filter(
      (p: any) => p.status === "VALID" || p.status === "valid" || p.status === "completed" || p.status === "COMPLETED"
    ).length;
    const failed = allPayments.filter((p: any) => p.status === "FAILED" || p.status === "failed" || p.status === "FAILED").length;
    const totalAmount = allPayments
      .filter((p: any) => p.status === "VALID" || p.status === "valid" || p.status === "completed" || p.status === "COMPLETED")
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    return {
      payments: enrichedPayments as PaymentTransaction[],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      stats: {
        total: allPayments.length,
        completed,
        failed,
        totalAmount,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch payments:", error);
    throw new Error(error?.message || "Failed to fetch payments");
  }
}
