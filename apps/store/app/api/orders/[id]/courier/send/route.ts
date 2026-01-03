import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { getCourierServicesConfig } from "@/lib/delivery-config";
import { createCourierOrder } from "@/lib/courier-status";
import type { Order, OrderCourierInfo } from "@/lib/types";
import { getCurrentMerchant } from "@/lib/merchant-context";
import { generateCustomOrderId } from "@/lib/tracking-id";
import { sendEmailEvent } from "@/lib/email-service";

type Ctx = { params: Promise<{ id: string }> };

// Delivery details from modal form (used for all couriers)
const deliveryDetailsSchema = z.object({
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientPhone: z.string().min(8, "Recipient phone is required"),
  recipientAddress: z.string().min(10, "Recipient address must be at least 10 characters"),
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
  amountToCollect: z.number().nonnegative("Amount to collect must be 0 or greater"),
  itemWeight: z.number().positive("Item weight must be greater than 0"),
  specialInstruction: z.string().optional(),
});

const bodySchema = z.object({
  serviceId: z.string(),
  deliveryDetails: deliveryDetailsSchema.optional(), // For all couriers now, not just Paperfly
});

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    const json = await request.json();
    const { serviceId, deliveryDetails } = bodySchema.parse(json);

    const courierConfig = await getCourierServicesConfig();
    const service = courierConfig.services.find((s) => s.id === serviceId && s.enabled);

    if (!service) {
      return NextResponse.json({ error: "Courier service not enabled or not found" }, { status: 400 });
    }

    // Delivery details are required for all couriers (from modal form)
    if (!deliveryDetails) {
      return NextResponse.json({ error: "Delivery details are required" }, { status: 400 });
    }

    const col = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();

    let query;
    if (ObjectId.isValid(id)) {
      query = { ...baseQuery, $or: [{ _id: new ObjectId(id) }, { id }] };
    } else {
      query = { ...baseQuery, id };
    }

    const d = (await col.findOne(query)) as any;
    if (!d) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order: Order = {
      id: String(d._id),
      customOrderId: d.customOrderId, // Include existing custom order ID if available
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
    };

    // Use the order's customOrderId as the merchant_order_id for couriers
    // This creates a consistent ID across your system and the courier's system
    let merchantTrackingId = order.customOrderId;

    // If order doesn't have a customOrderId yet (legacy orders), generate one and save it
    if (!merchantTrackingId) {
      let brandName: string | undefined = undefined;

      try {
        // Priority 1: Get from brand_config collection
        const brandConfigCol = await getMerchantCollectionForAPI("brand_config");
        const brandConfigQuery = await buildMerchantQuery({ id: "brand_config_v1" });
        const brandConfig = await brandConfigCol.findOne(brandConfigQuery);

        if (brandConfig) {
          brandName = (brandConfig as any)?.brandName;
          if (brandName) {
            console.log(`✅ [Custom Order ID] Using brand name from brand_config: ${brandName}`);
          }
        }

        // Priority 2: Try merchant data as fallback
        if (!brandName) {
          const merchant = await getCurrentMerchant();
          if (merchant) {
            brandName = (merchant as any)?.settings?.brandName || (merchant as any)?.name;
            if (brandName) {
              console.log(`✅ [Custom Order ID] Using brand name from merchant: ${brandName}`);
            }
          }
        }
      } catch (error) {
        console.warn("Error fetching brand name for custom order ID:", error);
      }

      // Generate a new custom order ID for this legacy order
      merchantTrackingId = generateCustomOrderId(brandName);
      console.log(`✅ [Custom Order ID] Generated new ID for legacy order: ${merchantTrackingId}`);

      // Save the generated customOrderId to the order for future reference
      await col.updateOne(query, { $set: { customOrderId: merchantTrackingId } });
      order.customOrderId = merchantTrackingId;
    } else {
      console.log(`✅ [Custom Order ID] Using existing order ID: ${merchantTrackingId}`);
    }

    // Pass delivery details to createCourierOrder for all couriers
    // The merchantTrackingId (customOrderId) will be used as merchant_order_id for Pathao
    let createResult = await createCourierOrder(service, order, merchantTrackingId, deliveryDetails);

    // For Paperfly we need to persist both orderId and customer phone for tracking.
    // We encode them as `orderId|phone` in the consignmentId so the tracker can use both.
    if (service.id === "paperfly") {
      const phone = deliveryDetails.recipientPhone;
      const encoded = `${createResult.consignmentId}|${phone}`;
      createResult = {
        ...createResult,
        consignmentId: encoded,
      };
    }

    const now = new Date().toISOString();
    const courierInfo: OrderCourierInfo = {
      serviceId: service.id,
      serviceName: service.name,
      consignmentId: createResult.consignmentId,
      merchantOrderId: merchantTrackingId, // Your custom order ID (e.g., "SHO-3K9M2P7")
      deliveryStatus: createResult.deliveryStatus,
      lastSyncedAt: now,
      rawStatus: createResult.rawStatus,
    };

    await col.updateOne(query, { $set: { courier: courierInfo } });

    // Send email to customer with tracking link when order is sent to delivery
    try {
      const customerEmail = order.customer?.email;
      const customerName = order.customer?.fullName || deliveryDetails.recipientName || "Customer";
      const customerPhone = deliveryDetails.recipientPhone || order.customer?.phone;

      if (customerEmail && service.id === "pathao" && createResult.consignmentId && customerPhone) {
        // Build Pathao tracking URL
        const trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(
          createResult.consignmentId
        )}&phone=${encodeURIComponent(customerPhone)}`;

        const merchantId = await getMerchantIdForAPI();

        sendEmailEvent({
          event: "order_shipped",
          to: customerEmail,
          merchantId: merchantId || undefined,
          variables: {
            orderId: order.customOrderId || order.id, // Use custom order ID for display
            customerName,
            trackingLink: trackingUrl,
            trackingId: createResult.consignmentId,
            carrierName: service.name,
          },
        })
          .then((result) => {
            if (!result.ok) {
              console.error(`[Order ${order.id}] Failed to send shipping email to ${customerEmail}:`, result.error);
            } else {
              console.log(
                `[Order ${order.id}] Shipping email sent successfully to ${customerEmail} with tracking link (Provider: ${result.provider})`
              );
            }
          })
          .catch((error) => {
            console.error(`[Order ${order.id}] Exception while sending shipping email to ${customerEmail}:`, error);
          });
      } else {
        if (!customerEmail) {
          console.warn(`[Order ${order.id}] No customer email provided, skipping shipping email`);
        } else if (service.id !== "pathao") {
          console.log(`[Order ${order.id}] Shipping email only sent for Pathao orders. Service: ${service.id}`);
        } else if (!createResult.consignmentId) {
          console.warn(`[Order ${order.id}] No consignment ID available, skipping shipping email`);
        } else if (!customerPhone) {
          console.warn(`[Order ${order.id}] No customer phone available, skipping shipping email`);
        }
      }
    } catch (emailError) {
      // Don't fail the courier order creation if email fails
      console.error(`[Order ${order.id}] Error sending shipping email:`, emailError);
    }

    return NextResponse.json(courierInfo);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
    }

    console.error("POST /api/orders/[id]/courier/send error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create courier order" }, { status: 500 });
  }
}
