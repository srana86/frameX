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
    },
  },
  trustedOrigins: ["http://localhost", process.env.DASHBOARD_URL].filter(
    (x): x is string => Boolean(x)
  ),
});
