/**
 * Content Service - Prisma Version
 * Multi-tenant content operations (Pages, Hero Slides)
 */

import { prisma, Prisma } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

// ============ PAGES ============

/**
 * Get all pages
 */
const getAllPages = async (tenantId: string) => {
    return prisma.page.findMany({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: "desc" },
    });
};

/**
 * Get page by slug
 */
const getPageBySlug = async (tenantId: string, slug: string) => {
    const page = await prisma.page.findFirst({
        where: { tenantId, slug, isActive: true },
    });

    if (!page) {
        throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
    }

    return page;
};

/**
 * Create page
 */
const createPage = async (
    tenantId: string,
    data: { slug: string; title: string; content?: string }
) => {
    const existing = await prisma.page.findFirst({
        where: { tenantId, slug: data.slug },
    });

    if (existing) {
        throw new AppError(StatusCodes.CONFLICT, "Page slug already exists");
    }

    return prisma.page.create({
        data: { tenantId, ...data },
    });
};

/**
 * Update page
 */
const updatePage = async (
    tenantId: string,
    id: string,
    data: Partial<{ slug: string; title: string; content: string; isActive: boolean }>
) => {
    const page = await prisma.page.findFirst({
        where: { tenantId, id },
    });

    if (!page) {
        throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
    }

    return prisma.page.update({
        where: { id },
        data,
    });
};

/**
 * Delete page
 */
const deletePage = async (tenantId: string, id: string) => {
    const page = await prisma.page.findFirst({
        where: { tenantId, id },
    });

    if (!page) {
        throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
    }

    await prisma.page.update({
        where: { id },
        data: { isActive: false },
    });

    return { message: "Page deleted" };
};

// ============ HERO SLIDES ============

/**
 * Get all hero slides
 */
const getAllHeroSlides = async (tenantId: string, activeOnly = true) => {
    return prisma.heroSlide.findMany({
        where: {
            tenantId,
            ...(activeOnly && { isActive: true }),
        },
        orderBy: { sortOrder: "asc" },
    });
};

/**
 * Create hero slide
 */
const createHeroSlide = async (
    tenantId: string,
    data: { title?: string; subtitle?: string; image: string; link?: string }
) => {
    // Get max sort order
    const maxOrder = await prisma.heroSlide.aggregate({
        where: { tenantId },
        _max: { sortOrder: true },
    });

    return prisma.heroSlide.create({
        data: {
            tenantId,
            ...data,
            sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        },
    });
};

/**
 * Update hero slide
 */
const updateHeroSlide = async (
    tenantId: string,
    id: string,
    data: Partial<{ title: string; subtitle: string; image: string; link: string; sortOrder: number; isActive: boolean }>
) => {
    const slide = await prisma.heroSlide.findFirst({
        where: { tenantId, id },
    });

    if (!slide) {
        throw new AppError(StatusCodes.NOT_FOUND, "Hero slide not found");
    }

    return prisma.heroSlide.update({
        where: { id },
        data,
    });
};

/**
 * Update hero slide order
 */
const updateHeroSlideOrder = async (
    tenantId: string,
    slides: Array<{ id: string; sortOrder: number }>
) => {
    await Promise.all(
        slides.map((slide) =>
            prisma.heroSlide.updateMany({
                where: { tenantId, id: slide.id },
                data: { sortOrder: slide.sortOrder },
            })
        )
    );

    return getAllHeroSlides(tenantId);
};

/**
 * Delete hero slide
 */
const deleteHeroSlide = async (tenantId: string, id: string) => {
    const slide = await prisma.heroSlide.findFirst({
        where: { tenantId, id },
    });

    if (!slide) {
        throw new AppError(StatusCodes.NOT_FOUND, "Hero slide not found");
    }

    await prisma.heroSlide.delete({ where: { id } });

    return { message: "Hero slide deleted" };
};

export const ContentServicesPrisma = {
    // Pages
    getAllPages,
    getPageBySlug,
    createPage,
    updatePage,
    deletePage,
    // Hero Slides
    getAllHeroSlides,
    createHeroSlide,
    updateHeroSlide,
    updateHeroSlideOrder,
    deleteHeroSlide,
};
