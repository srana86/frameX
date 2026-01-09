/**
 * Tenant Admin Service - Super Admin Operations
 * Manages tenants, domains, and subscriptions
 */

import { prisma, TenantStatus, SSLStatus, Prisma } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

// ============ TENANT MANAGEMENT ============

/**
 * Get all tenants with pagination
 */
const getAllTenants = async (query: {
    page?: number;
    limit?: number;
    status?: TenantStatus;
    search?: string;
}) => {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {
        ...(status && { status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
            where,
            include: {
                domains: true,
                settings: {
                    select: { brandName: true, logo: true },
                },
                _count: {
                    select: { users: true, products: true, orders: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.tenant.count({ where }),
    ]);

    return {
        data: tenants,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Get tenant by ID
 */
const getTenantById = async (tenantId: string) => {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
            domains: true,
            settings: true,
            users: {
                select: { id: true, email: true, name: true, role: true },
            },
            _count: {
                select: { products: true, orders: true, customers: true },
            },
        },
    });

    if (!tenant) {
        throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
    }

    return tenant;
};

/**
 * Create new tenant
 */
const createTenant = async (data: {
    name: string;
    email: string;
    phone?: string;
    subdomain: string;
}) => {
    // Check email uniqueness
    const existingEmail = await prisma.tenant.findUnique({
        where: { email: data.email },
    });

    if (existingEmail) {
        throw new AppError(StatusCodes.CONFLICT, "Email already registered");
    }

    // Check subdomain uniqueness
    const existingSubdomain = await prisma.tenantDomain.findUnique({
        where: { subdomain: data.subdomain.toLowerCase() },
    });

    if (existingSubdomain) {
        throw new AppError(StatusCodes.CONFLICT, "Subdomain already taken");
    }

    // Create tenant with domain and default settings
    const tenant = await prisma.tenant.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            status: TenantStatus.TRIAL,
            domains: {
                create: {
                    subdomain: data.subdomain.toLowerCase(),
                    primaryDomain: `${data.subdomain.toLowerCase()}.framextech.com`,
                    verified: true,
                    sslStatus: SSLStatus.ACTIVE,
                },
            },
            settings: {
                create: {
                    brandName: data.name,
                },
            },
        },
        include: {
            domains: true,
            settings: true,
        },
    });

    return tenant;
};

/**
 * Update tenant status
 */
const updateTenantStatus = async (tenantId: string, status: TenantStatus) => {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) {
        throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
    }

    return prisma.tenant.update({
        where: { id: tenantId },
        data: { status },
        include: { domains: true },
    });
};

/**
 * Update tenant details
 */
const updateTenant = async (
    tenantId: string,
    data: Partial<{ name: string; email: string; phone: string }>
) => {
    return prisma.tenant.update({
        where: { id: tenantId },
        data,
        include: { domains: true, settings: true },
    });
};

// ============ DOMAIN MANAGEMENT ============

/**
 * Add custom domain to tenant
 */
const addCustomDomain = async (tenantId: string, customDomain: string) => {
    // Check domain uniqueness
    const existing = await prisma.tenantDomain.findUnique({
        where: { customDomain },
    });

    if (existing) {
        throw new AppError(StatusCodes.CONFLICT, "Domain already in use");
    }

    // Update existing domain or create new
    const currentDomain = await prisma.tenantDomain.findFirst({
        where: { tenantId },
    });

    if (currentDomain) {
        return prisma.tenantDomain.update({
            where: { id: currentDomain.id },
            data: {
                customDomain,
                primaryDomain: customDomain,
                verified: false,
                sslStatus: SSLStatus.PENDING,
            },
        });
    }

    return prisma.tenantDomain.create({
        data: {
            tenantId,
            customDomain,
            primaryDomain: customDomain,
            verified: false,
            sslStatus: SSLStatus.PENDING,
        },
    });
};

/**
 * Verify custom domain
 */
const verifyDomain = async (tenantId: string) => {
    const domain = await prisma.tenantDomain.findFirst({
        where: { tenantId },
    });

    if (!domain) {
        throw new AppError(StatusCodes.NOT_FOUND, "Domain not found");
    }

    // In production, this would check DNS records
    // For now, we'll just mark as verified

    return prisma.tenantDomain.update({
        where: { id: domain.id },
        data: {
            verified: true,
            sslStatus: SSLStatus.ACTIVE,
        },
    });
};

// ============ STATISTICS ============

/**
 * Get platform statistics
 */
const getPlatformStats = async () => {
    const [
        totalTenants,
        activeTenants,
        totalOrders,
        totalRevenue,
    ] = await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { total: true } }),
    ]);

    return {
        totalTenants,
        activeTenants,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
    };
};

export const TenantAdminServicesPrisma = {
    // Tenants
    getAllTenants,
    getTenantById,
    createTenant,
    updateTenant,
    updateTenantStatus,
    // Domains
    addCustomDomain,
    verifyDomain,
    // Stats
    getPlatformStats,
};
