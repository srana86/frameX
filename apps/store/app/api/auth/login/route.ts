import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, email, phone, password, rememberMe } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (method === "email" && !email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (method === "phone" && !phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const col = await getMerchantCollectionForAPI("users");
    const baseQuery = await buildMerchantQuery();

    // Find user by email or phone (within merchant scope)
    const query: any = { ...baseQuery };
    if (method === "email") {
      query.email = email.toLowerCase();
    } else {
      query.phone = phone;
    }

    const user = await col.findOne(query);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || "");

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: (user.role || "customer") as "customer" | "merchant" | "admin",
    });

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: (user.role || "customer") as "customer" | "merchant" | "admin",
        createdAt: user.createdAt,
      },
    });

    // Set JWT token in httpOnly cookie
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 500 });
  }
}
