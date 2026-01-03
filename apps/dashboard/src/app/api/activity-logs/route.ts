import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

export interface ActivityLog {
  id: string;
  type: "merchant" | "subscription" | "plan" | "deployment" | "database" | "system";
  action: string;
  entityId: string;
  entityName?: string;
  details?: Record<string, any>;
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// GET /api/activity-logs - Get activity logs with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const type = searchParams.get("type");
    const action = searchParams.get("action");
    const entityId = searchParams.get("entityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const col = await getCollection("activity_logs");

    // Build query
    const query: any = {};
    if (type) query.type = type;
    if (action) query.action = action;
    if (entityId) query.entityId = entityId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const total = await col.countDocuments(query);
    const logs = await col
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const logsWithoutId = logs.map((log: any) => {
      const { _id, ...data } = log;
      return data;
    });

    return NextResponse.json({
      success: true,
      logs: logsWithoutId,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/activity-logs error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get activity logs" }, { status: 500 });
  }
}

// POST /api/activity-logs - Create a new activity log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, action, entityId, entityName, details, performedBy } = body;

    if (!type || !action || !entityId) {
      return NextResponse.json({ error: "type, action, and entityId are required" }, { status: 400 });
    }

    const col = await getCollection("activity_logs");

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      action,
      entityId,
      entityName,
      details,
      performedBy: performedBy || "system",
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      createdAt: new Date().toISOString(),
    };

    await col.insertOne(log);

    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/activity-logs error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create activity log" }, { status: 500 });
  }
}

// DELETE /api/activity-logs - Clear old logs (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("olderThanDays") || "90");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const col = await getCollection("activity_logs");
    const result = await col.deleteMany({
      createdAt: { $lt: cutoffDate.toISOString() },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} logs older than ${olderThanDays} days`,
    });
  } catch (error: any) {
    console.error("DELETE /api/activity-logs error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete activity logs" }, { status: 500 });
  }
}
