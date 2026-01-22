import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@framex/database";
import config from "../config";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${config.port}`,
  secret: process.env.BETTER_AUTH_SECRET || "your-secret",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cookie cache
    },
    storeSessionInDatabase: true,
  },
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
              console.error(`[BetterAuth Hook] Failed to create StoreOwner for user ${user.id}:`, error);
            }
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "OWNER",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      tenantId: {
        type: "string",
        required: false,
        input: true,
      },
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
