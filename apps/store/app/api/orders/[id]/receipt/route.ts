import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";
import type { Order } from "@/lib/types";
import type { BrandConfig } from "@/lib/brand-config";
import { defaultBrandConfig } from "@/lib/brand-config";

type Ctx = { params: Promise<{ id: string }> };

const BRAND_CONFIG_ID = "brand_config_v1";

/**
 * GET /api/orders/[id]/receipt
 * Generate order receipt data with merchant information
 */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    // Fetch order
    const ordersCol = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();

    let query;
    if (ObjectId.isValid(id)) {
      query = { ...baseQuery, $or: [{ _id: new ObjectId(id) }, { id }] };
    } else {
      query = { ...baseQuery, id };
    }

    const orderDoc = (await ordersCol.findOne(query)) as any;
    if (!orderDoc) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order: Order = {
      id: String(orderDoc._id),
      createdAt: orderDoc.createdAt,
      status: orderDoc.status,
      orderType: orderDoc.orderType || "online",
      items: orderDoc.items,
      subtotal: Number(orderDoc.subtotal ?? 0),
      discountPercentage: orderDoc.discountPercentage !== undefined ? Number(orderDoc.discountPercentage) : undefined,
      discountAmount: orderDoc.discountAmount !== undefined ? Number(orderDoc.discountAmount) : undefined,
      vatTaxPercentage: orderDoc.vatTaxPercentage !== undefined ? Number(orderDoc.vatTaxPercentage) : undefined,
      vatTaxAmount: orderDoc.vatTaxAmount !== undefined ? Number(orderDoc.vatTaxAmount) : undefined,
      shipping: Number(orderDoc.shipping ?? 0),
      total: Number(orderDoc.total ?? 0),
      paymentMethod: orderDoc.paymentMethod,
      paymentStatus: orderDoc.paymentStatus,
      paidAmount: orderDoc.paidAmount !== undefined ? Number(orderDoc.paidAmount) : undefined,
      paymentTransactionId: orderDoc.paymentTransactionId,
      paymentValId: orderDoc.paymentValId,
      customer: orderDoc.customer,
      courier: orderDoc.courier,
      couponCode: orderDoc.couponCode,
      couponId: orderDoc.couponId,
    };

    // Fetch brand config
    const brandConfigCol = await getMerchantCollectionForAPI("brand_config");
    const brandConfigQuery = await buildMerchantQuery({ id: BRAND_CONFIG_ID });
    const brandConfigDoc = await brandConfigCol.findOne(brandConfigQuery);

    let brandConfig: BrandConfig = defaultBrandConfig;
    if (brandConfigDoc) {
      const { _id, ...config } = brandConfigDoc as any;
      brandConfig = config as BrandConfig;
    }

    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = order.discountAmount ?? 0;
    if (order.discountPercentage && order.discountPercentage > 0) {
      discountAmount = (subtotal * order.discountPercentage) / 100;
    }
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    let vatTaxAmount = order.vatTaxAmount ?? 0;
    if (order.vatTaxPercentage && order.vatTaxPercentage > 0) {
      vatTaxAmount = (subtotalAfterDiscount * order.vatTaxPercentage) / 100;
    }
    const total = subtotalAfterDiscount + vatTaxAmount + (order.shipping || 0);

    return NextResponse.json({
      order,
      brandConfig,
      totals: {
        subtotal,
        discountAmount,
        vatTaxAmount,
        shipping: order.shipping || 0,
        total,
      },
    });
  } catch (error: any) {
    console.error("Error generating receipt:", error);
    return NextResponse.json({ error: error.message || "Failed to generate receipt" }, { status: 500 });
  }
}
