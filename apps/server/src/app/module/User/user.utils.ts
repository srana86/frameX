import { prisma } from "@framex/database";
import bcrypt from "bcrypt";
import config from "../../../config";

export type TUser = {
    id: string;
    email: string;
    password: string;
    name?: string | null;
    phone?: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    emailVerified: boolean;
    tenantId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
};

export type TUserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

// User helper functions (replacing Mongoose static methods)

export async function isUserExistsByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            accounts: {
                where: { providerId: 'credential' },
                select: { password: true }
            }
        }
    });

    if (user && user.accounts?.[0]?.password) {
        return {
            ...user,
            password: user.accounts[0].password
        };
    }
    return user ? { ...user, password: null } : null;
}

export async function isUserExistsByCustomId(id: string) {
    return prisma.user.findUnique({
        where: { id },
    });
}

export async function isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
}

export function isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date | null | undefined,
    jwtIssuedTimestamp: number
): boolean {
    if (!passwordChangedTimestamp) return false;
    const passwordChangedTime = new Date(passwordChangedTimestamp).getTime() / 1000;
    return passwordChangedTime > jwtIssuedTimestamp;
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
}

export async function createUser(userData: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    role?: TUserRole;
    tenantId?: string;
}) {
    const hashedPassword = await hashPassword(userData.password);

    // BetterAuth stores password in Account table, not User table
    const user = await prisma.user.create({
        data: {
            email: userData.email,
            name: userData.name || userData.email.split('@')[0],
            phone: userData.phone,
            role: userData.role || "STAFF",
            tenantId: userData.tenantId,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    // Create credential account for password login
    await prisma.account.create({
        data: {
            userId: user.id,
            accountId: user.id,
            providerId: 'credential',
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    return user;
}

export async function updateUserById(id: string, data: {
    name?: string;
    phone?: string | null;
    role?: TUserRole;
    status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
    emailVerified?: boolean;
}) {
    return prisma.user.update({
        where: { id },
        data,
    });
}

export async function changeUserStatus(id: string, status: "ACTIVE" | "INACTIVE" | "BLOCKED") {
    return prisma.user.update({
        where: { id },
        data: { status },
    });
}
