import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma, getTenantByDomain } from "@framex/database";
import config from "../config";
import redis from "./redis";

/**
 * BetterAuth Server Instance
 *
 * This handles authentication for both:
 * - Store owners (OWNER role) - main platform users
 * - Store customers (CUSTOMER role) - multi-tenant storefront users
 *
 * Sessions are stored in Redis for performance with PostgreSQL backup.
 */
/**
 * Resolve tenant from request headers
 */
async function resolveTenant(ctx: { request?: Request | null }) {
  const request = ctx?.request;
  if (!request) return null;

  let domain: string | undefined;

  // Priority 1: x-domain header
  const xDomain = request.headers.get("x-domain");
  if (xDomain) domain = xDomain;

  // Priority 2: x-forwarded-domain
  if (!domain) {
    const xForwardedDomain = request.headers.get("x-forwarded-domain");
    if (xForwardedDomain) domain = xForwardedDomain;
  }

  // Priority 3: Host header (for direct browser requests)
  if (!domain) {
    const xForwardedHost = request.headers.get("x-forwarded-host");
    if (xForwardedHost) {
      domain = xForwardedHost;
    } else {
      const host = request.headers.get("host");
      if (host) domain = host;
    }
  }

  // Priority 4: Origin header (for cross-origin API calls)
  if (!domain) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        domain = originUrl.hostname;
      } catch (e) { }
    }
  }

  if (!domain) return null;

  // Skip tenant resolution for main platform domains
  if (
    domain === "localhost" ||
    domain.endsWith("framextech.com") ||
    domain.endsWith("framextech.local")
  ) {
    const isMainPlatform =
      domain === "localhost" ||
      domain === "framextech.com" ||
      domain === "framextech.local";
    if (isMainPlatform) return null;
  }

  try {
    const tenantDomain = await getTenantByDomain(domain);
    return tenantDomain || null;
  } catch (error) {
    console.error(`[BetterAuth] Failed to resolve tenant for domain: ${domain}`, error);
    return null;
  }
}

/**
 * BetterAuth Server Instance
 */
export const auth = betterAuth({
  // Base URL for OAuth callbacks
  baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${config.port}`,

  // Secret for signing session tokens
  secret: process.env.BETTER_AUTH_SECRET || "your-secret",

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

  // Email/Password Authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
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
      tenantId: {
        type: "string",
        required: false,
        input: true, // MUST be true to allow the before hook to inject it into the body
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  plugins: [
    {
      id: "tenant-isolation",
      hooks: {
        before: [
          {
            // Intercept signup, signin, and OAuth callbacks
            matcher: (ctx) =>
              ctx.path.startsWith("/sign-up") ||
              ctx.path.startsWith("/sign-in") ||
              ctx.path.startsWith("/callback/"),
            handler: async (ctx) => {
              const tenant = await resolveTenant(ctx as any);
              if (!tenant) return { context: ctx };

              const body = ctx.body as any;
              const tenantSlug = tenant.tenant.slug || tenant.tenantId;

              // 1. Scope Email for Credentials using RFC-compliant subaddressing (local+slug@domain)
              if (body?.email && body.email.includes("@")) {
                const originalEmail = body.email;
                const [local, domain] = originalEmail.split("@");
                body.email = `${local}+${tenantSlug}@${domain}`;
                console.log(`[BetterAuth Hook] Scoping email: ${originalEmail} -> ${body.email} (Tenant: ${tenantSlug})`);
              }

              // 2. Scope accountId if present (for social callbacks or linking)
              if (body?.accountId) {
                const originalAccountId = body.accountId;
                body.accountId = `${tenant.tenantId}:${body.accountId}`;
                console.log(`[BetterAuth Hook] Scoping accountId: ${originalAccountId} -> ${body.accountId}`);
              }

              // 3. Ensure tenantId is attached for user creation
              if (ctx.path.startsWith("/sign-up") || ctx.path.startsWith("/callback/")) {
                if (body) {
                  body.tenantId = tenant.tenantId;
                  console.log(`[BetterAuth Hook] Attaching tenantId: ${tenant.tenantId}`);
                }
              }

              return { context: ctx };
            },
          },
        ],
        after: [
          {
            // Intercept session lookups and auth responses to clean up virtual emails
            matcher: (ctx) =>
              ctx.path.startsWith("/get-session") ||
              ctx.path.startsWith("/sign-in") ||
              ctx.path.startsWith("/sign-up") ||
              ctx.path.startsWith("/callback/"),
            handler: async (ctx) => {
              const response = ctx.json;
              if (response?.user?.email && response.user.email.includes("+")) {
                const physicalEmail = response.user.email;
                // Strip the last +... part (Virtual Email -> Real Email)
                const [localPlus, domain] = physicalEmail.split("@");
                const lastPlusIndex = localPlus.lastIndexOf("+");
                if (lastPlusIndex !== -1) {
                  response.user.email = `${localPlus.substring(0, lastPlusIndex)}@${domain}`;
                }
                console.log(`[BetterAuth Hook] Descoping email: ${physicalEmail} -> ${response.user.email}`);
              }
              return { response };
            },
          },
        ],
      },
    } as any,
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.role === "OWNER") {
            try {
              await prisma.storeOwner.create({
                data: {
                  userId: user.id,
                  displayName: user.name,
                },
              });
            } catch (error) {
              console.error(
                `[BetterAuth Hook] Failed to create StoreOwner for user ${user.id}:`,
                error
              );
            }
          }
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

  // Dynamic trusted origins - supports localhost, framextech.com subdomains, and custom domains
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

    // Allow framextech.local for local development
    if (/^https?:\/\/([a-z0-9-]+\.)?framextech\.local(:\d+)?$/.test(origin)) {
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
