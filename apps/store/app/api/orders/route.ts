import { NextResponse } from "next/server";
import type { Order } from "@/lib/types";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";
import { emitOrderUpdate, emitNotification } from "@/lib/socket-emitter";
import { getCurrencySymbol } from "@/lib/currency";
import { getCollection } from "@/lib/mongodb";
import type { BlockedCustomer } from "@/lib/blocked-customers";
import type { CommissionLevel, AffiliateSettings } from "@/lib/affiliate-types";
import { getClientIP, getDetailedIpGeolocation } from "@/lib/geolocation";
import { transformOnecodesoftResponse, type OnecodesoftFraudCheckResponse } from "@/lib/fraud-check/fraudshield-api";
import { generateCustomOrderId } from "@/lib/tracking-id";
import { getCurrentMerchant } from "@/lib/merchant-context";

import { CACHE_TAGS, CACHE_HEADERS, revalidateCache } from "@/lib/cache-helpers";

// Cache orders for 10 seconds (they change frequently)
export const revalidate = 10;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const col = await getMerchantCollectionForAPI("orders");
    const baseQuery = await buildMerchantQuery();
    let query: any = { ...baseQuery };

    // Add status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Add search filter
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { id: searchRegex },
        { customOrderId: searchRegex }, // Search by custom order ID
        { "customer.fullName": searchRegex },
        { "customer.phone": searchRegex },
        { "customer.email": searchRegex },
      ];
    }

    // Get total count for pagination
    const totalCount = await col.countDocuments(query);

    // Fetch orders with pagination
    const docs = (await col.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray()) as any[];

    const items: Order[] = docs.map((d) => {
      const order: Order = {
        id: String(d._id),
        customOrderId: d.customOrderId, // Custom order ID (format: BRD-XXXXXXX)
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
      };
      // Include fraudCheck data if available (not part of Order type but stored in DB)
      if (d.fraudCheck) {
        (order as any).fraudCheck = d.fraudCheck;
      }
      return order;
    });

    return NextResponse.json(
      {
        orders: items,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1,
        },
      },
      {
        headers: {
          ...CACHE_HEADERS.REALTIME,
          "X-Cache-Tags": CACHE_TAGS.ORDERS,
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Order;
    const ordersCol = await getMerchantCollectionForAPI("orders");
    const productsCol = await getMerchantCollectionForAPI("products");
    const merchantId = await getMerchantIdForAPI();
    const orderQuery = await buildMerchantQuery();

    // Validate stock availability and prepare stock updates
    const stockUpdates: Array<{ productId: string; quantity: number }> = [];
    const stockErrors: string[] = [];

    for (const item of body.items) {
      const productId = ObjectId.isValid(item.productId) ? new ObjectId(item.productId) : null;
      if (!productId) {
        stockErrors.push(`Invalid product ID: ${item.productId}`);
        continue;
      }

      const productQuery = { _id: productId, ...orderQuery };
      const product = (await productsCol.findOne(productQuery)) as any;
      if (!product) {
        stockErrors.push(`Product not found: ${item.name}`);
        continue;
      }

      // Check if product has stock tracking
      if (product.stock !== undefined) {
        const currentStock = Number(product.stock ?? 0);
        const requestedQty = item.quantity;

        if (currentStock < requestedQty) {
          stockErrors.push(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${requestedQty}`);
        } else {
          stockUpdates.push({ productId: item.productId, quantity: requestedQty });
        }
      }
    }

    // If any stock errors, return them without creating the order
    if (stockErrors.length > 0) {
      return NextResponse.json({ error: "Stock validation failed", details: stockErrors }, { status: 400 });
    }

    // Check if customer is blocked (fraud protection)
    if (body.customer?.phone || body.customer?.email) {
      try {
        const blockedCollection = await getCollection<BlockedCustomer>("blocked_customers");
        const orConditions: Record<string, unknown>[] = [];

        if (body.customer.phone) {
          const normalizedPhone = body.customer.phone.replace(/\D/g, "").slice(-11);
          orConditions.push(
            { phone: body.customer.phone },
            { phone: normalizedPhone },
            { phone: { $regex: normalizedPhone.slice(-10) + "$" } }
          );
        }

        if (body.customer.email) {
          orConditions.push({ email: body.customer.email.toLowerCase() });
        }

        const blocked = await blockedCollection.findOne({
          $or: orConditions,
          isActive: true,
        });

        if (blocked) {
          console.log(`[Orders API] Blocked customer attempted to place order: ${body.customer.phone}`);
          return NextResponse.json(
            {
              error: "Order cannot be placed",
              message: "This customer has been blocked from placing orders. Please contact support for assistance.",
              code: "CUSTOMER_BLOCKED",
            },
            { status: 403 }
          );
        }
      } catch (blockError) {
        // Log error but don't block order creation if check fails
        console.error("[Orders API] Error checking blocked customers:", blockError);
      }
    }

    // Generate custom order ID with brand prefix
    let brandName: string | undefined = undefined;
    try {
      // Priority 1: Get from brand_config collection
      const brandConfigCol = await getMerchantCollectionForAPI("brand_config");
      const brandConfigQuery = await buildMerchantQuery({ id: "brand_config_v1" });
      const brandConfig = await brandConfigCol.findOne(brandConfigQuery);

      if (brandConfig) {
        brandName = (brandConfig as any)?.brandName;
        if (brandName) {
          console.log(`✅ [Orders API] Using brand name from brand_config: ${brandName}`);
        }
      }

      // Priority 2: Try merchant data as fallback
      if (!brandName) {
        try {
          const merchant = await getCurrentMerchant();
          if (merchant) {
            brandName = (merchant as any)?.settings?.brandName || (merchant as any)?.name;
            if (brandName) {
              console.log(`✅ [Orders API] Using brand name from merchant: ${brandName}`);
            }
          }
        } catch (merchantError) {
          console.warn("[Orders API] Could not fetch merchant data for custom order ID:", merchantError);
        }
      }
    } catch (error) {
      console.warn("[Orders API] Error fetching brand name for custom order ID:", error);
    }

    // Generate the custom order ID (format: BRD-1234567)
    const customOrderId = generateCustomOrderId(brandName);
    console.log(`✅ [Orders API] Generated custom order ID: ${customOrderId}`);

    // Create the order first to get the order ID
    const doc: any = { ...body };
    const createdAt = new Date().toISOString();
    if (body?.id) doc._id = new ObjectId(body.id);
    if (!doc.createdAt) doc.createdAt = createdAt;
    doc.customOrderId = customOrderId;

    // Ensure coupon fields are saved if present
    if (body.couponCode) {
      doc.couponCode = body.couponCode;
    }
    if (body.couponId) {
      doc.couponId = body.couponId;
    }

    // Save source tracking data if present (fbclid, UTM parameters, etc.)
    if (body.sourceTracking) {
      doc.sourceTracking = body.sourceTracking;
    }

    // Capture IP address
    let clientIP: string | null = null;
    try {
      clientIP = getClientIP(request.headers);
      if (clientIP) {
        doc.ipAddress = clientIP;
      }
    } catch (ipError) {
      // Log but don't block order creation
      console.error("[Orders API] Error capturing IP:", ipError);
    }

    // Check for affiliate cookie and process commission
    let affiliateId: string | null = null;
    let affiliateCode: string | null = null;
    let affiliateCommission: number = 0;

    try {
      // Get affiliate cookie from request headers
      const cookieHeader = request.headers.get("cookie");
      console.log("[Orders API] Cookie header present:", !!cookieHeader);
      if (cookieHeader) {
        const { parseAffiliateCookie, getAffiliateCookieName } = await import("@/lib/affiliate-helpers");
        const cookieName = getAffiliateCookieName();
        console.log("[Orders API] Looking for cookie:", cookieName);
        // Split cookies and find the matching one (handle spaces and case)
        const cookies = cookieHeader.split(";").map((c) => c.trim());
        const cookieMatch = cookies.find((c) => c.toLowerCase().startsWith(`${cookieName.toLowerCase()}=`));
        console.log("[Orders API] Cookie match found:", !!cookieMatch);
        if (cookieMatch) {
          console.log("[Orders API] Cookie match value (first 150 chars):", cookieMatch.substring(0, 150));
        }

        if (cookieMatch) {
          // Extract cookie value - handle case where = might appear in the value
          const equalIndex = cookieMatch.indexOf("=");
          let cookieValue = equalIndex >= 0 ? cookieMatch.substring(equalIndex + 1) : "";
          cookieValue = cookieValue.trim();

          console.log("[Orders API] Raw cookie value (first 150 chars):", cookieValue.substring(0, 150));

          // Try to decode - cookie might be double-encoded
          let decodedValue = cookieValue;
          try {
            // First decode URI component (cookie is URL encoded when set)
            decodedValue = decodeURIComponent(cookieValue);
            console.log("[Orders API] First decode (first 150 chars):", decodedValue.substring(0, 150));

            // Check if it's still encoded (double-encoded case)
            // If it still starts with % and looks like encoded JSON, decode again
            if (decodedValue.startsWith("%") || decodedValue.includes("%22") || decodedValue.includes("%7B")) {
              try {
                decodedValue = decodeURIComponent(decodedValue);
                console.log("[Orders API] Second decode (first 150 chars):", decodedValue.substring(0, 150));
              } catch (secondDecodeError) {
                console.log("[Orders API] Second decode failed, using first decode result");
              }
            }

            console.log("[Orders API] Final decoded cookie value (first 150 chars):", decodedValue.substring(0, 150));
          } catch (decodeError) {
            console.log("[Orders API] Cookie decode failed, trying as-is. Error:", decodeError);
            decodedValue = cookieValue;
          }

          if (decodedValue) {
            // Parse the JSON string from cookie
            let cookieData: any = null;
            try {
              // Cookie value should be a JSON string
              cookieData = parseAffiliateCookie(decodedValue);
              if (cookieData) {
                console.log("[Orders API] ✅ Parsed cookie data successfully:", {
                  promoCode: cookieData.promoCode,
                  affiliateId: cookieData.affiliateId,
                  expiry: cookieData.expiry,
                  isExpired: cookieData.expiry ? Date.now() > cookieData.expiry : "unknown",
                });
              } else {
                console.warn("[Orders API] ⚠️ parseAffiliateCookie returned null");
              }
            } catch (parseError) {
              console.error("[Orders API] Error in parseAffiliateCookie:", parseError);
              // Try parsing as direct JSON if parseAffiliateCookie failed
              try {
                const parsed = JSON.parse(decodedValue);
                console.log("[Orders API] Direct JSON parse successful:", {
                  promoCode: parsed.promoCode,
                  affiliateId: parsed.affiliateId,
                  hasTimestamp: !!parsed.timestamp,
                  hasExpiry: !!parsed.expiry,
                });
                if (parsed.promoCode && parsed.affiliateId) {
                  // Validate expiry if present
                  if (parsed.expiry && Date.now() > parsed.expiry) {
                    console.warn("[Orders API] Cookie expired:", { expiry: parsed.expiry, now: Date.now() });
                    cookieData = null;
                  } else {
                    cookieData = parsed;
                  }
                } else {
                  console.warn("[Orders API] Parsed JSON missing required fields. Has:", Object.keys(parsed));
                }
              } catch (jsonError: any) {
                console.error("[Orders API] Cookie value is not valid JSON");
                console.error("[Orders API] JSON parse error:", jsonError?.message);
                console.error("[Orders API] Cookie value preview:", decodedValue.substring(0, 200));
              }
            }

            if (cookieData) {
              console.log("[Orders API] Cookie data parsed:", { promoCode: cookieData.promoCode, affiliateId: cookieData.affiliateId });
              // Validate cookie expiry
              if (cookieData.expiry && Date.now() > cookieData.expiry) {
                console.log("[Orders API] Affiliate cookie expired");
              } else {
                // Get affiliate settings
                const settingsCol = await getMerchantCollectionForAPI<AffiliateSettings>("affiliate_settings");
                const settings = (await settingsCol.findOne(
                  await buildMerchantQuery({ id: "affiliate_settings_v1" })
                )) as AffiliateSettings | null;

                console.log("[Orders API] Affiliate settings:", { enabled: settings?.enabled, found: !!settings });

                if (settings && settings.enabled) {
                  // Find affiliate by ID from cookie
                  const affiliatesCol = await getMerchantCollectionForAPI("affiliates");

                  // Try to find affiliate by ID first
                  let affiliate = null;
                  if (ObjectId.isValid(cookieData.affiliateId)) {
                    affiliate = await affiliatesCol.findOne({
                      ...orderQuery,
                      _id: new ObjectId(cookieData.affiliateId),
                      status: "active",
                    });
                  }

                  // If not found by ID, try by promo code
                  if (!affiliate && cookieData.promoCode) {
                    affiliate = await affiliatesCol.findOne({
                      ...orderQuery,
                      promoCode: cookieData.promoCode.toUpperCase(),
                      status: "active",
                    });
                  }

                  if (affiliate) {
                    console.log("[Orders API] Affiliate found:", {
                      id: String(affiliate._id),
                      promoCode: affiliate.promoCode,
                      level: affiliate.currentLevel,
                    });
                    affiliateId = String(affiliate._id);
                    affiliateCode = affiliate.promoCode;

                    // Get affiliate's current level (based on delivered sales)
                    const currentLevel = (affiliate.currentLevel || 1) as CommissionLevel;

                    // Calculate commission based on affiliate's current level
                    const { calculateCommission } = await import("@/lib/affiliate-helpers");
                    const commission = calculateCommission(body.total, currentLevel, settings);
                    console.log("[Orders API] Commission calculation:", {
                      orderTotal: body.total,
                      level: currentLevel,
                      commission,
                      settingsLevels: settings.commissionLevels,
                    });

                    if (commission && commission.amount > 0) {
                      affiliateCommission = commission.amount;

                      // Save affiliate info to order
                      doc.affiliateCode = affiliateCode;
                      doc.affiliateId = affiliateId;
                      doc.affiliateCommission = affiliateCommission;

                      // Store commission data for later insertion after order is created
                      (doc as any)._pendingCommission = {
                        affiliateId: affiliateId,
                        level: currentLevel,
                        orderTotal: body.total,
                        commissionPercentage: commission.percentage,
                        commissionAmount: commission.amount,
                        status: "pending",
                        createdAt: createdAt,
                        updatedAt: createdAt,
                      };

                      console.log(
                        `[Orders API] ✅ Affiliate commission calculated: ${affiliateCode} - ${affiliateCommission} for order ${body.total}`
                      );
                    } else {
                      console.warn(`[Orders API] ⚠️ No commission calculated for affiliate ${affiliateCode}`, {
                        commission,
                        orderTotal: body.total,
                        level: currentLevel,
                        levelConfig: settings.commissionLevels[currentLevel],
                      });
                    }
                  } else {
                    console.warn(`[Orders API] ⚠️ Affiliate not found:`, {
                      affiliateId: cookieData.affiliateId,
                      promoCode: cookieData.promoCode,
                    });
                  }
                } else {
                  console.log("[Orders API] Affiliate system not enabled or settings not found");
                }
              }
            } else {
              console.warn("[Orders API] ⚠️ Invalid or missing affiliate cookie data");
              console.warn("[Orders API] decodedValue:", decodedValue ? decodedValue.substring(0, 200) : "null/empty");
              console.warn("[Orders API] cookieValue (raw):", cookieValue ? cookieValue.substring(0, 200) : "null/empty");
            }
          }
        }
      }
    } catch (affiliateError) {
      // Log error but don't block order creation
      console.error("[Orders API] Error processing affiliate commission:", affiliateError);
    }

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        doc.merchantId = merchantId;
      }
    }

    // Ensure all required fields are present
    if (!doc.status) doc.status = "pending";
    if (!doc.orderType) doc.orderType = "online";
    if (!doc.items) doc.items = [];
    if (doc.subtotal === undefined) doc.subtotal = 0;
    if (doc.shipping === undefined) doc.shipping = 0;
    if (doc.total === undefined) doc.total = 0;
    if (!doc.paymentMethod) doc.paymentMethod = "cod";
    if (!doc.updatedAt) doc.updatedAt = createdAt;

    const res = await ordersCol.insertOne(doc);
    const orderId = String(res.insertedId || doc._id);

    if (!orderId) {
      console.error("[Orders API] Failed to create order - no ID returned");
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Get detailed geolocation data asynchronously (don't block order creation)
    if (clientIP) {
      getDetailedIpGeolocation(clientIP)
        .then((geoData) => {
          if (geoData) {
            // Update order with geolocation data
            ordersCol.updateOne(
              { _id: res.insertedId },
              {
                $set: {
                  ipGeolocation: {
                    ...geoData,
                    capturedAt: new Date().toISOString(),
                  },
                },
              }
            ).catch((err) => {
              console.error("[Orders API] Failed to update geolocation:", err);
            });
          }
        })
        .catch((err) => {
          console.error("[Orders API] Failed to fetch geolocation:", err);
        });
    }

    // Process affiliate commission after order is created
    if ((doc as any)._pendingCommission && affiliateId) {
      try {
        console.log(`[Orders API] 💰 Processing commission for affiliate ${affiliateId}, order ${orderId}`);
        const commissionsCol = await getMerchantCollectionForAPI("affiliate_commissions");
        const commissionData = (doc as any)._pendingCommission;
        const commissionDoc: any = {
          ...commissionData,
          orderId: orderId,
        };

        if (merchantId) {
          const useShared = await isUsingSharedDatabase();
          if (useShared) {
            commissionDoc.merchantId = merchantId;
          }
        }

        const insertResult = await commissionsCol.insertOne(commissionDoc);
        console.log(
          `[Orders API] ✅ Commission saved: ID=${insertResult.insertedId}, Affiliate=${affiliateId}, Order=${orderId}, Amount=${affiliateCommission}`
        );

        // Update affiliate stats - only increment totalOrders (don't add to balance until delivered)
        const affiliatesCol = await getMerchantCollectionForAPI("affiliates");
        const updateResult = await affiliatesCol.updateOne(
          { ...orderQuery, _id: new ObjectId(affiliateId) },
          {
            $inc: {
              totalOrders: 1, // Only increment order count, balance will be added when delivered
            },
            $set: {
              updatedAt: createdAt,
            },
          }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(
            `[Orders API] ✅ Affiliate stats updated: ${affiliateId} - Total orders incremented (balance will be added when order is delivered)`
          );
        } else {
          console.warn(`[Orders API] ⚠️ Failed to update affiliate stats: ${affiliateId} - No document modified. Query:`, {
            ...orderQuery,
            _id: affiliateId,
          });
        }
      } catch (commissionError: any) {
        console.error("[Orders API] ❌ Error saving affiliate commission:", commissionError);
        console.error("[Orders API] Commission data:", (doc as any)._pendingCommission);
        console.error("[Orders API] Error stack:", commissionError?.stack);
      }
    } else {
      if (!affiliateId) {
        console.log("[Orders API] ⚠️ No affiliate ID found, skipping commission processing");
      }
      if (!(doc as any)._pendingCommission) {
        console.log("[Orders API] ⚠️ No pending commission found, skipping commission processing");
      }
    }

    // Emit real-time order update to merchant dashboard IMMEDIATELY
    if (merchantId) {
      const formattedOrder: Order = {
        id: orderId,
        createdAt: doc.createdAt,
        status: doc.status,
        orderType: doc.orderType || "online",
        items: doc.items,
        subtotal: Number(doc.subtotal ?? 0),
        discountPercentage: doc.discountPercentage !== undefined ? Number(doc.discountPercentage) : undefined,
        discountAmount: doc.discountAmount !== undefined ? Number(doc.discountAmount) : undefined,
        vatTaxPercentage: doc.vatTaxPercentage !== undefined ? Number(doc.vatTaxPercentage) : undefined,
        vatTaxAmount: doc.vatTaxAmount !== undefined ? Number(doc.vatTaxAmount) : undefined,
        shipping: Number(doc.shipping ?? 0),
        total: Number(doc.total ?? 0),
        paymentMethod: doc.paymentMethod,
        paymentStatus: doc.paymentStatus,
        paidAmount: doc.paidAmount !== undefined ? Number(doc.paidAmount) : undefined,
        paymentTransactionId: doc.paymentTransactionId,
        paymentValId: doc.paymentValId,
        customer: doc.customer,
        courier: doc.courier,
        couponCode: doc.couponCode,
        couponId: doc.couponId,
        affiliateCode: doc.affiliateCode,
        affiliateId: doc.affiliateId,
        affiliateCommission: doc.affiliateCommission,
      };
      console.log(`[Orders API] Emitting new-order event to merchant:${merchantId}`, { orderId, total: formattedOrder.total });
      emitOrderUpdate(merchantId, formattedOrder);
    } else {
      console.warn("[Orders API] Cannot emit order update: merchantId is null");
    }

    // Create notifications and emit socket events IMMEDIATELY (don't wait for DB writes)
    // This ensures real-time updates happen instantly
    let merchantUsers: any[] = [];
    try {
      const notificationsCol = await getMerchantCollectionForAPI("notifications");
      const usersCol = await getMerchantCollectionForAPI("users");
      const brandConfigCol = await getMerchantCollectionForAPI("brand_config");

      // Parallelize database queries
      const [brandConfig, merchantUserDocs] = await Promise.all([
        brandConfigCol.findOne(orderQuery),
        usersCol.find({ ...orderQuery, role: { $in: ["merchant", "admin"] } }).toArray(),
      ]);
      merchantUsers = merchantUserDocs;

      const currencyIso = (brandConfig as any)?.currency?.iso || "USD";
      const currencySymbol = getCurrencySymbol(currencyIso);

      const notificationTitle = "New Order Received";
      const notificationMessage = `New order #${orderId.slice(-6)} for ${currencySymbol}${body.total.toFixed(2)} from ${
        body.customer?.fullName || "Customer"
      }`;
      const notificationLink = `/merchant/orders/${orderId}`;

      // Prepare notification data
      const useShared = merchantId ? await isUsingSharedDatabase() : false;

      // Emit socket notifications IMMEDIATELY for all users (before DB writes)
      // Generate IDs upfront and emit immediately - this ensures instant real-time updates
      const notificationPromises = merchantUsers.map(async (user) => {
        // Generate ID upfront so we can emit immediately
        const notificationId = new ObjectId();
        const notificationIdString = String(notificationId);

        // Emit socket event IMMEDIATELY (synchronous, instant)
        emitNotification(String(user._id), {
          id: notificationIdString,
          title: notificationTitle,
          message: notificationMessage,
          type: "info",
          read: false,
          createdAt: createdAt,
          link: notificationLink,
        });

        // Prepare notification document for database
        const notification: any = {
          _id: notificationId,
          userId: user._id,
          title: notificationTitle,
          message: notificationMessage,
          type: "info",
          read: false,
          link: notificationLink,
          createdAt: createdAt,
        };

        if (merchantId && useShared) {
          notification.merchantId = merchantId;
        }

        // Save to database (non-blocking - don't await)
        return notificationsCol.insertOne(notification).catch((error) => {
          console.error(`Failed to save notification ${notificationIdString} to database:`, error);
        });
      });

      // Don't await DB writes - let them complete in background
      // The socket events have already been emitted, so users get instant notifications
      Promise.all(notificationPromises).catch((error) => {
        console.error("Error creating notifications in database:", error);
      });
    } catch (notificationError) {
      console.error("Failed to create notifications:", notificationError);
      // Don't fail the order creation if notification creation fails
    }

    // Send email notifications (order confirmation to customer + admin alert)
    try {
      const { sendEmailEvent } = await import("@/lib/email-service");
      const customerEmail = body.customer?.email;
      const customerName = body.customer?.fullName || "Customer";
      const orderItems = Array.isArray(body.items) ? body.items.map((item) => `${item.name} x${item.quantity || 1}`).join(", ") : "";

      if (customerEmail) {
        sendEmailEvent({
          event: "order_confirmation",
          to: customerEmail,
          merchantId: merchantId || undefined,
          variables: {
            orderId,
            customerName,
            orderTotal: body.total,
            orderDate: createdAt,
            paymentMethod: body.paymentMethod,
            orderItems,
            trackingLink: "",
          },
        })
          .then((result) => {
            if (!result.ok) {
              console.error(`[Order ${orderId}] Failed to send order confirmation email to ${customerEmail}:`, result.error);
            } else {
              console.log(
                `[Order ${orderId}] Order confirmation email sent successfully to ${customerEmail} (Provider: ${result.provider})`
              );
            }
          })
          .catch((error) => {
            console.error(`[Order ${orderId}] Exception while sending order confirmation email to ${customerEmail}:`, error);
          });
      } else {
        console.warn(`[Order ${orderId}] No customer email provided, skipping order confirmation email`);
      }

      const adminRecipients = (merchantUsers || []).map((u: any) => u.email).filter(Boolean);
      if (adminRecipients.length) {
        sendEmailEvent({
          event: "admin_new_order_alert",
          to: adminRecipients,
          merchantId: merchantId || undefined,
          variables: {
            orderId,
            orderTotal: body.total,
            orderDate: createdAt,
            customerName,
            orderItems,
          },
        })
          .then((result) => {
            if (!result.ok) {
              console.error(`[Order ${orderId}] Failed to send admin alert email:`, result.error);
            } else {
              console.log(`[Order ${orderId}] Admin alert email sent successfully (Provider: ${result.provider})`);
            }
          })
          .catch((error) => {
            console.error(`[Order ${orderId}] Exception while sending admin alert email:`, error);
          });
      }
    } catch (emailError) {
      console.error(`[Order ${orderId}] Error dispatching order emails:`, emailError);
    }

    // Deduct stock for all products and log transactions
    const transactionsCol = await getMerchantCollectionForAPI("inventory_transactions");

    for (const update of stockUpdates) {
      const productId = new ObjectId(update.productId);
      const product = (await productsCol.findOne({ _id: productId })) as any;

      if (product && product.stock !== undefined) {
        const previousStock = Number(product.stock ?? 0);
        const quantity = update.quantity;
        const newStock = previousStock - quantity;

        // Update product stock
        await productsCol.updateOne({ _id: productId }, { $inc: { stock: -quantity } });

        // Log inventory transaction with order ID
        await transactionsCol.insertOne({
          productId: update.productId,
          productName: product.name,
          type: "order",
          quantity: -quantity,
          previousStock,
          newStock,
          orderId,
          createdAt,
        });
      }
    }

    const savedOrder: Order = {
      ...body,
      id: orderId,
      createdAt: doc.createdAt,
      status: doc.status,
      orderType: doc.orderType || "online",
      items: doc.items,
      subtotal: Number(doc.subtotal ?? 0),
      discountPercentage: doc.discountPercentage !== undefined ? Number(doc.discountPercentage) : undefined,
      discountAmount: doc.discountAmount !== undefined ? Number(doc.discountAmount) : undefined,
      vatTaxPercentage: doc.vatTaxPercentage !== undefined ? Number(doc.vatTaxPercentage) : undefined,
      vatTaxAmount: doc.vatTaxAmount !== undefined ? Number(doc.vatTaxAmount) : undefined,
      shipping: Number(doc.shipping ?? 0),
      total: Number(doc.total ?? 0),
      paymentMethod: doc.paymentMethod,
      paymentStatus: doc.paymentStatus,
      paidAmount: doc.paidAmount !== undefined ? Number(doc.paidAmount) : undefined,
      paymentTransactionId: doc.paymentTransactionId,
      paymentValId: doc.paymentValId,
      customer: doc.customer,
      courier: doc.courier,
      couponCode: doc.couponCode,
      couponId: doc.couponId,
      affiliateCode: doc.affiliateCode,
      affiliateId: doc.affiliateId,
      affiliateCommission: doc.affiliateCommission,
      sourceTracking: doc.sourceTracking,
    };

    // Send server-side purchase tracking for COD orders (online orders tracked in payment success)
    if (body.paymentMethod === "cod") {
      try {
        const { trackPurchase } = await import("@/lib/tracking/server-side-tracking");
        await trackPurchase({
          orderId: orderId,
          value: body.total,
          // Currency will be fetched from brand config automatically
          contentIds: body.items?.map((item: any) => item.productId) || [],
          numItems: body.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0,
          userData: body.customer
            ? {
                email: body.customer.email,
                phone: body.customer.phone,
                firstName: body.customer.fullName?.split(" ")[0],
                lastName: body.customer.fullName?.split(" ").slice(1).join(" "),
                city: body.customer.city,
                zipCode: body.customer.postalCode,
              }
            : undefined,
        });
      } catch (error) {
        // Fail silently - tracking should not block order creation
        console.error("Failed to send server-side purchase tracking:", error);
      }
    }

    // Revalidate cache after creating order
    await revalidateCache([CACHE_TAGS.ORDERS, CACHE_TAGS.ORDER(orderId), CACHE_TAGS.INVENTORY, CACHE_TAGS.STATISTICS]);

    // Silently check fraud risk after order creation (non-blocking, fire-and-forget)
    // This runs asynchronously and does not delay the order response
    if (body.customer?.phone) {
      // Fire and forget - don't await to avoid delaying order response
      (async () => {
        try {
          // Build super-admin URL for fraud check
          const buildSuperAdminUrl = (path: string): string => {
            const baseUrl = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "http://localhost:3001";
            const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
            const cleanPath = path.startsWith("/") ? path : `/${path}`;
            return `${cleanBase}${cleanPath}`;
          };

          const superAdminUrl = buildSuperAdminUrl("/api/fraud-check");
          const phone = body.customer.phone.trim();

          // Call fraud check API (with timeout to not delay order response)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const fraudResponse = await fetch(superAdminUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone }),
            signal: controller.signal,
            cache: "no-store",
          });

          clearTimeout(timeoutId);

          if (fraudResponse.ok) {
            const fraudData = await fraudResponse.json();

            // Transform fraud data to match CustomerFraudData format
            let fraudInfo: any = null;

            if (fraudData.success && fraudData.data) {
              // Check if it's the new Onecodesoft format
              if (fraudData.data.total_parcel !== undefined && fraudData.data.response !== undefined) {
                // Transform Onecodesoft response to CustomerFraudData format
                fraudInfo = {
                  ...transformOnecodesoftResponse(fraudData.data as OnecodesoftFraudCheckResponse),
                  checkedAt: createdAt,
                };
              } else if (fraudData.data.total_parcels !== undefined) {
                // Already in CustomerFraudData format (backward compatibility)
                fraudInfo = {
                  ...fraudData.data,
                  checkedAt: createdAt,
                };
              }
            } else if (fraudData.status === "success" && fraudData.courierData) {
              // Handle old legacy API response structure (backward compatibility)
              const summary = fraudData.courierData.summary;
              const successRate = summary.success_ratio;
              const fraud_risk = successRate >= 90 ? "low" : successRate >= 70 ? "medium" : "high";

              const courier_history = Object.entries(fraudData.courierData)
                .filter(([key]) => key !== "summary")
                .map(([key, item]: [string, any]) => {
                  if ("name" in item && "logo" in item) {
                    return {
                      courier: item.name,
                      total: item.total_parcel,
                      successful: item.success_parcel,
                      failed: item.cancelled_parcel,
                      success_rate: item.success_ratio,
                      logo: item.logo,
                    };
                  }
                  return null;
                })
                .filter((item): item is NonNullable<typeof item> => item !== null && item.total > 0);

              fraudInfo = {
                phone,
                total_parcels: summary.total_parcel,
                successful_deliveries: summary.success_parcel,
                failed_deliveries: summary.cancelled_parcel,
                success_rate: successRate,
                fraud_risk,
                courier_history,
                checkedAt: createdAt,
              };
            }

            // Update order with fraud data if available
            if (fraudInfo) {
              const updateQuery = { _id: new ObjectId(orderId), ...orderQuery };
              await ordersCol.updateOne(updateQuery, {
                $set: { fraudCheck: fraudInfo },
              });
            }
          }
        } catch (error) {
          // Fail silently - fraud check should not block order creation
          console.error("Failed to check fraud risk for order:", orderId, error);
        }
      })();
    }

    return NextResponse.json(savedOrder, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/orders error:", e);
    return NextResponse.json({ error: e?.message || "Invalid request" }, { status: 400 });
  }
}
