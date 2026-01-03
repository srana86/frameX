import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { getCourierServicesConfig } from "@/lib/delivery-config";
import { getCourierOrderStatus } from "@/lib/courier-status";
import type { OrderCourierInfo, Order } from "@/lib/types";
import { emitOrderUpdate } from "@/lib/socket-emitter";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  serviceId: z.string(),
  consignmentId: z.string().min(1, "Consignment ID is required"),
});

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    const json = await request.json();
    const { serviceId, consignmentId: consignmentIdFromBody } = bodySchema.parse(json);

    // Load courier config for current merchant
    const courierConfig = await getCourierServicesConfig();
    const service = courierConfig.services.find((s) => s.id === serviceId && s.enabled);

    if (!service) {
      return NextResponse.json({ error: "Courier service not enabled or not found" }, { status: 400 });
    }

    // Fetch the order first to check for stored courier info and customer data
    const col = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();

    let query;
    if (ObjectId.isValid(id)) {
      query = { ...baseQuery, $or: [{ _id: new ObjectId(id) }, { id }] };
    } else {
      query = { ...baseQuery, id };
    }

    const orderDoc = await col.findOne(query);
    if (!orderDoc) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Determine the consignment ID to use
    // For Paperfly, prefer the stored consignmentId (which is in orderId|phone format)
    // Otherwise, use the one from request body, or reconstruct for Paperfly if needed
    let consignmentId = consignmentIdFromBody;

    // If order has stored courier info, use that consignmentId (especially important for Paperfly)
    if (orderDoc.courier?.consignmentId) {
      consignmentId = orderDoc.courier.consignmentId;
    }

    // For Paperfly, ensure the format is correct (orderId|phone)
    if (service.id === "paperfly") {
      if (!consignmentId.includes("|")) {
        // If format is wrong, try to reconstruct using order ID and customer phone
        const orderId = String(orderDoc._id || orderDoc.id);
        const customerPhone = orderDoc.customer?.phone;

        if (customerPhone) {
          consignmentId = `${orderId}|${customerPhone}`;
        } else {
          return NextResponse.json(
            {
              error: "Paperfly tracking requires customer phone number. Please ensure the order has customer phone information.",
              details: "Paperfly consignment ID must be in format 'orderId|phone'",
            },
            { status: 400 }
          );
        }
      }
    }

    // Call external courier API to get live status
    const statusResult = await getCourierOrderStatus(service, consignmentId);

    // Prepare courier info object to store on the order
    const now = new Date().toISOString();
    const courierInfo: OrderCourierInfo = {
      serviceId: service.id,
      serviceName: service.name,
      // For Paperfly, preserve the orderId|phone format in consignmentId
      consignmentId: service.id === "paperfly" && consignmentId.includes("|") ? consignmentId : statusResult.consignmentId,
      deliveryStatus: statusResult.deliveryStatus,
      lastSyncedAt: now,
      rawStatus: statusResult.rawStatus,
    };

    // Update order document (query is already defined above)
    const res = await col.updateOne(query, { $set: { courier: courierInfo } });
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Emit real-time order update to merchant dashboard
    const merchantId = await getMerchantIdForAPI();
    if (merchantId) {
      const updatedOrderDoc = (await col.findOne(query)) as any;
      if (updatedOrderDoc) {
        const order: Order = {
          id: String(updatedOrderDoc._id),
          createdAt: updatedOrderDoc.createdAt,
          status: updatedOrderDoc.status,
          orderType: updatedOrderDoc.orderType || "online",
          items: updatedOrderDoc.items,
          subtotal: Number(updatedOrderDoc.subtotal ?? 0),
          discountPercentage: updatedOrderDoc.discountPercentage !== undefined ? Number(updatedOrderDoc.discountPercentage) : undefined,
          discountAmount: updatedOrderDoc.discountAmount !== undefined ? Number(updatedOrderDoc.discountAmount) : undefined,
          vatTaxPercentage: updatedOrderDoc.vatTaxPercentage !== undefined ? Number(updatedOrderDoc.vatTaxPercentage) : undefined,
          vatTaxAmount: updatedOrderDoc.vatTaxAmount !== undefined ? Number(updatedOrderDoc.vatTaxAmount) : undefined,
          shipping: Number(updatedOrderDoc.shipping ?? 0),
          total: Number(updatedOrderDoc.total ?? 0),
          paymentMethod: updatedOrderDoc.paymentMethod,
          paymentStatus: updatedOrderDoc.paymentStatus,
          paidAmount: updatedOrderDoc.paidAmount !== undefined ? Number(updatedOrderDoc.paidAmount) : undefined,
          paymentTransactionId: updatedOrderDoc.paymentTransactionId,
          paymentValId: updatedOrderDoc.paymentValId,
          customer: updatedOrderDoc.customer,
          courier: updatedOrderDoc.courier,
          couponCode: updatedOrderDoc.couponCode,
          couponId: updatedOrderDoc.couponId,
        };
        console.log(`[Orders API] Emitting order-update event (courier) to merchant:${merchantId}`, { orderId: order.id });
        emitOrderUpdate(merchantId, order);
      }
    }

    return NextResponse.json(courierInfo);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
    }

    console.error("POST /api/orders/[id]/courier error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch courier status" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    const col = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();

    let query;
    if (ObjectId.isValid(id)) {
      query = { ...baseQuery, $or: [{ _id: new ObjectId(id) }, { id }] };
    } else {
      query = { ...baseQuery, id };
    }

    const res = await col.updateOne(query, { $unset: { courier: "" } });
    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Courier service removed successfully" });
  } catch (error: any) {
    console.error("DELETE /api/orders/[id]/courier error:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove courier service" }, { status: 500 });
  }
}
