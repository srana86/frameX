import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";
import type { Order } from "@/lib/types";
import { emitOrderUpdate } from "@/lib/socket-emitter";
import type { AffiliateSettings } from "@/lib/affiliate-types";
import { sendEmailEvent } from "@/lib/email-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const col = await getMerchantCollectionForAPI("orders");
  const baseQuery = await buildMerchantQuery();

  let query;
  if (ObjectId.isValid(id)) {
    query = { ...baseQuery, $or: [{ _id: new ObjectId(id) }, { id }] };
  } else {
    query = { ...baseQuery, id };
  }

  const d = (await col.findOne(query)) as any;
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const order: Order = {
    id: String(d._id),
    customOrderId: d.customOrderId, // Custom order ID (format: BRD-XXXXXXX)
    createdAt: d.createdAt,
    status: d.status,
    orderType: d.orderType || "online", // Default to "online" if not set
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
    affiliateCode: d.affiliateCode,
    affiliateId: d.affiliateId,
    affiliateCommission: d.affiliateCommission,
    timeline: d.timeline || [],
  };
  return NextResponse.json(order);
}

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = (await request.json()) as Partial<Order>;
    const col = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();

    let query;
    if (ObjectId.isValid(id)) {
      query = { ...baseQuery, $or: [{ _id: new ObjectId(id) }, { id }] };
    } else {
      query = { ...baseQuery, id };
    }

    // Get current order to check status change
    const currentOrder = (await col.findOne(query)) as any;
    if (!currentOrder) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Track timeline if status is changing
    const updateData: any = { ...body };
    if (body.status && body.status !== currentOrder.status) {
      const timelineEvent = {
        status: body.status,
        timestamp: new Date().toISOString(),
      };
      
      // Initialize timeline array if it doesn't exist
      const existingTimeline = currentOrder.timeline || [];
      
      // Add initial status if timeline is empty
      if (existingTimeline.length === 0 && currentOrder.status) {
        existingTimeline.push({
          status: currentOrder.status,
          timestamp: currentOrder.createdAt || new Date().toISOString(),
        });
      }
      
      // Add new timeline event
      updateData.timeline = [...existingTimeline, timelineEvent];
    }

    const updateRes = await col.updateOne(query, { $set: updateData });
    if (updateRes.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update affiliate commission status if order status changed
    if (body.status && body.status !== currentOrder.status) {
      try {
        const commissionsCol = await getMerchantCollectionForAPI("affiliate_commissions");
        const orderId = String(currentOrder._id);

        if (body.status === "delivered") {
          // Approve commission when order is delivered
          const pendingCommission = await commissionsCol.findOne({
            ...baseQuery,
            orderId,
            status: "pending",
          });

          if (pendingCommission) {
            const affiliatesCol = await getMerchantCollectionForAPI("affiliates");
            const settingsCol = await getMerchantCollectionForAPI<AffiliateSettings>("affiliate_settings");

            // Get affiliate and settings
            const affiliate = await affiliatesCol.findOne({
              ...baseQuery,
              _id: new ObjectId(pendingCommission.affiliateId),
            });

            const settings = (await settingsCol.findOne(
              await buildMerchantQuery({ id: "affiliate_settings_v1" })
            )) as AffiliateSettings | null;

            if (affiliate && settings) {
              // Update delivered orders count
              const newDeliveredCount = (affiliate.deliveredOrders || 0) + 1;

              // Calculate new level based on delivered sales
              const { calculateAffiliateLevel, calculateCommission } = await import("@/lib/affiliate-helpers");
              const newLevel = calculateAffiliateLevel(newDeliveredCount, settings);

              // If level changed, recalculate commission with new level
              let finalCommission = pendingCommission;
              if (newLevel !== pendingCommission.level) {
                const newCommission = calculateCommission(pendingCommission.orderTotal, newLevel, settings);
                if (newCommission) {
                  // Update commission with new level and amount
                  await commissionsCol.updateOne(
                    { ...baseQuery, _id: pendingCommission._id },
                    {
                      $set: {
                        level: newLevel,
                        commissionPercentage: newCommission.percentage,
                        commissionAmount: newCommission.amount,
                        status: "approved",
                        updatedAt: new Date().toISOString(),
                      },
                    }
                  );
                  finalCommission = {
                    ...pendingCommission,
                    level: newLevel,
                    commissionPercentage: newCommission.percentage,
                    commissionAmount: newCommission.amount,
                  };
                }
              } else {
                // Just approve the commission
                await commissionsCol.updateOne(
                  { ...baseQuery, _id: pendingCommission._id },
                  { $set: { status: "approved", updatedAt: new Date().toISOString() } }
                );
              }

              // Update affiliate stats - add to balance and earnings when delivered
              await affiliatesCol.updateOne(
                { ...baseQuery, _id: affiliate._id },
                {
                  $inc: {
                    totalEarnings: finalCommission.commissionAmount,
                    availableBalance: finalCommission.commissionAmount, // Add to balance when delivered
                    deliveredOrders: 1,
                  },
                  $set: {
                    currentLevel: newLevel,
                    updatedAt: new Date().toISOString(),
                  },
                }
              );
            } else {
              // Fallback: just approve if affiliate not found
              await commissionsCol.updateOne(
                { ...baseQuery, orderId, status: "pending" },
                { $set: { status: "approved", updatedAt: new Date().toISOString() } }
              );
            }
          }
        } else if (body.status === "cancelled") {
          // Cancel commission when order is cancelled
          await commissionsCol.updateOne(
            { ...baseQuery, orderId, status: "pending" },
            { $set: { status: "cancelled", updatedAt: new Date().toISOString() } }
          );

          // If commission was already approved, reverse it
          const approvedCommission = await commissionsCol.findOne({
            ...baseQuery,
            orderId,
            status: "approved",
          });

          if (approvedCommission) {
            // Reverse the commission from affiliate balance
            const affiliatesCol = await getMerchantCollectionForAPI("affiliates");
            const affiliate = await affiliatesCol.findOne({
              ...baseQuery,
              _id: new ObjectId(approvedCommission.affiliateId),
            });

            if (affiliate) {
              // Decrease delivered orders count
              const newDeliveredCount = Math.max(0, (affiliate.deliveredOrders || 0) - 1);

              // Recalculate level based on new delivered count
              const settingsCol = await getMerchantCollectionForAPI<AffiliateSettings>("affiliate_settings");
              const settings = (await settingsCol.findOne(
                await buildMerchantQuery({ id: "affiliate_settings_v1" })
              )) as AffiliateSettings | null;

              let newLevel = affiliate.currentLevel || 1;
              if (settings) {
                const { calculateAffiliateLevel } = await import("@/lib/affiliate-helpers");
                newLevel = calculateAffiliateLevel(newDeliveredCount, settings);
              }

              await affiliatesCol.updateOne(
                { ...baseQuery, _id: affiliate._id },
                {
                  $inc: {
                    totalEarnings: -approvedCommission.commissionAmount,
                    availableBalance: -approvedCommission.commissionAmount,
                    totalOrders: -1,
                    deliveredOrders: -1,
                  },
                  $set: {
                    currentLevel: newLevel,
                    updatedAt: new Date().toISOString(),
                  },
                }
              );
            }

            // Mark commission as cancelled
            await commissionsCol.updateOne(
              { ...baseQuery, _id: approvedCommission._id },
              { $set: { status: "cancelled", updatedAt: new Date().toISOString() } }
            );
          }
        }
      } catch (affiliateError) {
        // Log error but don't fail the order update
        console.error("[Orders API] Error updating affiliate commission:", affiliateError);
      }
    }

    const d = (await col.findOne(query)) as any;
    const order: Order = {
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
      affiliateCode: d.affiliateCode,
      affiliateId: d.affiliateId,
      affiliateCommission: d.affiliateCommission,
      timeline: d.timeline || [],
    };

    // Emit real-time order update to merchant dashboard
    const merchantId = await getMerchantIdForAPI();
    if (merchantId) {
      console.log(`[Orders API] Emitting order-update event to merchant:${merchantId}`, { orderId: order.id });
      emitOrderUpdate(merchantId, order);
    }

    // Send email updates for status/payment changes
    try {
      const orderId = String(currentOrder._id || id);
      const customerEmail = currentOrder.customer?.email;
      const customerName = currentOrder.customer?.fullName || "Customer";

      const statusEventMap: Record<string, any> = {
        shipped: "order_shipped",
        delivered: "order_delivered",
        cancelled: "order_cancelled",
      };

      if (body.status && body.status !== currentOrder.status) {
        const mappedEvent = statusEventMap[body.status as string];
        if (mappedEvent && customerEmail) {
          const trackingLink = (body.courier as any)?.trackingLink || (currentOrder.courier as any)?.trackingLink || undefined;
          await sendEmailEvent({
            event: mappedEvent,
            to: customerEmail,
            variables: {
              orderId,
              customerName,
              carrierName: body.courier?.serviceName || currentOrder.courier?.serviceName,
              trackingId: body.courier?.consignmentId || currentOrder.courier?.consignmentId,
              trackingLink,
              orderTotal: currentOrder.total,
              orderDate: currentOrder.createdAt,
            },
          });
        }
      }

      if (body.paymentStatus === "refunded" && customerEmail) {
        await sendEmailEvent({
          event: "order_refunded",
          to: customerEmail,
          variables: {
            orderId,
            customerName,
            refundAmount: body.paidAmount ?? currentOrder.paidAmount ?? currentOrder.total,
            paymentMethod: currentOrder.paymentMethod,
            refundDate: new Date().toISOString(),
          },
        });
      }
    } catch (emailError) {
      console.error("[Orders API] Failed to send order status email:", emailError);
    }

    return NextResponse.json(order);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const col = await getMerchantCollectionForAPI("orders");
  const baseQuery = await buildMerchantQuery();

  let query;
  if (ObjectId.isValid(id)) {
    query = { ...baseQuery, $or: [{ _id: new ObjectId(id) }, { id }] };
  } else {
    query = { ...baseQuery, id };
  }

  const res = await col.deleteOne(query);
  if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
