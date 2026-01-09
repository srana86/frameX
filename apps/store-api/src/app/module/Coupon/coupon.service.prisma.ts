/**
 * Coupon Service - Prisma Version
 * Multi-tenant coupon operations
 */

import { prisma, Prisma, DiscountType } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

/**
 * Get all coupons
 */
const getAllCoupons = async (
    tenantId: string,
    query: { page?: number; limit?: number; active?: boolean }
) => {
    const { page = 1, limit = 20, active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {
        tenantId,
        ...(active !== undefined && { isActive: active }),
    };

    const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.coupon.count({ where }),
    ]);

    return {
        data: coupons,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Get coupon by code
 */
const getCouponByCode = async (tenantId: string, code: string) => {
    const coupon = await prisma.coupon.findFirst({
        where: {
            tenantId,
            code: code.toUpperCase(),
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
    });

    return coupon;
};

/**
 * Validate and apply coupon
 */
const validateCoupon = async (tenantId: string, code: string, orderTotal: number) => {
    const coupon = await getCouponByCode(tenantId, code);

    if (!coupon) {
        throw new AppError(StatusCodes.NOT_FOUND, "Invalid or expired coupon");
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Coupon usage limit reached");
    }

    if (coupon.minOrderValue && orderTotal < Number(coupon.minOrderValue)) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Minimum order value is ${coupon.minOrderValue}`
        );
    }

    // Calculate discount
    let discount: number;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
        discount = (orderTotal * Number(coupon.discountValue)) / 100;
    } else {
        discount = Number(coupon.discountValue);
    }

    return {
        valid: true,
        discount: Math.min(discount, orderTotal),
        coupon,
    };
};

/**
 * Create coupon
 */
const createCoupon = async (
    tenantId: string,
    data: {
        code: string;
        discountType: DiscountType;
        discountValue: number;
        minOrderValue?: number;
        maxUses?: number;
        expiresAt?: Date;
    }
) => {
    const code = data.code.toUpperCase();

    // Check if code exists
    const existing = await prisma.coupon.findFirst({
        where: { tenantId, code },
    });

    if (existing) {
        throw new AppError(StatusCodes.CONFLICT, "Coupon code already exists");
    }

    return prisma.coupon.create({
        data: {
            tenantId,
            code,
            discountType: data.discountType,
            discountValue: data.discountValue,
            minOrderValue: data.minOrderValue,
            maxUses: data.maxUses,
            expiresAt: data.expiresAt,
        },
    });
};

/**
 * Update coupon usage count
 */
const incrementUsage = async (tenantId: string, code: string) => {
    return prisma.coupon.updateMany({
        where: { tenantId, code: code.toUpperCase() },
        data: { usedCount: { increment: 1 } },
    });
};

/**
 * Delete/deactivate coupon
 */
const deleteCoupon = async (tenantId: string, id: string) => {
    const coupon = await prisma.coupon.findFirst({
        where: { tenantId, id },
    });

    if (!coupon) {
        throw new AppError(StatusCodes.NOT_FOUND, "Coupon not found");
    }

    await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
    });

    return { message: "Coupon deleted" };
};

export const CouponServicesPrisma = {
    getAllCoupons,
    getCouponByCode,
    validateCoupon,
    createCoupon,
    incrementUsage,
    deleteCoupon,
};
