import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma, getTenantByDomain } from "@framex/database";
import redis from "./redis";
import config from "../config";

/**
 * BetterAuth Server Instance
 *
 * This replaces the custom JWT-based authentication with session-based auth.
 * Sessions are stored in Redis for performance with PostgreSQL backup.
 */
export const auth = betterAuth({
  // Base URL for OAuth callbacks
  baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${config.port}`,

  // Secret for signing session tokens
  secret: process.env.BETTER_AUTH_SECRET,

  // Primary Database (Prisma + PostgreSQL)
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Secondary Storage (Redis for high-performance sessions)
  secondaryStorage: {
    get: async (key: string) => {
      const value = await redis.get(`better-auth:${key}`);
      return value || null;
    },
    set: async (key: string, value: string, ttl?: number) => {
      if (ttl) {
        await redis.set(`better-auth:${key}`, value, { EX: ttl });
      } else {
        await redis.set(`better-auth:${key}`, value);
      }
    },
    delete: async (key: string) => {
      await redis.del(`better-auth:${key}`);
    },
  },

  // Session Configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cookie cache
    },
    // Also store in database for backup/audit trail
    storeSessionInDatabase: true,
  },
  // advanced: {
  //   cookiePrefix: "framex",
  //   crossSubDomainCookies: {
  //     enabled: false,
  //     domain: "demo.localhost" // Allow cookies to be shared between subdomains
  //   },
  //   defaultCookieAttributes: {
  //     sameSite: "none",
  //     secure: true, // Required for SameSite=None
  //   }
  // },

  // Email/Password Authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    // Using BetterAuth's default scrypt for password hashing
    // Password reset email handler
    sendResetPassword: async ({ user, url }, request) => {
      // TODO: Integrate with your email service (EmailTemplate module)
      console.log(`[BetterAuth] Password reset link for ${user.email}: ${url}`);
      // Example integration:
      // await EmailTemplateServices.sendPasswordResetEmail(user.email, url);
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`[BetterAuth] Password reset completed for ${user.email}`);
    },
  },

  // Extend User Schema with custom fields for multi-tenant e-commerce
  user: {
    additionalFields: {
      // Multi-tenant support - links user to a specific store
      tenantId: {
        type: "string",
        required: false,
        input: false,
      },
      // User role for access control
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER", // Match Prisma Enum
        input: false, // Don't allow users to set their own role on signup
      },
      // Phone number for contact
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          // Extract domain from request headers (similar to tenantMiddleware logic)
          if (!ctx?.request) {
            throw new Error("Request context is required for user creation");
          }
          const request = ctx.request;
          let domain: string | undefined;

          // Priority 1: x-domain header (frontend sends current domain)
          const xDomain = request?.headers.get("x-domain");
          if (xDomain) {
            domain = xDomain;
          }

          // Priority 2: x-forwarded-domain header (for proxied requests)
          if (!domain) {
            const xForwardedDomain = request?.headers.get("x-forwarded-domain");
            if (xForwardedDomain) {
              domain = xForwardedDomain;
            }
          }

          // Priority 3: Origin header (for cross-origin API calls)
          if (!domain) {
            const origin = request?.headers.get("origin");
            if (origin) {
              try {
                const originUrl = new URL(origin);
                domain = originUrl.hostname;
              } catch (e) {
                // Invalid origin URL, continue
              }
            }
          }

          if (!domain) {
            throw new Error(
              "Domain identification required. Send x-domain header."
            );
          }

          // Resolve tenant from domain
          let tenantDomain;
          try {
            tenantDomain = await getTenantByDomain(domain);
          } catch (error) {
            throw new Error(`Failed to resolve tenant for domain: ${domain}`);
          }

          if (!tenantDomain) {
            throw new Error(`Tenant not found for domain: ${domain}`);
          }

          // Attach tenantId to user (don't modify other fields to avoid interfering with password hashing)
          user.tenantId = tenantDomain.tenantId;
        },
      },
    },
  },

  // Google OAuth Provider
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      prompt: "select_account", // Always show account selector
      // Map Google profile to custom user fields
      mapProfileToUser: (profile) => ({
        name: profile.name,
        email: profile.email,
        emailVerified: profile.email_verified,
        image: profile.picture,
      }),
    },
  },

  // Trusted Origins for CORS
  // Validates: localhost, framextech.com subdomains, AND custom domains from DB
  trustedOrigins: async (request) => {
    const origin = request?.headers.get("origin");
    if (!origin) return [];

    // Allow any localhost (with or without subdomain/port)
    if (/^https?:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/.test(origin)) {
      return [origin];
    }

    // Allow any framextech.com subdomain
    if (/^https?:\/\/([a-z0-9-]+\.)?framextech\.com$/.test(origin)) {
      return [origin];
    }

    // Check if origin is a verified custom domain in the database
    try {
      const originUrl = new URL(origin);
      const hostname = originUrl.hostname;

      // Query database for verified custom domain
      const tenantDomain = await prisma.tenantDomain.findFirst({
        where: {
          OR: [
            { customDomain: hostname },
            { hostname: hostname },
            { primaryDomain: hostname },
          ],
          verified: true,
        },
      });

      if (tenantDomain) {
        return [origin]; // Custom domain is verified, allow it
      }
    } catch (e) {
      // Invalid origin URL, ignore
    }

    return [];
  },
});

// Export types for use in other files
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
