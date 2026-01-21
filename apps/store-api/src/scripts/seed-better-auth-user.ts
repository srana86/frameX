
import dotenv from "dotenv";
dotenv.config();

import { auth } from "../lib/auth";
import { prisma } from "@framex/database";
import redis from "../lib/redis";

async function main() {
    console.log("🌱 Seeding BetterAuth User (via User model)...");

    // Connect to Redis (required for BetterAuth secondary storage)
    if (!redis.isOpen) {
        await redis.connect();
    }

    const demoEmail = "demo@framex.com";
    const demoPassword = "password123";

    // 1. Check if user already exists
    // Using prisma.user (standard User model)
    const existingUser = await prisma.user.findUnique({
        where: { email: demoEmail },
    });

    if (existingUser) {
        console.log("⚠️ User exists, deleting to ensure fresh BetterAuth setup...");
        await prisma.user.delete({
            where: { email: demoEmail }
        });
        console.log("✅ Deleted existing user.");
    }

    // 2. Find a tenant
    const tenant = await prisma.tenant.findUnique({
        where: { email: demoEmail },
    });

    let tenantId = tenant?.id;

    if (!tenantId) {
        console.log("⚠️ Demo tenant not found via email, picking first available tenant...");
        const firstTenant = await prisma.tenant.findFirst();
        if (firstTenant) {
            tenantId = firstTenant.id;
        } else {
            console.error("❌ No tenants found in database. Please run main seed first.");
            process.exit(1);
        }
    }

    console.log("Using Tenant ID:", tenantId);

    // 3. Create User via BetterAuth API
    try {
        const result = await auth.api.signUpEmail({
            body: {
                email: demoEmail,
                password: demoPassword,
                name: "Demo User",
                // Pass custom fields in body if allowed by types (or ignored if not)
                // BetterAuth client-side allows extra props. Server-side types might be strict.
                // But we can update afterwards.
            }
        });

        if (result?.user?.id) {
            // Update tenantId and Role
            await prisma.user.update({
                where: { id: result.user.id },
                data: {
                    tenantId: tenantId,
                    role: "TENANT", // Enum value matching UserRole
                    phone: "+1234567890",
                    emailVerified: true // Set verified
                }
            });
            console.log("✅ User updated with Tenant ID and Role.");
        }

        console.log("✅ BetterAuth User created successfully!");
        console.log("🔑 Credentials:");
        console.log("   Email:", demoEmail);
        console.log("   Password:", demoPassword);

    } catch (error) {
        console.error("❌ Failed to create user:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        if (redis.isOpen) {
            await redis.disconnect();
        }
    });
