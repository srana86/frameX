import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

import { PrismaClient, TenantStatus, UserRole, ProductStatus, OrderStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    // Create super admin user
    const hashedPassword = await hash("admin123", 12);

    const superAdmin = await prisma.user.upsert({
        where: { email: "admin@framex.com" },
        update: {},
        create: {
            email: "admin@framex.com",
            password: hashedPassword,
            name: "Super Admin",
            role: UserRole.SUPER_ADMIN,
            emailVerified: true,
        },
    });
    console.log("✅ Super admin created:", superAdmin.email);

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
            password: hashedPassword,
            name: "Demo Admin",
            role: UserRole.ADMIN,
            emailVerified: true,
        },
    });
    console.log("✅ Tenant admin created:", tenantAdmin.email);

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
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
