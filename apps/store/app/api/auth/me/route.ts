import { NextResponse } from "next/server";
import { getTokenFromCookie, verifyToken } from "@/lib/jwt";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
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

    // Get user from database (within merchant scope)
    const col = await getMerchantCollectionForAPI("users");
    const baseQuery = await buildMerchantQuery();

    // Validate userId is a valid ObjectId
    if (!ObjectId.isValid(payload.userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const query = { ...baseQuery, _id: new ObjectId(payload.userId) };
    const user = await col.findOne(query);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data (without password)
    const { password: _, ...userData } = user;

    return NextResponse.json({
      user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: (user.role || "customer") as "customer" | "merchant" | "admin",
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get user" }, { status: 500 });
  }
}
