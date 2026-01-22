/**
 * Customer Service - Prisma Version
 * Multi-tenant customer operations
 */

import { prisma, Prisma } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

/**
 * Get all customers with pagination
 */
const getAllCustomers = async (
    tenantId: string,
    query: {
        page?: number;
        limit?: number;
        search?: string;
        blocked?: boolean;
    }
) => {
    const { page = 1, limit = 20, search, blocked } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
        tenantId,
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
        ...(blocked !== undefined && { blocked }),
    };

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            include: {
                _count: { select: { orders: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.customer.count({ where }),
    ]);

    return {
        data: customers,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Get customer by ID
 */
const getCustomerById = async (tenantId: string, customerId: string) => {
    const customer = await prisma.customer.findFirst({
        where: { tenantId, id: customerId },
        include: {
            orders: {
                orderBy: { createdAt: "desc" },
                take: 10,
                include: { items: true },
            },
        },
    });

    if (!customer) {
        throw new AppError(StatusCodes.NOT_FOUND, "Customer not found");
    }

    return customer;
};

/**
 * Get customer by phone
 */
const getCustomerByPhone = async (tenantId: string, phone: string) => {
    return prisma.customer.findFirst({
        where: { tenantId, phone },
    });
};

/**
 * Create or update customer
 */
const upsertCustomer = async (
    tenantId: string,
    data: { phone: string; name: string; email?: string; address?: string; city?: string }
) => {
    return prisma.customer.upsert({
        where: {
            tenantId_phone: { tenantId, phone: data.phone },
        },
        update: {
            name: data.name,
            email: data.email,
            address: data.address,
            city: data.city,
        },
        create: {
            tenantId,
            ...data,
        },
    });
};

/**
 * Block/unblock customer
 */
const toggleBlockCustomer = async (tenantId: string, customerId: string, blocked: boolean) => {
    const customer = await prisma.customer.findFirst({
        where: { tenantId, id: customerId },
    });

    if (!customer) {
        throw new AppError(StatusCodes.NOT_FOUND, "Customer not found");
    }

    return prisma.customer.update({
        where: { id: customerId },
        data: { blocked },
    });
};

export const CustomerServicesPrisma = {
    getAllCustomers,
    getCustomerById,
    getCustomerByPhone,
    upsertCustomer,
    toggleBlockCustomer,
};
