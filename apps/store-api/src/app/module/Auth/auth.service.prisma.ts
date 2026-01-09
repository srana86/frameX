/**
 * Auth Service - Prisma Version
 * Multi-tenant authentication operations
 */

import { prisma, UserRole, UserStatus } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";

/**
 * Register new user (tenant admin/staff)
 */
const register = async (
    tenantId: string,
    data: {
        email: string;
        password: string;
        name?: string;
        role?: UserRole;
    }
) => {
    // Check if email exists
    const existing = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existing) {
        throw new AppError(StatusCodes.CONFLICT, "Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
        data: {
            tenantId,
            email: data.email,
            password: hashedPassword,
            name: data.name,
            role: data.role || UserRole.STAFF,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tenantId: true,
        },
    });

    return user;
};

/**
 * Login user
 */
const login = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            tenant: {
                select: { id: true, name: true, status: true },
            },
        },
    });

    if (!user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
    }

    if (user.status !== UserStatus.ACTIVE) {
        throw new AppError(StatusCodes.FORBIDDEN, "Account is inactive");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
    }

    // Check tenant status (for non-super-admin)
    if (user.tenant && user.tenant.status !== "ACTIVE" && user.tenant.status !== "TRIAL") {
        throw new AppError(StatusCodes.FORBIDDEN, "Tenant account is suspended");
    }

    // Generate tokens
    const accessToken = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        },
        JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            tenant: user.tenant,
        },
        accessToken,
        refreshToken,
    };
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken: string) => {
    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, tenantId: true, status: true },
        });

        if (!user || user.status !== UserStatus.ACTIVE) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
        }

        const accessToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        return { accessToken };
    } catch (error) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
    }
};

/**
 * Change password
 */
const changePassword = async (
    userId: string,
    oldPassword: string,
    newPassword: string
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    return { message: "Password changed successfully" };
};

/**
 * Get user profile
 */
const getProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            tenantId: true,
            emailVerified: true,
            createdAt: true,
            tenant: {
                select: { name: true, status: true },
            },
        },
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    return user;
};

export const AuthServicesPrisma = {
    register,
    login,
    refreshAccessToken,
    changePassword,
    getProfile,
};
