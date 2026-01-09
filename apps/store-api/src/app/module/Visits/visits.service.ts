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

  // Fetch visits with geolocation populated (if we had it, but for now just fetch all unique IPs basically)
  // Since we don't have distinct on IP easily with full stats without grouping, we'll fetch visits and process in memory for now
  // or just fetch visits.
  // The original logic did aggregation in memory.

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

export const VisitsServices = {
  trackVisitFromDB,
  getVisitsFromDB,
};
