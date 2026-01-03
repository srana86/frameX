import { Schema, model } from "mongoose";
import { IActivityLog, ActivityLogType } from "./activityLog.interface";

const activityLogSchema = new Schema<IActivityLog>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: [
        "merchant",
        "subscription",
        "plan",
        "deployment",
        "database",
        "system",
      ],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    entityName: String,
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: String,
      default: "system",
    },
    ipAddress: String,
    userAgent: String,
    createdAt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

activityLogSchema.index({ type: 1, action: 1 });
activityLogSchema.index({ entityId: 1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = model<IActivityLog>(
  "activity_logs",
  activityLogSchema
);
