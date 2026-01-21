/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CourierService,
  CourierStatusResult,
  DeliveryDetails,
  OrderCourierInfo,
} from "./delivery.interface";
import { TOrder } from "../Order/order.interface";

/**
 * Normalize courier status string for display
 * Removes underscores and replaces with spaces, capitalizes words
 */
function normalizeCourierStatus(status: string): string {
  if (!status) return "Pending";

  return status
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

/**
 * Get Pathao access token
 */
export async function getPathaoAccessToken(
  service: CourierService
): Promise<string> {
  const creds = service.credentials || {};
  const clientId = (creds.clientId as string | undefined)?.trim();
  const clientSecret = (creds.clientSecret as string | undefined)?.trim();
  const username = (creds.username as string | undefined)?.trim();
  const password = (creds.password as string | undefined)?.trim();

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Pathao credentials are not fully configured");
  }

  const baseUrl = "https://api-hermes.pathao.com";

  const tokenRes = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "password",
      username,
      password,
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text().catch(() => "");
    throw new Error(
      `Failed to issue Pathao access token: ${errorText || tokenRes.statusText}`
    );
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData?.access_token;

  if (!accessToken) {
    throw new Error("Pathao access token missing in response");
  }

  return accessToken;
}

/**
 * Get delivery status for a consignment/tracking id from a specific courier
 */
export async function getCourierOrderStatus(
  service: CourierService,
  consignmentId: string
): Promise<CourierStatusResult> {
  switch (service.id) {
    case "pathao":
      return getPathaoOrderStatus(service, consignmentId);
    case "redx":
      return getRedxOrderStatus(service, consignmentId);
    case "steadfast":
      return getSteadfastOrderStatus(service, consignmentId);
    case "paperfly": {
      // For Paperfly tracking we expect the consignmentId to be encoded as `orderId|phone`
      const [orderId, phone] = consignmentId.split("|");
      if (!orderId || !phone) {
        throw new Error(
          "Paperfly tracking requires consignment in format 'orderId|phone'"
        );
      }
      return getPaperflyOrderStatus(orderId, phone);
    }
    default:
      throw new Error(`Unsupported courier service: ${service.id}`);
  }
}

/**
 * Create a new courier order/shipment for the given order
 */
export async function createCourierOrder(
  service: CourierService,
  order: TOrder,
  tenantTrackingId?: string,
  deliveryDetails?: DeliveryDetails
): Promise<CourierStatusResult> {
  switch (service.id) {
    case "pathao":
      return createPathaoOrder(
        service,
        order,
        tenantTrackingId,
        deliveryDetails
      );
    case "redx":
      return createRedxOrder(
        service,
        order,
        tenantTrackingId,
        deliveryDetails
      );
    case "steadfast":
      return createSteadfastOrder(
        service,
        order,
        tenantTrackingId,
        deliveryDetails
      );
    case "paperfly":
      return createPaperflyOrder(
        service,
        order,
        tenantTrackingId,
        deliveryDetails
      );
    default:
      throw new Error(
        `Unsupported courier service for order creation: ${service.id}`
      );
  }
}

// Pathao implementations
async function getPathaoOrderStatus(
  service: CourierService,
  consignmentId: string
): Promise<CourierStatusResult> {
  const baseUrl = "https://api-hermes.pathao.com";
  const accessToken = await getPathaoAccessToken(service);

  const infoRes = await fetch(
    `${baseUrl}/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!infoRes.ok) {
    throw new Error("Failed to fetch Pathao order info");
  }

  const data: any = await infoRes.json();
  const dataBlock = data?.data;
  const status =
    dataBlock?.order_status_slug ||
    dataBlock?.order_status ||
    data?.message ||
    "unknown";

  return {
    consignmentId: (dataBlock?.consignment_id as string) || consignmentId,
    deliveryStatus: normalizeCourierStatus(String(status)),
    rawStatus: data,
  };
}

async function createPathaoOrder(
  service: CourierService,
  order: TOrder,
  tenantTrackingId?: string,
  deliveryDetails?: DeliveryDetails
): Promise<CourierStatusResult> {
  const creds = service.credentials || {};
  const storeId = creds.storeId as string | undefined;

  if (!storeId) {
    throw new Error("Pathao store ID is not configured");
  }

  const baseUrl = "https://api-hermes.pathao.com";
  const accessToken = await getPathaoAccessToken(service);

  const totalQty = order.items.reduce(
    (sum: number, item: any) => sum + (item.quantity || 1),
    0
  );
  const isPaid =
    order.paymentStatus === "completed" || order.paymentMethod === "online";
  const amountToCollect =
    deliveryDetails?.amountToCollect ??
    (order.paymentMethod === "cod" && !isPaid ? Math.round(order.total) : 0);

  const recipientName =
    deliveryDetails?.recipientName || order.customer.fullName;
  let recipientPhone =
    deliveryDetails?.recipientPhone || order.customer.phone || "";

  // Pathao requires exactly 11 digits for phone number
  recipientPhone = recipientPhone.replace(/\D/g, "");
  if (recipientPhone.startsWith("880") && recipientPhone.length === 13) {
    recipientPhone = recipientPhone.substring(3);
  }
  if (recipientPhone.length !== 11) {
    throw new Error(
      `Pathao requires exactly 11 digits for phone number. Got: ${recipientPhone.length} digits`
    );
  }

  const recipientAddress =
    deliveryDetails?.recipientAddress ||
    [
      order.customer.addressLine1,
      order.customer.addressLine2,
      order.customer.city,
      order.customer.postalCode,
    ]
      .filter(Boolean)
      .join(", ");
  const itemWeight = deliveryDetails?.itemWeight
    ? String(deliveryDetails.itemWeight)
    : "0.5";
  const specialInstruction =
    deliveryDetails?.specialInstruction || order.customer.notes || "";

  const body = {
    store_id: Number(storeId) || storeId,
    tenant_order_id: tenantTrackingId || order.id,
    recipient_name: recipientName,
    recipient_phone: recipientPhone,
    recipient_address: recipientAddress,
    delivery_type: 48,
    item_type: 2,
    special_instruction: specialInstruction,
    item_quantity: totalQty || 1,
    item_weight: itemWeight,
    item_description: `Order ${order.id} - ${order.items.length} items`,
    amount_to_collect: Math.round(amountToCollect),
  };

  const res = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Failed to create Pathao order: ${errorText || res.statusText}`
    );
  }

  const data: any = await res.json();
  const dataBlock = data?.data;

  const consignmentId = (dataBlock?.consignment_id as string) || order.id;
  const status = dataBlock?.order_status || "pending";

  return {
    consignmentId,
    deliveryStatus: normalizeCourierStatus(String(status)),
    rawStatus: data,
  };
}

// RedX implementations
async function getRedxOrderStatus(
  service: CourierService,
  consignmentId: string
): Promise<CourierStatusResult> {
  const creds = service.credentials || {};
  const apiKey = creds.apiKey as string | undefined;

  if (!apiKey) {
    throw new Error("RedX API key is not configured");
  }

  const baseUrl = "https://openapi.redx.com.bd";

  const res = await fetch(
    `${baseUrl}/v1.0.0-beta/parcel/info/${encodeURIComponent(consignmentId)}`,
    {
      method: "GET",
      headers: {
        "API-ACCESS-TOKEN": `Bearer ${apiKey}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch RedX parcel info");
  }

  const data: any = await res.json();
  const parcel = data?.parcel;
  const status = parcel?.status || "unknown";

  return {
    consignmentId: (parcel?.tracking_id as string) || consignmentId,
    deliveryStatus: normalizeCourierStatus(String(status)),
    rawStatus: data,
  };
}

async function createRedxOrder(
  service: CourierService,
  order: TOrder,
  tenantTrackingId?: string,
  deliveryDetails?: DeliveryDetails
): Promise<CourierStatusResult> {
  const creds = service.credentials || {};
  const apiKey = creds.apiKey as string | undefined;

  if (!apiKey) {
    throw new Error("RedX API key is not configured");
  }

  if (!deliveryDetails) {
    throw new Error("Delivery details are required for RedX");
  }

  const baseUrl = "https://openapi.redx.com.bd";

  // Resolve delivery area (simplified - you may want to implement area resolution)
  const { deliveryArea, deliveryAreaId } = await resolveRedxDeliveryArea(
    service,
    deliveryDetails,
    baseUrl
  );

  const recipientName = deliveryDetails.recipientName;
  const recipientPhone = deliveryDetails.recipientPhone;
  const recipientAddress = deliveryDetails.recipientAddress;

  const isPaid =
    order.paymentStatus === "completed" || order.paymentMethod === "online";
  const amountToCollect =
    deliveryDetails.amountToCollect ??
    (order.paymentMethod === "cod" && !isPaid ? Math.round(order.total) : 0);
  const parcelWeight = deliveryDetails.itemWeight
    ? Math.round(deliveryDetails.itemWeight * 1000)
    : 500;
  const instruction =
    deliveryDetails.specialInstruction || order.customer.notes || "";

  const body: any = {
    customer_name: recipientName,
    customer_phone: recipientPhone,
    delivery_area: deliveryArea,
    delivery_area_id: deliveryAreaId,
    customer_address: recipientAddress,
    tenant_invoice_id: tenantTrackingId || order.id,
    cash_collection_amount: String(amountToCollect),
    parcel_weight: parcelWeight,
    instruction: instruction,
    value: String(Math.round(order.total)),
    is_closed_box: true,
  };

  const res = await fetch(`${baseUrl}/v1.0.0-beta/parcel`, {
    method: "POST",
    headers: {
      "API-ACCESS-TOKEN": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Failed to create RedX parcel: ${errorText || res.statusText}`
    );
  }

  const data: any = await res.json();
  const trackingId = (data?.tracking_id as string) || order.id;

  return {
    consignmentId: trackingId,
    deliveryStatus: normalizeCourierStatus("pending"),
    rawStatus: data,
  };
}

async function resolveRedxDeliveryArea(
  service: CourierService,
  deliveryDetails: DeliveryDetails,
  baseUrl: string
): Promise<{ deliveryArea: string; deliveryAreaId: number }> {
  const creds = service.credentials || {};
  const apiKey = creds.apiKey as string | undefined;

  if (!apiKey) {
    throw new Error("RedX API key is not configured");
  }

  // Helper to normalize area names for comparison
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\(.*?\)/g, "") // remove parenthesis content like "Mohammadpur(Dhaka)"
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // Simple similarity score (0-1) based on common characters
  const similarity = (str1: string, str2: string): number => {
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Count common characters
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    let matches = 0;
    for (const char of shorter) {
      if (longer.includes(char)) matches++;
    }
    return matches / Math.max(longer.length, 1);
  };

  const target = normalize(deliveryDetails.area);

  // 1) Try to resolve using district_name (city filter) first
  const paramsByCity = new URLSearchParams({
    district_name: deliveryDetails.city,
  });

  const resByCity = await fetch(
    `${baseUrl}/v1.0.0-beta/areas?${paramsByCity.toString()}`,
    {
      method: "GET",
      headers: {
        "API-ACCESS-TOKEN": `Bearer ${apiKey}`,
      },
    }
  );

  if (!resByCity.ok) {
    const errorText = await resByCity.text().catch(() => "");
    throw new Error(
      `Failed to resolve RedX delivery areas: ${errorText || resByCity.statusText}`
    );
  }

  const dataByCity: any = await resByCity.json();
  let areas: Array<{ id: number; name: string }> = dataByCity?.areas || [];

  let match: { id: number; name: string; score?: number } | undefined;

  if (Array.isArray(areas) && areas.length > 0) {
    // Try exact match first
    match = areas.find((a) => normalize(a.name) === target);

    // Try contains match (both directions)
    if (!match) {
      match = areas.find((a) => {
        const normalized = normalize(a.name);
        return normalized.includes(target) || target.includes(normalized);
      });
    }

    // Try fuzzy matching - find best similarity score
    if (!match) {
      const scored = areas
        .map((a) => ({
          ...a,
          score: similarity(deliveryDetails.area, a.name),
        }))
        .filter((a) => a.score >= 0.5) // Only consider if at least 50% similar
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      if (scored.length > 0) {
        match = scored[0];
      }
    }
  }

  // 2) Fallback: if city-filtered list didn't find a match, fetch all areas
  if (!match) {
    const resAll = await fetch(`${baseUrl}/v1.0.0-beta/areas`, {
      method: "GET",
      headers: {
        "API-ACCESS-TOKEN": `Bearer ${apiKey}`,
      },
    });

    if (resAll.ok) {
      const dataAll: any = await resAll.json();
      const allAreas: Array<{ id: number; name: string }> =
        dataAll?.areas || [];
      if (Array.isArray(allAreas) && allAreas.length > 0) {
        // Try exact match
        match = allAreas.find((a) => normalize(a.name) === target);

        // Try contains match
        if (!match) {
          match = allAreas.find((a) => {
            const normalized = normalize(a.name);
            return normalized.includes(target) || target.includes(normalized);
          });
        }

        // Try fuzzy matching
        if (!match) {
          const scored = allAreas
            .map((a) => ({
              ...a,
              score: similarity(deliveryDetails.area, a.name),
            }))
            .filter((a) => a.score >= 0.5)
            .sort((a, b) => (b.score || 0) - (a.score || 0));

          if (scored.length > 0) {
            match = scored[0];
          }
        }
      }
    }
  }

  if (!match) {
    // Provide helpful error with available areas for debugging
    const availableAreas =
      areas.length > 0
        ? areas
            .slice(0, 10)
            .map((a) => a.name)
            .join(", ")
        : "No areas found";
    throw new Error(
      `Could not resolve RedX delivery area id for area "${deliveryDetails.area}" in city "${deliveryDetails.city}". ` +
        `Available areas for this city: ${availableAreas}${areas.length > 10 ? "..." : ""}. ` +
        `Please select an area that matches one of the available RedX areas.`
    );
  }

  return {
    deliveryArea: match.name,
    deliveryAreaId: Number(match.id),
  };
}

// Steadfast implementations
async function getSteadfastOrderStatus(
  service: CourierService,
  consignmentId: string
): Promise<CourierStatusResult> {
  const creds = service.credentials || {};
  const apiKey = creds.apiKey as string | undefined;
  const appSecret =
    (creds.appSecret as string | undefined) ||
    (creds.secretKey as string | undefined);

  if (!apiKey || !appSecret) {
    throw new Error("Steadfast API credentials are not fully configured");
  }

  const baseUrl = "https://portal.packzy.com/api/v1";

  const res = await fetch(
    `${baseUrl}/status_by_cid/${encodeURIComponent(consignmentId)}`,
    {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": appSecret,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch Steadfast delivery status");
  }

  const data: any = await res.json();
  const status = data?.delivery_status || "unknown";

  return {
    consignmentId,
    deliveryStatus: normalizeCourierStatus(String(status)),
    rawStatus: data,
  };
}

async function createSteadfastOrder(
  service: CourierService,
  order: TOrder,
  tenantTrackingId?: string,
  deliveryDetails?: DeliveryDetails
): Promise<CourierStatusResult> {
  const creds = service.credentials || {};
  const apiKey = creds.apiKey as string | undefined;
  const appSecret =
    (creds.appSecret as string | undefined) ||
    (creds.secretKey as string | undefined);

  if (!apiKey || !appSecret) {
    throw new Error("Steadfast API credentials are not fully configured");
  }

  const baseUrl = "https://portal.packzy.com/api/v1";
  const isPaid =
    order.paymentStatus === "completed" || order.paymentMethod === "online";

  const recipientName =
    deliveryDetails?.recipientName || order.customer.fullName;
  const recipientPhone =
    deliveryDetails?.recipientPhone || order.customer.phone || "";
  const recipientAddress =
    deliveryDetails?.recipientAddress ||
    [
      order.customer.addressLine1,
      order.customer.addressLine2,
      order.customer.city,
      order.customer.postalCode,
    ]
      .filter(Boolean)
      .join(", ");
  const recipientEmail = order.customer.email;
  const codAmount =
    deliveryDetails?.amountToCollect ??
    (order.paymentMethod === "cod" && !isPaid
      ? Math.max(0, Math.round(order.total))
      : 0);
  const note =
    deliveryDetails?.specialInstruction || order.customer.notes || "";

  const totalLot =
    order.items.reduce(
      (sum: number, item: any) => sum + (item.quantity || 1),
      0
    ) || 1;

  const body = {
    invoice: tenantTrackingId || order.id,
    recipient_name: recipientName,
    recipient_phone: recipientPhone,
    recipient_address: recipientAddress,
    ...(recipientEmail ? { recipient_email: recipientEmail } : {}),
    cod_amount: codAmount,
    note: note,
    item_description: `Order ${order.id} - ${order.items.length} items`,
    total_lot: totalLot,
    delivery_type: 0,
  };

  const res = await fetch(`${baseUrl}/create_order`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": appSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Failed to create Steadfast order: ${errorText || res.statusText}`
    );
  }

  const data: any = await res.json();
  const consignment = data?.consignment;
  const consignmentId = consignment?.consignment_id
    ? String(consignment.consignment_id)
    : order.id;
  const status = consignment?.status || data?.delivery_status || "pending";

  return {
    consignmentId,
    deliveryStatus: normalizeCourierStatus(String(status)),
    rawStatus: data,
  };
}

// Paperfly implementations
async function createPaperflyOrder(
  service: CourierService,
  order: TOrder,
  tenantTrackingId?: string,
  deliveryDetails?: DeliveryDetails
): Promise<CourierStatusResult> {
  const creds = service.credentials || {};
  const username = creds.username as string | undefined;
  const password = creds.password as string | undefined;

  if (!username || !password) {
    throw new Error(
      "Paperfly credentials (username and password) are not configured"
    );
  }

  if (!deliveryDetails) {
    throw new Error("Delivery details are required for Paperfly");
  }

  const baseUrl =
    "https://api.paperfly.com.bd/tenant/api/service/new_order.php";

  const normalizeThana = (thana: string): string => {
    return thana
      .trim()
      .replace(/\s*(Upazila|Thana|Upazilla|উপজেলা|থানা)\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizedDistrict = deliveryDetails.city.trim();

  const thanaVariations = [
    normalizeThana(deliveryDetails.area),
    deliveryDetails.area.trim(),
    deliveryDetails.area.trim().replace(/\s*(Upazila|Upazilla)\s*$/i, " Thana"),
    normalizedDistrict,
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  let lastError: string = "";
  let lastThana: string = "";

  for (const customerThana of thanaVariations) {
    const body = {
      merOrderRef: tenantTrackingId || order.id,
      pickTenantName: "Tenant",
      pickTenantAddress: "",
      pickTenantThana: "",
      pickTenantDistrict: "",
      pickupTenantPhone: order.customer.phone || "",
      productSizeWeight: "standard",
      productBrief: `Order ${order.id} - ${order.items.length} items`,
      packagePrice: String(Math.round(order.total)),
      deliveryOption: "regular",
      custname: deliveryDetails.recipientName,
      custaddress: deliveryDetails.recipientAddress,
      customerThana: customerThana,
      customerDistrict: normalizedDistrict,
      custPhone: deliveryDetails.recipientPhone,
      max_weight: String(deliveryDetails.itemWeight),
    };

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      // Success! Return the result
      let data: any = {};
      try {
        const responseText = await res.text();
        if (responseText) {
          data = JSON.parse(responseText);
        }
      } catch (parseError) {
        // If response is not JSON, try to extract order ID from text
        console.warn("Paperfly response is not valid JSON:", parseError);
      }

      // Extract order ID from various possible fields
      const orderId =
        data?.order_id ||
        data?.orderId ||
        data?.data?.order_id ||
        data?.data?.orderId ||
        data?.tracking_id ||
        data?.trackingId ||
        tenantTrackingId ||
        order.id;

      // Extract status from various possible fields
      // Paperfly might return status in different formats
      const status =
        data?.status ||
        data?.order_status ||
        data?.delivery_status ||
        data?.data?.status ||
        data?.data?.order_status ||
        "pending"; // Default to "pending" for newly created orders

      return {
        consignmentId: String(orderId),
        deliveryStatus: normalizeCourierStatus(String(status)),
        rawStatus: data,
      };
    }

    // If not successful, save the error and try next variation
    const errorText = await res.text().catch(() => "");
    lastError = errorText || res.statusText;
    lastThana = customerThana;

    // If it's not a "thana not found" error, stop trying and throw immediately
    try {
      const errorData = JSON.parse(errorText);
      if (
        !errorData?.error?.message?.toLowerCase().includes("thana not found")
      ) {
        throw new Error(
          `Failed to create Paperfly order: ${errorText || res.statusText}`
        );
      }
    } catch (parseError: any) {
      // If it's not JSON or not a thana error, throw immediately
      if (!errorText.toLowerCase().includes("thana")) {
        throw new Error(
          `Failed to create Paperfly order: ${errorText || res.statusText}`
        );
      }
    }
  }

  // If all variations failed, throw a helpful error
  throw new Error(
    `Paperfly could not find a valid thana for area "${deliveryDetails.area}" in district "${deliveryDetails.city}". ` +
      `Tried variations: ${thanaVariations.join(", ")}. ` +
      `Paperfly requires exact thana names from their system. ` +
      `Please contact Paperfly support or use a different area name that matches their thana list. ` +
      `Last error: ${lastError}`
  );
}

async function getPaperflyOrderStatus(
  orderId: string,
  phone: string
): Promise<CourierStatusResult> {
  const res = await fetch("http://paperfly.com.bd/trackerapi.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `orderid=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`,
  });

  const text = await res.text();

  const obj: Record<string, string> = {};

  const pattern1 = /\$\(["']#([^"']+)["']\)\.(?:val|html)\(["']([^"']*)["']\)/g;
  let match;
  while ((match = pattern1.exec(text)) !== null) {
    const key = match[1];
    const value = match[2];
    if (key && value !== undefined) {
      obj[key] = value.replace(/<[^>]*>/g, "").trim();
    }
  }

  // Pattern 2: .val("value") or .html("value") after element selection
  const pattern2 = /\.(?:val|html)\(["']([^"']+)["']\)/g;
  const allValues: string[] = [];
  while ((match = pattern2.exec(text)) !== null) {
    if (match[1]) {
      allValues.push(match[1].replace(/<[^>]*>/g, "").trim());
    }
  }

  // Pattern 3: Look for common status-related fields in the text
  const statusPatterns = [
    /order[_\s-]?status[_\s-]?eng["']?\s*[:=]\s*["']([^"']+)["']/i,
    /order[_\s-]?status["']?\s*[:=]\s*["']([^"']+)["']/i,
    /status["']?\s*[:=]\s*["']([^"']+)["']/i,
    /delivery[_\s-]?status["']?\s*[:=]\s*["']([^"']+)["']/i,
  ];

  for (const pattern of statusPatterns) {
    const statusMatch = text.match(pattern);
    if (statusMatch && statusMatch[1]) {
      obj["status_found"] = statusMatch[1].replace(/<[^>]*>/g, "").trim();
      break;
    }
  }

  // Try to extract from common field names (case-insensitive)
  const fieldMappings: Record<string, string[]> = {
    order_status: [
      "order_status_eng",
      "order_status",
      "orderstatus",
      "orderStatus",
    ],
    order_id: [
      "order_id_eng",
      "order_id",
      "orderid",
      "orderId",
      "tracking_id",
      "trackingId",
    ],
    status: [
      "status",
      "order_status_eng",
      "order_status",
      "ordertypeeng",
      "ordertype",
      "delivery_status",
    ],
  };

  // Look for these fields in the extracted object or text
  for (const [targetKey, possibleKeys] of Object.entries(fieldMappings)) {
    if (!obj[targetKey]) {
      for (const possibleKey of possibleKeys) {
        // Check in extracted obj (case-insensitive)
        const foundKey = Object.keys(obj).find(
          (k) => k.toLowerCase() === possibleKey.toLowerCase()
        );
        if (foundKey && obj[foundKey]) {
          obj[targetKey] = obj[foundKey];
          break;
        }
      }
    }
  }

  // Extract status with multiple fallbacks
  const status =
    obj["status"] ||
    obj["status_found"] ||
    obj["order_status_eng"] ||
    obj["order_status"] ||
    obj["ordertypeeng"] ||
    obj["ordertype"] ||
    obj["delivery_status"] ||
    (allValues.length > 0 ? allValues[allValues.length - 1] : null) || // Last value might be status
    "pending"; // Default to "pending" instead of "unknown" for newly created orders

  // Extract order ID
  const extractedOrderId =
    obj["order_id"] ||
    obj["order_id_eng"] ||
    obj["orderid"] ||
    obj["orderId"] ||
    obj["tracking_id"] ||
    obj["trackingId"] ||
    orderId;

  return {
    consignmentId: String(extractedOrderId),
    deliveryStatus: normalizeCourierStatus(String(status)),
    rawStatus: { ...obj, rawText: text.substring(0, 500) },
  };
}
