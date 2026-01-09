/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";

const getAllActivityLogs = async (
  type?: string,
  action?: string,
  entityId?: string,
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 50
) => {
  const query: any = {};
  if (action) query.action = action;
  if (entityId) query.resourceId = entityId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.gte = new Date(startDate);
    if (endDate) query.createdAt.lte = new Date(endDate);
  }

  const builder = new PrismaQueryBuilder({
    model: prisma.activityLog,
    query: { page, limit }
  });

  return builder
    .addBaseWhere(query)
    .sort()
    .paginate()
    .execute();
};

const createActivityLog = async (payload: {
  type: string;
  action: string;
  entityId: string;
  entityName?: string;
  details?: Record<string, any>;
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  const log = await prisma.activityLog.create({
    data: {
      action: payload.action,
      resource: payload.type,
      resourceId: payload.entityId,
      details: payload.details,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      userId: payload.performedBy !== 'system' ? payload.performedBy : undefined
    }
  });

  return { success: true, log };
};

const deleteOldLogs = async (olderThanDays: number = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.activityLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });

  return {
    success: true,
    deletedCount: result.count,
    message: `Deleted ${result.count} logs older than ${olderThanDays} days`,
  };
};

export const ActivityLogServices = {
  getAllActivityLogs,
  createActivityLog,
  deleteOldLogs,
};
