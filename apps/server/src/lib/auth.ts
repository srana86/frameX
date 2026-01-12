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
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "ADMIN",
                input: false,
            },
            phone: {
                type: "string",
                required: false,
                input: true,
            },
        },
    },
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.DASHBOARD_URL || "",
    ].filter(Boolean),
});
