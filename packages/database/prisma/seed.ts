import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

import { PrismaClient, TenantStatus, UserRole, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/**
 * Hash password using scrypt (same as BetterAuth default)
 */
async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
    console.log("🌱 Seeding database...");

    const now = new Date();
    const hashedPassword = await hashPassword("admin123");

    // Create super admin user
    const superAdmin = await prisma.user.upsert({
        where: { email: "admin@framex.com" },
        update: {},
        create: {
            email: "admin@framex.com",
            name: "Super Admin",
            role: UserRole.SUPER_ADMIN,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
        },
    });
    console.log("✅ Super admin created:", superAdmin.email);

    // Create credential account for super admin (BetterAuth stores password here)
    await prisma.account.upsert({
        where: {
            providerId_accountId: {
                providerId: "credential",
                accountId: superAdmin.id,
            },
        },
        update: {},
        create: {
            userId: superAdmin.id,
            accountId: superAdmin.id,
            providerId: "credential",
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
        },
    });
    console.log("✅ Super admin account created with password");

    // Create demo tenant
    const demoTenant = await prisma.tenant.upsert({
        where: { email: "demo@framex.com" },
        update: {},
        create: {
            name: "Demo Store",
            email: "demo@framex.com",
            phone: "+1234567890",
            status: TenantStatus.ACTIVE,
        },
    });
    console.log("✅ Demo tenant created:", demoTenant.name);

    // Create tenant domain
    await prisma.tenantDomain.upsert({
        where: { subdomain: "demo" },
        update: {},
        create: {
            tenantId: demoTenant.id,
            subdomain: "demo",
            primaryDomain: "demo.framextech.com",
            verified: true,
            sslStatus: "ACTIVE",
        },
    });
    console.log("✅ Domain created: demo.framextech.com");

    // Create tenant settings
    await prisma.tenantSettings.upsert({
        where: { tenantId: demoTenant.id },
        update: {},
        create: {
            tenantId: demoTenant.id,
            brandName: "Demo Store",
            currency: "USD",
            currencySymbol: "$",
        },
    });
    console.log("✅ Tenant settings created");

    // Create tenant admin
    const tenantAdmin = await prisma.user.upsert({
        where: { email: "demo@framex.com" },
        update: {},
        create: {
            tenantId: demoTenant.id,
            email: "demo@framex.com",
            name: "Demo Admin",
            role: UserRole.ADMIN,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
        },
    });
    console.log("✅ Tenant admin created:", tenantAdmin.email);

    // Create credential account for tenant admin
    await prisma.account.upsert({
        where: {
            providerId_accountId: {
                providerId: "credential",
                accountId: tenantAdmin.id,
            },
        },
        update: {},
        create: {
            userId: tenantAdmin.id,
            accountId: tenantAdmin.id,
            providerId: "credential",
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
        },
    });
    console.log("✅ Tenant admin account created with password");

    // Create demo category
    const category = await prisma.category.upsert({
        where: {
            tenantId_slug: {
                tenantId: demoTenant.id,
                slug: "electronics",
            },
        },
        update: {},
        create: {
            tenantId: demoTenant.id,
            name: "Electronics",
            slug: "electronics",
            description: "Electronic devices and gadgets",
        },
    });
    console.log("✅ Demo category created:", category.name);

    // Create demo products
    const products = [
        { name: "Wireless Headphones", slug: "wireless-headphones", price: 99.99 },
        { name: "Smart Watch", slug: "smart-watch", price: 249.99 },
        { name: "Bluetooth Speaker", slug: "bluetooth-speaker", price: 79.99 },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: {
                tenantId_slug: {
                    tenantId: demoTenant.id,
                    slug: product.slug,
                },
            },
            update: {},
            create: {
                tenantId: demoTenant.id,
                categoryId: category.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                description: `High quality ${product.name.toLowerCase()}`,
                status: ProductStatus.ACTIVE,
                images: [],
            },
        });
    }
    console.log("✅ Demo products created");

    console.log("🎉 Seeding completed!");
    console.log("");
    console.log("📝 Demo Credentials:");
    console.log("   Super Admin: admin@framex.com / admin123");
    console.log("   Tenant Admin: demo@framex.com / admin123");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
