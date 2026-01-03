import { NextResponse } from "next/server";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    // Get token from cookie
    const cookieHeader = request.headers.get("cookie");
    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = payload.userId;
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Get notifications for the user
    const col = await getMerchantCollectionForAPI("notifications");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    // Build query for user's notifications
    const query: any = {
      ...baseQuery,
      userId: new ObjectId(userId),
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        query.merchantId = merchantId;
      }
    }

    // Add unread filter if requested
    if (unreadOnly) {
      query.read = { $ne: true };
    }

    // Get total count for pagination
    const totalCount = await col.countDocuments(query);

    // Get notifications with pagination
    const notifications = await col.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

    // Count unread notifications (from all notifications, not just current page)
    const unreadQuery = { ...baseQuery, userId: new ObjectId(userId) };
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        unreadQuery.merchantId = merchantId;
      }
    }
    const unreadCount = await col.countDocuments({ ...unreadQuery, read: { $ne: true } });

    // Format notifications
    const formattedNotifications = notifications.map((notif: any) => ({
      id: String(notif._id),
      title: notif.title,
      message: notif.message,
      type: notif.type || "info",
      read: notif.read || false,
      createdAt: notif.createdAt,
      link: notif.link || null,
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Get token from cookie
    const cookieHeader = request.headers.get("cookie");
    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = payload.userId;
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    const col = await getMerchantCollectionForAPI("notifications");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    // Build base query for user's notifications
    const userQuery: any = {
      ...baseQuery,
      userId: new ObjectId(userId),
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        userQuery.merchantId = merchantId;
      }
    }

    if (markAllAsRead) {
      // Mark all notifications as read
      await col.updateMany({ ...userQuery, read: { $ne: true } }, { $set: { read: true, updatedAt: new Date().toISOString() } });
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (notificationId) {
      // Mark specific notification as read
      if (!ObjectId.isValid(notificationId)) {
        return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
      }

      const query = {
        ...userQuery,
        _id: new ObjectId(notificationId),
      };

      const result = await col.updateOne(query, {
        $set: { read: true, updatedAt: new Date().toISOString() },
      });

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "notificationId or markAllAsRead is required" }, { status: 400 });
  } catch (error: any) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update notification" }, { status: 500 });
  }
}
