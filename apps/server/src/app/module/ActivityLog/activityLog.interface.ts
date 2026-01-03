export type ActivityLogType =
  | "merchant"
  | "subscription"
  | "plan"
  | "deployment"
  | "database"
  | "system";

export interface IActivityLog {
  id: string;
  type: ActivityLogType;
  action: string;
  entityId: string;
  entityName?: string;
  details?: Record<string, any>;
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
