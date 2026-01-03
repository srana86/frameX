import { NextResponse } from "next/server";
import type { Order, CartLineItem, CustomerInfo, SourceTrackingData } from "@/lib/types";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import { emitOrderUpdate, emitNotification } from "@/lib/socket-emitter";
import type { CommissionLevel, AffiliateSettings } from "@/lib/affiliate-types";
import { CACHE_TAGS, revalidateCache } from "@/lib/cache-helpers";
import { getClientIP, getDetailedIpGeolocation } from "@/lib/geolocation";
import { transformOnecodesoftResponse, type OnecodesoftFraudCheckResponse } from "@/lib/fraud-check/fraudshield-api";
import { generateCustomOrderId } from "@/lib/tracking-id";
import { getCurrentMerchant } from "@/lib/merchant-context";

interface PlaceOrderRequest {
  productSlug: string;
  quantity: number;
  size?: string;
  color?: string;
  customer: CustomerInfo;
  paymentMethod?: "cod" | "online";
  shipping?: number;
  notes?: string;
  couponCode?: string;
  sourceTracking?: SourceTrackingData;
}

/**
 * POST /api/orders/place
 * Public API endpoint for placing orders without authentication
 * Accepts product slug and customer details to create an order
 */
export async function POST(request: Request) {
  try {
    let body: PlaceOrderRequest;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("[Place Order API] Failed to parse request body as JSON:", jsonError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Validate required fields
    if (!body.productSlug) {
      return NextResponse.json({ error: "Product slug is required" }, { status: 400 });
    }
    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 });
    }
    if (
      !body.customer?.fullName ||
      !body.customer?.phone ||
      !body.customer?.addressLine1 ||
      !body.customer?.city ||
      !body.customer?.postalCode
    ) {
      return NextResponse.json({ error: "Complete customer information is required" }, { status: 400 });
    }

    const productsCol = await getMerchantCollectionForAPI("products");
    const orderQuery = await buildMerchantQuery();

    // Find product by slug
    const product = (await productsCol.findOne({
      slug: body.productSlug,
      ...orderQuery,
    })) as any;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check stock availability
    if (product.stock !== undefined && product.stock < body.quantity) {
      return NextResponse.json(
        {
          error: "Insufficient stock",
          available: product.stock,
          requested: body.quantity,
        },
        { status: 400 }
      );
    }

    // Calculate pricing
    const basePrice = Number(product.price ?? 0);
    const discountPercentage = product.discountPercentage ? Number(product.discountPercentage) : 0;
    const discountedPrice = discountPercentage > 0 ? basePrice * (1 - discountPercentage / 100) : basePrice;

    // Create cart line item
    const lineItem: CartLineItem = {
      productId: String(product._id),
      slug: product.slug,
      name: product.name,
      price: discountedPrice,
      image: product.images?.[0] || "",
      size: body.size,
      color: body.color,
      quantity: body.quantity,
    };

    // Calculate order totals
    const subtotal = discountedPrice * body.quantity;
    const shipping = Number(body.shipping ?? 0);
    const discountAmount = discountPercentage > 0 ? (basePrice - discountedPrice) * body.quantity : 0;
    const total = subtotal + shipping;

    // Create order object
    const orderData: Order = {
      id: "", // Will be set by the order creation logic
      createdAt: new Date().toISOString(),
      status: "pending",
      orderType: "online",
      items: [lineItem],
      subtotal: subtotal,
      discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      shipping: shipping,
      total: total,
      paymentMethod: body.paymentMethod || "cod",
      customer: {
        ...body.customer,
        notes: body.notes,
      },
      couponCode: body.couponCode,
    };

    // Use the existing order creation endpoint logic
    const ordersCol = await getMerchantCollectionForAPI("orders");
    const merchantId = await getMerchantIdForAPI();

    // Prepare stock updates (we already validated stock earlier)
    const stockUpdates: Array<{ productId: string; quantity: number }> = [{ productId: lineItem.productId, quantity: body.quantity }];

    // Check if customer is blocked (fraud protection)
    if (orderData.customer?.phone || orderData.customer?.email) {
      try {
        const blockedCollection = await getCollection("blocked_customers");
        const orConditions: Record<string, unknown>[] = [];

        if (orderData.customer.phone) {
          const normalizedPhone = orderData.customer.phone.replace(/\D/g, "").slice(-11);
          orConditions.push(
            { phone: orderData.customer.phone },
            { phone: normalizedPhone },
            { phone: { $regex: normalizedPhone.slice(-10) + "$" } }
          );
        }

        if (orderData.customer.email) {
          orConditions.push({ email: orderData.customer.email.toLowerCase() });
        }

        const blocked = await blockedCollection.findOne({
          $or: orConditions,
          isActive: true,
        });

        if (blocked) {
          console.log(`[Place Order API] Blocked customer attempted to place order: ${orderData.customer.phone}`);
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
        console.error("[Place Order API] Error checking blocked customers:", blockError);
      }
    }

    // Process affiliate commission
    let affiliateId: string | null = null;
    let affiliateCode: string | null = null;
    let affiliateCommission: number = 0;
    let affiliate: any = null;

    try {
      // Get affiliate cookie from request headers
      const cookieHeader = request.headers.get("cookie");
      console.log("[Place Order API] Cookie header present:", !!cookieHeader);
      if (cookieHeader) {
        const { parseAffiliateCookie, getAffiliateCookieName } = await import("@/lib/affiliate-helpers");
        const cookieName = getAffiliateCookieName();
        console.log("[Place Order API] Looking for cookie:", cookieName);
        // Split cookies and find the matching one (handle spaces and case)
        const cookies = cookieHeader.split(";").map((c) => c.trim());
        const cookieMatch = cookies.find((c) => c.toLowerCase().startsWith(`${cookieName.toLowerCase()}=`));
        console.log("[Place Order API] Cookie match found:", !!cookieMatch);
        if (cookieMatch) {
          console.log("[Place Order API] Cookie match value (first 150 chars):", cookieMatch.substring(0, 150));
        }

        if (cookieMatch) {
          // Extract cookie value - handle case where = might appear in the value
          const equalIndex = cookieMatch.indexOf("=");
          let cookieValue = equalIndex >= 0 ? cookieMatch.substring(equalIndex + 1) : "";
          cookieValue = cookieValue.trim();

          console.log("[Place Order API] Raw cookie value (first 150 chars):", cookieValue.substring(0, 150));

          // Try to decode - cookie might be double-encoded
          let decodedValue = cookieValue;
          try {
            // First decode URI component (cookie is URL encoded when set)
            decodedValue = decodeURIComponent(cookieValue);
            console.log("[Place Order API] First decode (first 150 chars):", decodedValue.substring(0, 150));

            // Check if it's still encoded (double-encoded case)
            // If it still starts with % and looks like encoded JSON, decode again
            if (decodedValue.startsWith("%") || decodedValue.includes("%22") || decodedValue.includes("%7B")) {
              try {
                decodedValue = decodeURIComponent(decodedValue);
                console.log("[Place Order API] Second decode (first 150 chars):", decodedValue.substring(0, 150));
              } catch (secondDecodeError) {
                console.log("[Place Order API] Second decode failed, using first decode result");
              }
            }

            console.log("[Place Order API] Final decoded cookie value (first 150 chars):", decodedValue.substring(0, 150));
          } catch (decodeError) {
            console.log("[Place Order API] Cookie decode failed, trying as-is. Error:", decodeError);
            decodedValue = cookieValue;
          }

          if (decodedValue) {
            // Parse the JSON string from cookie
            let cookieData: any = null;
            try {
              // Cookie value should be a JSON string
              cookieData = parseAffiliateCookie(decodedValue);
              if (cookieData) {
                console.log("[Place Order API] ✅ Parsed cookie data successfully:", {
                  promoCode: cookieData.promoCode,
                  affiliateId: cookieData.affiliateId,
                  expiry: cookieData.expiry,
                  isExpired: cookieData.expiry ? Date.now() > cookieData.expiry : "unknown",
                });
              } else {
                console.warn("[Place Order API] ⚠️ parseAffiliateCookie returned null");
              }
            } catch (parseError) {
              console.error("[Place Order API] Error in parseAffiliateCookie:", parseError);
              // Try parsing as direct JSON if parseAffiliateCookie failed
              try {
                const parsed = JSON.parse(decodedValue);
                console.log("[Place Order API] Direct JSON parse successful:", {
                  promoCode: parsed.promoCode,
                  affiliateId: parsed.affiliateId,
                  hasTimestamp: !!parsed.timestamp,
                  hasExpiry: !!parsed.expiry,
                });
                if (parsed.promoCode && parsed.affiliateId) {
                  // Validate expiry if present
                  if (parsed.expiry && Date.now() > parsed.expiry) {
                    console.warn("[Place Order API] Cookie expired:", { expiry: parsed.expiry, now: Date.now() });
                    cookieData = null;
                  } else {
                    cookieData = parsed;
                  }
                } else {
                  console.warn("[Place Order API] Parsed JSON missing required fields. Has:", Object.keys(parsed));
                }
              } catch (jsonError: any) {
                console.error("[Place Order API] Cookie value is not valid JSON:", jsonError?.message);
                console.error("[Place Order API] Cookie value preview:", decodedValue.substring(0, 200));
                console.error("[Place Order API] Raw decoded value type:", typeof decodedValue);
                // Continue without affiliate data - don't fail the order
              }
            }

            if (cookieData) {
              console.log("[Place Order API] Cookie data parsed:", {
                promoCode: cookieData.promoCode,
                affiliateId: cookieData.affiliateId,
              });
              // Validate cookie expiry
              if (cookieData.expiry && Date.now() > cookieData.expiry) {
                console.log("[Place Order API] Affiliate cookie expired");
              } else {
                // Get affiliate settings
                const settingsCol = await getMerchantCollectionForAPI<AffiliateSettings>("affiliate_settings");
                const settings = (await settingsCol.findOne(
                  await buildMerchantQuery({ id: "affiliate_settings_v1" })
                )) as AffiliateSettings | null;

                console.log("[Place Order API] Affiliate settings:", { enabled: settings?.enabled, found: !!settings });

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
                    console.log("[Place Order API] Affiliate found:", {
                      id: String(affiliate._id),
                      promoCode: affiliate.promoCode,
                      level: affiliate.currentLevel,
                    });
                    affiliateId = String(affiliate._id);
                    affiliateCode = affiliate.promoCode;

                    // Get affiliate's current level (based on delivered sales)
                    const currentLevel = (affiliate.currentLevel ?? 1) as CommissionLevel;

                    // Calculate commission based on affiliate's current level
                    const { calculateCommission } = await import("@/lib/affiliate-helpers");
                    const commission = calculateCommission(orderData.total, currentLevel, settings);
                    console.log("[Place Order API] Commission calculation:", {
                      orderTotal: orderData.total,
                      level: currentLevel,
                      commission,
                      settingsLevels: settings.commissionLevels,
                    });

                    if (commission && commission.amount > 0) {
                      affiliateCommission = commission.amount;

                      // Save affiliate info to order
                      orderData.affiliateCode = affiliateCode || undefined;
                      orderData.affiliateId = affiliateId || undefined;
                      orderData.affiliateCommission = affiliateCommission;

                      console.log(
                        `[Place Order API] ✅ Affiliate commission calculated: ${affiliateCode} - ${affiliateCommission} for order ${orderData.total}`
                      );
                    } else {
                      console.warn(`[Place Order API] ⚠️ No commission calculated for affiliate ${affiliateCode}`, {
                        commission,
                        orderTotal: orderData.total,
                        level: currentLevel,
                        levelConfig: settings.commissionLevels[currentLevel],
                      });
                    }
                  } else {
                    console.warn(`[Place Order API] ⚠️ Affiliate not found:`, {
                      affiliateId: cookieData.affiliateId,
                      promoCode: cookieData.promoCode,
                    });
                  }
                } else {
                  console.log("[Place Order API] Affiliate system not enabled or settings not found");
                }
              }
            } else {
              console.warn("[Place Order API] ⚠️ Invalid or missing affiliate cookie data");
              console.warn("[Place Order API] decodedValue:", decodedValue ? decodedValue.substring(0, 200) : "null/empty");
              console.warn("[Place Order API] cookieValue (raw):", cookieValue ? cookieValue.substring(0, 200) : "null/empty");
            }
          }
        }
      }
    } catch (affiliateError) {
      // Log error but don't block order creation
      console.error("[Place Order API] Error processing affiliate commission:", affiliateError);
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
          console.log(`✅ [Place Order] Using brand name from brand_config: ${brandName}`);
        }
      }

      // Priority 2: Try merchant data as fallback
      if (!brandName) {
        try {
          const merchant = await getCurrentMerchant();
          if (merchant) {
            brandName = (merchant as any)?.settings?.brandName || (merchant as any)?.name;
            if (brandName) {
              console.log(`✅ [Place Order] Using brand name from merchant: ${brandName}`);
            }
          }
        } catch (merchantError) {
          console.warn("[Place Order] Could not fetch merchant data for custom order ID:", merchantError);
        }
      }
    } catch (error) {
      console.warn("[Place Order] Error fetching brand name for custom order ID:", error);
    }

    // Generate the custom order ID (format: BRD-1234567)
    const customOrderId = generateCustomOrderId(brandName);
    console.log(`✅ [Place Order] Generated custom order ID: ${customOrderId}`);

    // Create the order
    const doc: any = { ...orderData };
    const createdAt = new Date().toISOString();
    doc.createdAt = createdAt;
    doc.updatedAt = createdAt;
    doc.customOrderId = customOrderId;

    // Ensure coupon fields are saved if present
    if (body.couponCode) {
      doc.couponCode = body.couponCode;
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
      console.error("[Place Order API] Error capturing IP:", ipError);
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

    const res = await ordersCol.insertOne(doc);
    const orderId = String(res.insertedId || doc._id);

    // Get detailed geolocation data asynchronously (don't block order creation)
    if (clientIP) {
      getDetailedIpGeolocation(clientIP)
        .then((geoData) => {
          if (geoData) {
            // Update order with geolocation data
            ordersCol
              .updateOne(
                { _id: res.insertedId },
                {
                  $set: {
                    ipGeolocation: {
                      ...geoData,
                      capturedAt: new Date().toISOString(),
                    },
                  },
                }
              )
              .catch((err) => {
                console.error("[Place Order API] Failed to update geolocation:", err);
              });
          }
        })
        .catch((err) => {
          console.error("[Place Order API] Failed to fetch geolocation:", err);
        });
    }

    if (!orderId) {
      console.error("[Place Order API] Failed to create order - no ID returned");
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Process affiliate commission after order is created
    if (affiliateId) {
      try {
        console.log(`[Place Order API] 💰 Processing commission for affiliate ${affiliateId}, order ${orderId}`);
        const commissionsCol = await getMerchantCollectionForAPI("affiliate_commissions");
        const commissionDoc: any = {
          affiliateId: affiliateId,
          level: (affiliate.currentLevel ?? 1) as CommissionLevel,
          orderTotal: orderData.total,
          commissionPercentage: (affiliateCommission / orderData.total) * 100,
          commissionAmount: affiliateCommission,
          status: "pending",
          createdAt: createdAt,
          updatedAt: createdAt,
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
          `[Place Order API] ✅ Commission saved: ID=${insertResult.insertedId}, Affiliate=${affiliateId}, Order=${orderId}, Amount=${affiliateCommission}`
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
            `[Place Order API] ✅ Affiliate stats updated: ${affiliateId} - Total orders incremented (balance will be added when order is delivered)`
          );
        } else {
          console.warn(`[Place Order API] ⚠️ Failed to update affiliate stats: ${affiliateId} - No document modified. Query:`, {
            ...orderQuery,
            _id: affiliateId,
          });
        }
      } catch (commissionError: any) {
        console.error("[Place Order API] ❌ Error saving affiliate commission:", commissionError);
        console.error("[Place Order API] Error stack:", commissionError?.stack);
      }
    }

    // Deduct stock for the product
    const transactionsCol = await getMerchantCollectionForAPI("inventory_transactions");

    for (const update of stockUpdates) {
      const productId = new ObjectId(update.productId);
      const productDoc = (await productsCol.findOne({ _id: productId })) as any;

      if (productDoc && productDoc.stock !== undefined) {
        const previousStock = Number(productDoc.stock ?? 0);
        const quantity = update.quantity;
        const newStock = previousStock - quantity;

        // Update product stock
        await productsCol.updateOne({ _id: productId }, { $inc: { stock: -quantity } });

        // Log inventory transaction with order ID
        await transactionsCol.insertOne({
          productId: update.productId,
          productName: productDoc.name,
          type: "order",
          quantity: -quantity,
          previousStock,
          newStock,
          orderId,
          createdAt,
        });
      }
    }

    // Create the saved order object for use in notifications and tracking
    const savedOrder: Order = {
      ...orderData,
      id: orderId,
      customOrderId: doc.customOrderId, // Custom order ID (format: BRD-XXXXXXX)
      createdAt: doc.createdAt,
      status: doc.status,
      orderType: doc.orderType,
      items: doc.items,
      subtotal: Number(doc.subtotal ?? 0),
      discountPercentage: doc.discountPercentage !== undefined ? Number(doc.discountPercentage) : undefined,
      discountAmount: doc.discountAmount !== undefined ? Number(doc.discountAmount) : undefined,
      shipping: Number(doc.shipping ?? 0),
      total: Number(doc.total ?? 0),
      paymentMethod: doc.paymentMethod,
      customer: doc.customer,
      couponCode: doc.couponCode,
      sourceTracking: doc.sourceTracking,
      affiliateCode: doc.affiliateCode,
      affiliateId: doc.affiliateId,
      affiliateCommission: doc.affiliateCommission,
    };

    // Emit real-time order update to merchant dashboard IMMEDIATELY
    if (merchantId) {
      console.log(`[Place Order API] Emitting new-order event to merchant:${merchantId}`, { orderId, total: savedOrder.total });
      emitOrderUpdate(merchantId, savedOrder);
    } else {
      console.warn("[Place Order API] Cannot emit order update: merchantId is null");
    }

    // Create notifications and emit socket events IMMEDIATELY (don't wait for DB writes)
    // This ensures real-time updates happen instantly
    let merchantUsers: any[] = [];
    try {
      const notificationsCol = await getMerchantCollectionForAPI("notifications");
      const usersCol = await getMerchantCollectionForAPI("users");

      // Parallelize database queries
      const [merchantUserDocs] = await Promise.all([usersCol.find({ ...orderQuery, role: { $in: ["merchant", "admin"] } }).toArray()]);
      merchantUsers = merchantUserDocs;

      const notificationTitle = "New Order Received";
      const notificationMessage = `New order #${orderId.slice(-6)} for ${savedOrder.total.toFixed(2)} from ${
        savedOrder.customer?.fullName || "Customer"
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
      const customerEmail = savedOrder.customer?.email;
      const customerName = savedOrder.customer?.fullName || "Customer";
      const orderItems = Array.isArray(savedOrder.items)
        ? savedOrder.items.map((item) => `${item.name} x${item.quantity || 1}`).join(", ")
        : "";

      if (customerEmail) {
        sendEmailEvent({
          event: "order_confirmation",
          to: customerEmail,
          merchantId: merchantId || undefined,
          variables: {
            orderId,
            customerName,
            orderTotal: savedOrder.total,
            orderDate: createdAt,
            paymentMethod: savedOrder.paymentMethod,
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
            orderTotal: savedOrder.total,
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

    // Send server-side purchase tracking for COD orders (online orders tracked in payment success)
    if (savedOrder.paymentMethod === "cod") {
      try {
        const { trackPurchase } = await import("@/lib/tracking/server-side-tracking");
        await trackPurchase({
          orderId: orderId,
          value: savedOrder.total,
          // Currency will be fetched from brand config automatically
          contentIds: savedOrder.items?.map((item: any) => item.productId) || [],
          numItems: savedOrder.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0,
          userData: savedOrder.customer
            ? {
                email: savedOrder.customer.email,
                phone: savedOrder.customer.phone,
                firstName: savedOrder.customer.fullName?.split(" ")[0],
                lastName: savedOrder.customer.fullName?.split(" ").slice(1).join(" "),
                city: savedOrder.customer.city,
                zipCode: savedOrder.customer.postalCode,
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
    if (savedOrder.customer?.phone) {
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
          const phone = savedOrder.customer.phone.trim();

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
            let fraudData;
            try {
              fraudData = await fraudResponse.json();
            } catch (jsonError) {
              console.error("[Place Order API] Failed to parse fraud check response as JSON:", jsonError);
              console.error("[Place Order API] Response status:", fraudResponse.status);
              console.error("[Place Order API] Response headers:", Object.fromEntries(fraudResponse.headers.entries()));
              return; // Skip fraud check processing
            }

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
  } catch (error: any) {
    console.error("POST /api/orders/place error:", error);
    return NextResponse.json({ error: error?.message || "Failed to place order" }, { status: 500 });
  }
}
