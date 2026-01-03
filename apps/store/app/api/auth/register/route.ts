import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/jwt";
import { getClientIP } from "@/lib/geolocation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, fullName, email, phone, password, country, countryCode, ipAddress } = body;

    // Get IP address from request headers if not provided
    const headers = request.headers;
    const clientIP = ipAddress || getClientIP(headers) || "unknown";

    if (!fullName || !password) {
      return NextResponse.json({ error: "Full name and password are required" }, { status: 400 });
    }

    if (method === "email" && !email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (method === "phone" && !phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const col = await getMerchantCollectionForAPI("users");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    // Check if user already exists (within merchant scope)
    const query: any = { ...baseQuery };
    if (method === "email") {
      query.email = email.toLowerCase();
    } else {
      query.phone = phone;
    }

    const existingUser = await col.findOne(query);

    if (existingUser) {
      return NextResponse.json(
        { error: method === "email" ? "Email already registered" : "Phone number already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser: any = {
      fullName,
      email: method === "email" ? email.toLowerCase() : undefined,
      phone: method === "phone" ? phone : undefined,
      password: hashedPassword,
      role: "customer" as const,
      country: country || undefined,
      countryCode: countryCode || undefined,
      ipAddress: clientIP,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        newUser.merchantId = merchantId;
      }
    }

    const result = await col.insertOne(newUser);

    // Generate JWT token
    const token = generateToken({
      userId: String(result.insertedId),
      email: newUser.email,
      phone: newUser.phone,
      fullName,
      role: newUser.role,
    });

    // Fire-and-forget welcome email
    if (newUser.email) {
      (async () => {
        try {
          const { sendEmailEvent } = await import("@/lib/email-service");
          await sendEmailEvent({
            event: "account_welcome",
            to: newUser.email,
            variables: {
              customerName: fullName,
            },
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      })();
    }

    // Create response with user data
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: String(result.insertedId),
          fullName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );

    // Set JWT token in httpOnly cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}
