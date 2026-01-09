/**
 * Product Service - Prisma Version
 * Multi-tenant product operations using Prisma ORM
 * 
 * Migration Pattern:
 * - All functions require tenantId as first parameter
 * - Uses Prisma client from @framex/database package
 * - Includes proper indexes for tenant-scoped queries
 */

import { prisma, Prisma, ProductStatus } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

// ============ PRODUCT OPERATIONS ============

/**
 * Get all products with pagination, filter, and search
 */
const getAllProducts = async (
    tenantId: string,
    query: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        status?: ProductStatus;
        featured?: boolean;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }
) => {
    const {
        page = 1,
        limit = 20,
        search,
        category,
        status,
        featured,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
        tenantId, // Always filter by tenant
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ],
        }),
        ...(category && { category: { slug: category } }),
        ...(status && { status }),
        ...(featured !== undefined && { featured }),
    };

    // Get products with pagination
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
                inventory: {
                    select: { quantity: true, lowStock: true },
                },
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.product.count({ where }),
    ]);

    return {
        data: products,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get single product by ID or slug
 */
const getProductByIdOrSlug = async (tenantId: string, idOrSlug: string) => {
    const product = await prisma.product.findFirst({
        where: {
            tenantId,
            OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: {
            category: true,
            inventory: true,
            reviews: {
                where: { approved: true },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
        },
    });

    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
    }

    return product;
};

/**
 * Create product
 */
const createProduct = async (
    tenantId: string,
    data: {
        name: string;
        slug: string;
        price: number;
        comparePrice?: number;
        description?: string;
        images?: string[];
        categoryId?: string;
        status?: ProductStatus;
        featured?: boolean;
    }
) => {
    // Check if slug already exists for this tenant
    const existingProduct = await prisma.product.findFirst({
        where: { tenantId, slug: data.slug },
    });

    if (existingProduct) {
        throw new AppError(StatusCodes.CONFLICT, "Product with this slug already exists");
    }

    // Create product with inventory
    const product = await prisma.product.create({
        data: {
            tenantId,
            name: data.name,
            slug: data.slug,
            price: data.price,
            comparePrice: data.comparePrice,
            description: data.description,
            images: data.images || [],
            categoryId: data.categoryId,
            status: data.status || ProductStatus.ACTIVE,
            featured: data.featured || false,
            inventory: {
                create: {
                    tenantId,
                    quantity: 0,
                },
            },
        },
        include: {
            category: true,
            inventory: true,
        },
    });

    return product;
};

/**
 * Update product
 */
const updateProduct = async (
    tenantId: string,
    idOrSlug: string,
    data: Partial<{
        name: string;
        slug: string;
        price: number;
        comparePrice: number;
        description: string;
        images: string[];
        categoryId: string;
        status: ProductStatus;
        featured: boolean;
    }>
) => {
    // Find existing product
    const existingProduct = await prisma.product.findFirst({
        where: {
            tenantId,
            OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
    });

    if (!existingProduct) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
    }

    // Check slug uniqueness if updating slug
    if (data.slug && data.slug !== existingProduct.slug) {
        const slugExists = await prisma.product.findFirst({
            where: {
                tenantId,
                slug: data.slug,
                NOT: { id: existingProduct.id },
            },
        });

        if (slugExists) {
            throw new AppError(StatusCodes.CONFLICT, "Slug already exists");
        }
    }

    // Update product
    const product = await prisma.product.update({
        where: { id: existingProduct.id },
        data,
        include: {
            category: true,
            inventory: true,
        },
    });

    return product;
};

/**
 * Delete product (soft delete by setting status to ARCHIVED)
 */
const deleteProduct = async (tenantId: string, idOrSlug: string) => {
    const product = await prisma.product.findFirst({
        where: {
            tenantId,
            OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
    });

    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
    }

    // Soft delete
    await prisma.product.update({
        where: { id: product.id },
        data: { status: ProductStatus.ARCHIVED },
    });

    return { message: "Product deleted successfully" };
};

// ============ CATEGORY OPERATIONS ============

/**
 * Get all categories
 */
const getAllCategories = async (tenantId: string) => {
    return prisma.category.findMany({
        where: { tenantId, isActive: true },
        include: {
            _count: { select: { products: true } },
        },
        orderBy: { sortOrder: "asc" },
    });
};

/**
 * Create category
 */
const createCategory = async (
    tenantId: string,
    data: { name: string; slug: string; description?: string; image?: string }
) => {
    // Check slug uniqueness
    const existing = await prisma.category.findFirst({
        where: { tenantId, slug: data.slug },
    });

    if (existing) {
        throw new AppError(StatusCodes.CONFLICT, "Category slug already exists");
    }

    return prisma.category.create({
        data: {
            tenantId,
            ...data,
        },
    });
};

/**
 * Update category
 */
const updateCategory = async (
    tenantId: string,
    id: string,
    data: Partial<{ name: string; slug: string; description: string; image: string; isActive: boolean }>
) => {
    const category = await prisma.category.findFirst({
        where: { tenantId, id },
    });

    if (!category) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
    }

    return prisma.category.update({
        where: { id },
        data,
    });
};

/**
 * Delete category
 */
const deleteCategory = async (tenantId: string, id: string) => {
    const category = await prisma.category.findFirst({
        where: { tenantId, id },
    });

    if (!category) {
        throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
    }

    // Soft delete
    await prisma.category.update({
        where: { id },
        data: { isActive: false },
    });

    return { message: "Category deleted successfully" };
};

// ============ EXPORTS ============

export const ProductServicesPrisma = {
    // Products
    getAllProducts,
    getProductByIdOrSlug,
    createProduct,
    updateProduct,
    deleteProduct,
    // Categories
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
