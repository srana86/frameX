import { ActivityLog } from "./activityLog.model";
import { toPlainObjectArray, toPlainObject } from "../../utils/mongodb";
import { IActivityLog } from "./activityLog.interface";

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
  if (type) query.type = type;
  if (action) query.action = action;
  if (entityId) query.entityId = entityId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const total = await ActivityLog.countDocuments(query);
  const logs = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    logs: toPlainObjectArray<IActivityLog>(logs),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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
  if (!payload.type || !payload.action || !payload.entityId) {
    throw new Error("type, action, and entityId are required");
  }

  const logData: IActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: payload.type as any,
    action: payload.action,
    entityId: payload.entityId,
    entityName: payload.entityName,
    details: payload.details,
    performedBy: payload.performedBy || "system",
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    createdAt: new Date().toISOString(),
  };

  const log = await ActivityLog.create(logData);
  return {
    success: true,
    log: toPlainObject<IActivityLog>(log),
  };
};

const deleteOldLogs = async (olderThanDays: number = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await ActivityLog.deleteMany({
    createdAt: { $lt: cutoffDate.toISOString() },
  });

  return {
    success: true,
    deletedCount: result.deletedCount,
    message: `Deleted ${result.deletedCount} logs older than ${olderThanDays} days`,
  };
};

export const ActivityLogServices = {
  getAllActivityLogs,
  createActivityLog,
  deleteOldLogs,
};
