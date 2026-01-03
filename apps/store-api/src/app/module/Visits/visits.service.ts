/* eslint-disable @typescript-eslint/no-explicit-any */
import { Visit } from "./visits.model";
import { TVisit } from "./visits.interface";
import { Order } from "../Order/order.model";

// Track page visit
const trackVisitFromDB = async (payload: {
  path?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
}) => {
  const ipAddress = payload.ipAddress;

  if (!ipAddress) {
    // Still record visit but without IP
    return {
      success: true,
      message: "Visit recorded (no IP)",
    };
  }

  const path = payload.path || "/";
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // Check for recent visit from same IP and path
  const recentVisit = await Visit.findOne({
    ipAddress,
    path,
    createdAt: { $gte: oneMinuteAgo },
  });

  if (recentVisit) {
    // Update existing visit count
    await Visit.findByIdAndUpdate(recentVisit._id, {
      $inc: { visitCount: 1 },
      $set: { lastVisitedAt: new Date() },
    });

    return {
      success: true,
      message: "Visit count updated",
    };
  }

  // Create new visit
  const visitData: TVisit = {
    ipAddress,
    path,
    referrer: payload.referrer || "",
    userAgent: payload.userAgent || "",
    visitCount: 1,
    lastVisitedAt: new Date(),
  };

  await Visit.create(visitData);

  // Note: IP geolocation can be fetched asynchronously and updated later
  // For now, we'll just record the visit

  return {
    success: true,
    message: "Visit recorded",
  };
};

// Get visit statistics
const getVisitsFromDB = async (query: Record<string, unknown>) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(1000, Math.max(1, Number(query.limit) || 100));

  // Get visits with geolocation
  const visits = await Visit.find({
    ipGeolocation: { $exists: true, $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  // Get orders to count orders per IP
  const orders = await Order.find({
    isDeleted: false,
  }).select("customer");

  // Count orders per IP (if IP is stored in orders)
  const ordersByIp = new Map<string, number>();
  // Note: IP might not be stored in orders, this is a placeholder

  // Aggregate by IP
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

  visits.forEach((visit: any) => {
    const ip = visit.ipAddress;
    if (!ip) return;

    const existing = ipStats.get(ip);
    if (existing) {
      existing.count += visit.visitCount || 1;
      if (visit.path) existing.paths.add(visit.path);
      if (visit.lastVisitedAt > existing.lastVisit) {
        existing.lastVisit = visit.lastVisitedAt.toISOString();
      }
      if (visit.createdAt < new Date(existing.firstVisit)) {
        existing.firstVisit = visit.createdAt.toISOString();
      }
    } else {
      ipStats.set(ip, {
        ip,
        count: visit.visitCount || 1,
        orders: ordersByIp.get(ip) || 0,
        geolocation: visit.ipGeolocation,
        paths: new Set(visit.path ? [visit.path] : []),
        firstVisit: visit.createdAt.toISOString(),
        lastVisit: (visit.lastVisitedAt || visit.createdAt).toISOString(),
      });
    }
  });

  // Convert to array
  const stats = Array.from(ipStats.values()).map((stat) => ({
    ip: stat.ip,
    visitCount: stat.count,
    orderCount: stat.orders,
    geolocation: stat.geolocation,
    paths: Array.from(stat.paths),
    firstVisit: stat.firstVisit,
    lastVisit: stat.lastVisit,
  }));

  const total = stats.length;
  const totalPage = Math.ceil(total / limit);

  return {
    data: stats,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};

export const VisitsServices = {
  trackVisitFromDB,
  getVisitsFromDB,
};
