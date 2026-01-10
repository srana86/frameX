import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient, StoreUserRole, StoreUserStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

// Load environment variables
config({ path: resolve(__dirname, "../.env") });

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding Store User...");

    const demoEmail = "demo@framex.com";

    // 1. Find the Demo Tenant
    const tenant = await prisma.tenant.findUnique({
        where: { email: demoEmail },
    });

    if (!tenant) {
        console.error("❌ Demo tenant not found! Please run the main seed first.");
        process.exit(1);
    }

    console.log("✅ Found Demo Tenant:", tenant.name, tenant.id);

    // 2. Create a Store User (Customer) for this tenant
    const hashedPassword = await hash("customer123", 12);

    const storeUser = await prisma.storeUser.upsert({
        where: {
            tenantId_email: {
                tenantId: tenant.id,
                email: demoEmail, // Using same email for convenience, but as a CUSTOMER role
            },
        },
        update: {
            password: hashedPassword, // Ensure password is set/updated
            status: StoreUserStatus.IN_PROGRESS,
            role: StoreUserRole.CUSTOMER
        },
        create: {
            tenantId: tenant.id,
            email: demoEmail,
            fullName: "Demo Customer",
            password: hashedPassword,
            phone: "+1234567890",
            role: StoreUserRole.CUSTOMER,
            status: StoreUserStatus.IN_PROGRESS,
            emailVerified: true,
        },
    });

    console.log("✅ Store Customer created:", storeUser.email);
    console.log("🔑 Credentials:");
    console.log("   Email: demo@framex.com");
    console.log("   Password: customer123");
    console.log("   Tenant ID (x-merchant-id):", tenant.id);
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
