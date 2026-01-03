import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import { getClientIP, getDetailedIpGeolocation } from "@/lib/geolocation";

/**
 * POST /api/visits
 * Track page visits with IP address and geolocation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { path, referrer, userAgent } = body;

    // Get IP address
    const clientIP = getClientIP(request.headers);
    if (!clientIP) {
      // If no IP, still record visit but without geolocation
      return NextResponse.json({ success: true, message: "Visit recorded (no IP)" });
    }

    const merchantId = await getMerchantIdForAPI();
    const visitsCol = await getMerchantCollectionForAPI("visits");
    const query = await buildMerchantQuery();

    // Check if we already have a visit from this IP in the last minute (avoid spam)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentVisit = await visitsCol.findOne({
      ...query,
      ipAddress: clientIP,
      path: path || "/",
      createdAt: { $gte: oneMinuteAgo.toISOString() },
    });

    if (recentVisit) {
      // Update existing visit count instead of creating duplicate
      await visitsCol.updateOne(
        { _id: recentVisit._id },
        {
          $inc: { visitCount: 1 },
          $set: { lastVisitedAt: new Date().toISOString() },
        }
      );
      return NextResponse.json({ success: true, message: "Visit count updated" });
    }

    // Create new visit record
    const visitDoc: any = {
      ipAddress: clientIP,
      path: path || "/",
      referrer: referrer || "",
      userAgent: userAgent || "",
      visitCount: 1,
      createdAt: new Date().toISOString(),
      lastVisitedAt: new Date().toISOString(),
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        visitDoc.merchantId = merchantId;
      }
    }

    const res = await visitsCol.insertOne(visitDoc);

    // Get detailed geolocation data asynchronously (don't block visit recording)
    getDetailedIpGeolocation(clientIP)
      .then((geoData) => {
        if (geoData) {
          // Update visit with geolocation data
          visitsCol.updateOne(
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
            console.error("[Visits API] Failed to update geolocation:", err);
          });
        }
      })
      .catch((err) => {
        console.error("[Visits API] Failed to fetch geolocation:", err);
      });

    return NextResponse.json({ success: true, message: "Visit recorded" });
  } catch (error: any) {
    console.error("[Visits API] Error:", error);
    return NextResponse.json({ error: "Failed to record visit" }, { status: 500 });
  }
}

/**
 * GET /api/visits
 * Get visit statistics (for admin page)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

    const visitsCol = await getMerchantCollectionForAPI("visits");
    const query = await buildMerchantQuery();

    // Get all visits with geolocation data
    const visits = await visitsCol
      .find({
        ...query,
        ipGeolocation: { $exists: true, $ne: null },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Aggregate by IP for statistics
    const ipStats = new Map<
      string,
      {
        ip: string;
        count: number;
        orders: number;
        geolocation?: any;
        paths: Set<string>;
        firstVisit: string;
        lastVisit: string;
      }
    >();

    // Get orders for this IP
    const ordersCol = await getMerchantCollectionForAPI("orders");
    const orders = await ordersCol
      .find({
        ...query,
        ipAddress: { $exists: true, $ne: null },
      })
      .toArray();

    // Count orders per IP
    const ordersByIp = new Map<string, number>();
    orders.forEach((order: any) => {
      if (order.ipAddress) {
        ordersByIp.set(order.ipAddress, (ordersByIp.get(order.ipAddress) || 0) + 1);
      }
    });

    visits.forEach((visit: any) => {
      const ip = visit.ipAddress;
      if (!ip) return;

      const existing = ipStats.get(ip);
      if (existing) {
        existing.count += visit.visitCount || 1;
        if (visit.path) existing.paths.add(visit.path);
        if (visit.lastVisitedAt > existing.lastVisit) {
          existing.lastVisit = visit.lastVisitedAt;
        }
        if (visit.createdAt < existing.firstVisit) {
          existing.firstVisit = visit.createdAt;
        }
      } else {
        ipStats.set(ip, {
          ip,
          count: visit.visitCount || 1,
          orders: ordersByIp.get(ip) || 0,
          geolocation: visit.ipGeolocation,
          paths: new Set(visit.path ? [visit.path] : []),
          firstVisit: visit.createdAt,
          lastVisit: visit.lastVisitedAt || visit.createdAt,
        });
      }
    });

    // Convert to array and format
    const stats = Array.from(ipStats.values()).map((stat) => ({
      ip: stat.ip,
      visitCount: stat.count,
      orderCount: stat.orders,
      geolocation: stat.geolocation,
      paths: Array.from(stat.paths),
      firstVisit: stat.firstVisit,
      lastVisit: stat.lastVisit,
    }));

    return NextResponse.json({
      success: true,
      data: stats,
      total: stats.length,
    });
  } catch (error: any) {
    console.error("[Visits API] Error fetching visits:", error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}

