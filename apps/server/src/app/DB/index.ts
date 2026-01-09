import { prisma } from "@framex/database";

const superUser = {
    id: "0001",
    email: "admin@framex.com",
    password: "admin123",
    needsPasswordChange: false,
    role: "SUPER_ADMIN" as const,
    status: "ACTIVE" as const,
    isDeleted: false,
};

const seedSuperAdmin = async () => {
    // when database is connected, we will check is there any user who is super admin
    const isSuperAdminExits = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" }
    });

    if (!isSuperAdminExits) {
        await prisma.user.create({
            data: {
                id: superUser.id,
                email: superUser.email,
                password: superUser.password,
                role: superUser.role,
                status: superUser.status,
            }
        });
        console.log("✅ [Database] Super Admin seeded successfully");
    }
};

export default seedSuperAdmin;
