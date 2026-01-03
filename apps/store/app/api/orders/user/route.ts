import { NextResponse } from "next/server";
import type { Order } from "@/lib/types";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    const col = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();
    const query: any = { ...baseQuery };

    if (email) {
      query["customer.email"] = email;
    }
    if (phone) {
      query["customer.phone"] = phone;
    }

    const docs = (await col.find(query).sort({ _id: -1 }).toArray()) as any[];
    const items: Order[] = docs.map((d) => ({
      id: String(d._id),
      createdAt: d.createdAt,
      status: d.status,
      orderType: d.orderType || "online",
      items: d.items,
      subtotal: Number(d.subtotal ?? 0),
      discountPercentage: d.discountPercentage !== undefined ? Number(d.discountPercentage) : undefined,
      discountAmount: d.discountAmount !== undefined ? Number(d.discountAmount) : undefined,
      vatTaxPercentage: d.vatTaxPercentage !== undefined ? Number(d.vatTaxPercentage) : undefined,
      vatTaxAmount: d.vatTaxAmount !== undefined ? Number(d.vatTaxAmount) : undefined,
      shipping: Number(d.shipping ?? 0),
      total: Number(d.total ?? 0),
      paymentMethod: d.paymentMethod,
      paymentStatus: d.paymentStatus,
      paidAmount: d.paidAmount !== undefined ? Number(d.paidAmount) : undefined,
      paymentTransactionId: d.paymentTransactionId,
      paymentValId: d.paymentValId,
      customer: d.customer,
      courier: d.courier,
      couponCode: d.couponCode,
      couponId: d.couponId,
    }));

    return NextResponse.json(items);
  } catch (e: any) {
    console.error("GET /api/orders/user error:", e);
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}
