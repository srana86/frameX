/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";

// Track page visit
const trackVisitFromDB = async (tenantId: string, payload: {
  path?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
}) => {
  const ipAddress = payload.ipAddress;

  if (!ipAddress) {
    return { success: true, message: "Visit recorded (no IP)" };
  }

  const path = payload.path || "/";
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  // Check for recent visit
  const recentVisit = await prisma.visit.findFirst({
    where: {
      tenantId,
      ipAddress,
      path,
      createdAt: { gte: oneMinuteAgo }
    }
  });

  if (recentVisit) {
    await prisma.visit.update({
      where: { id: recentVisit.id },
      data: {
        visitCount: { increment: 1 },
        lastVisitedAt: new Date()
      }
    });

    return { success: true, message: "Visit count updated" };
  }

  await prisma.visit.create({
    data: {
      tenantId,
      ipAddress,
      path,
      referrer: payload.referrer || "",
      userAgent: payload.userAgent || "",
      visitCount: 1,
      lastVisitedAt: new Date(),
    }
  });

  return { success: true, message: "Visit recorded" };
};

// Get visit statistics
const getVisitsFromDB = async (tenantId: string, query: Record<string, unknown>) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(1000, Math.max(1, Number(query.limit) || 100));


  const visits = await prisma.visit.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit * 5 // Fetch more to aggregate
  });

  // Reuse the aggregation logic
  const ipStats = new Map<string, any>();

  visits.forEach((visit) => {
    const ip = visit.ipAddress;
    if (!ipStats.has(ip)) {
      ipStats.set(ip, {
        ip,
        visitCount: 0,
        paths: new Set(),
        firstVisit: visit.createdAt,
        lastVisit: visit.lastVisitedAt || visit.createdAt,
        geolocation: (visit as any).ipGeolocation // If field exists
      });
    }
    const stat = ipStats.get(ip);
    stat.visitCount += visit.visitCount;
    stat.paths.add(visit.path);
    if (visit.createdAt < stat.firstVisit) stat.firstVisit = visit.createdAt;
    if ((visit.lastVisitedAt || visit.createdAt) > stat.lastVisit) stat.lastVisit = (visit.lastVisitedAt || visit.createdAt);
  });

  const stats = Array.from(ipStats.values()).map(s => ({
    ...s,
    paths: Array.from(s.paths)
  })).slice(0, limit);

  return {
    data: stats,
    meta: {
      page,
      limit,
      total: stats.length,
      totalPage: Math.ceil(stats.length / limit)
    }
  };
};

// Get IP analytics data
const getIpAnalyticsFromDB = async (tenantId: string) => {
  const visits = await prisma.visit.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 500, // Limit for performance
  });

  // Calculate summary
  const uniqueIps = new Set(visits.map(v => v.ipAddress));
  const totalPageViews = visits.reduce((sum, v) => sum + v.visitCount, 0);

  // Group by country (from geolocation if available)
  const countryStats = new Map<string, number>();
  const deviceStats = new Map<string, number>();

  visits.forEach((visit) => {
    const geo = (visit as any).ipGeolocation as any;
    const country = geo?.country || "Unknown";
    countryStats.set(country, (countryStats.get(country) || 0) + visit.visitCount);

    // Parse user agent for device type
    const ua = visit.userAgent?.toLowerCase() || "";
    let device = "Desktop";
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      device = "Mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      device = "Tablet";
    }
    deviceStats.set(device, (deviceStats.get(device) || 0) + 1);
  });

  // Calculate totals for percentages
  const totalCountryVisitors = Array.from(countryStats.values()).reduce((a, b) => a + b, 0) || 1;
  const totalDeviceVisitors = Array.from(deviceStats.values()).reduce((a, b) => a + b, 0) || 1;

  // Format byCountry with visitors and percentage
  const byCountry = Array.from(countryStats.entries())
    .map(([country, visitors]) => ({
      country,
      visitors,
      percentage: (visitors / totalCountryVisitors) * 100,
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10);

  // Format byDevice with percentage
  const byDevice = Array.from(deviceStats.entries())
    .map(([device, count]) => ({
      device,
      count,
      percentage: (count / totalDeviceVisitors) * 100,
    }));

  // Recent visitors with all required fields
  const recentVisitors = visits.slice(0, 20).map((v, index) => {
    const geo = (v as any).ipGeolocation as any;
    const ua = v.userAgent?.toLowerCase() || "";
    let device = "Desktop";
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      device = "Mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      device = "Tablet";
    }

    return {
      id: v.id || `visitor-${index}`,
      ip: v.ipAddress,
      country: geo?.country || "Unknown",
      device,
      lastVisit: (v.lastVisitedAt || v.createdAt).toISOString(),
      pageViews: v.visitCount,
    };
  });

  return {
    summary: {
      totalVisitors: visits.length,
      uniqueVisitors: uniqueIps.size,
      pageViews: totalPageViews,
      bounceRate: visits.length > 0 ? Math.round((visits.filter(v => v.visitCount === 1).length / visits.length) * 100) : 0,
    },
    byCountry,
    byDevice,
    recentVisitors,
  };
};

export const VisitsServices = {
  trackVisitFromDB,
  getVisitsFromDB,
  getIpAnalyticsFromDB,
};
