import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    // Only merchants and admins can view payments
    await requireAuth("merchant");

    const paymentsCol = await getMerchantCollectionForAPI("payment_transactions");
    const ordersCol = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();

    // Get all payment transactions
    const payments = await paymentsCol.find(baseQuery).sort({ createdAt: -1 }).toArray();

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

    return NextResponse.json(enrichedPayments);
  } catch (error: any) {
    console.error("GET /api/payments error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get payments" }, { status: 500 });
  }
}
