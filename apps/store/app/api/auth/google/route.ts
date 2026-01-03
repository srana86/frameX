import { NextResponse } from "next/server";
import { getOAuthConfig } from "@/lib/oauth-config";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const { searchParams, origin } = requestUrl;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Build redirect URI from current request URL
    const redirectUri = `${origin}/api/auth/google`;

    // Get OAuth config from database
    const oauthConfig = await getOAuthConfig();

    // Check if Google OAuth is enabled
    if (!oauthConfig.google.enabled || !oauthConfig.google.clientId) {
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", request.url));
    }

    if (error) {
      return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
    }

    if (!code) {
      // Initiate OAuth flow
      const clientId = oauthConfig.google.clientId;
      const scope = "openid email profile";
      const responseType = "code";

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

      return NextResponse.redirect(authUrl);
    }

    // Exchange code for token
    const clientId = oauthConfig.google.clientId;
    const clientSecret = oauthConfig.google.clientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", request.url));
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url));
    }

    const tokens = await tokenResponse.json();
    const { access_token } = tokens;

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=failed_to_fetch_user", request.url));
    }

    const userInfo = await userInfoResponse.json();

    // Create or update user in database (within merchant scope)
    const { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } = await import("@/lib/api-helpers");
    const col = await getMerchantCollectionForAPI("users");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    const existingUser = await col.findOne({
      ...baseQuery,
      $or: [{ email: userInfo.email?.toLowerCase() }, { googleId: userInfo.id }],
    });

    let user;
    if (existingUser) {
      // Update existing user with Google ID if not present
      if (!existingUser.googleId) {
        await col.updateOne(
          { ...baseQuery, _id: existingUser._id },
          { $set: { googleId: userInfo.id, updatedAt: new Date().toISOString() } }
        );
      }
      user = existingUser;
    } else {
      // Create new user
      const newUser: any = {
        fullName: userInfo.name || userInfo.email?.split("@")[0] || "User",
        email: userInfo.email?.toLowerCase(),
        googleId: userInfo.id,
        role: "customer" as const,
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
      user = { ...newUser, _id: result.insertedId };
    }

    // Generate JWT token
    const { generateToken } = await import("@/lib/jwt");
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: (user.role || "customer") as "customer" | "merchant" | "admin",
    });

    // Redirect based on user role
    const userRole = (user.role || "customer") as "customer" | "merchant" | "admin";
    let redirectPath = "/account";
    if (userRole === "admin") {
      redirectPath = "/admin";
    } else if (userRole === "merchant") {
      redirectPath = "/merchant";
    }
    const redirectUrl = new URL(redirectPath, request.url);
    const response = NextResponse.redirect(redirectUrl);

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
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}
