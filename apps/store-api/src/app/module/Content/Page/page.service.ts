/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@framex/database";
import { TPage, TPageCategory } from "./page.interface";

// Get all pages
const getAllPagesFromDB = async (tenantId: string) => {
  const result = await prisma.page.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  return result;
};

// Get enabled pages only
const getEnabledPagesFromDB = async (tenantId: string) => {
  const result = await prisma.page.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return result;
};

// Get page by slug
const getPageBySlugFromDB = async (tenantId: string, slug: string) => {
  const result = await prisma.page.findUnique({
    where: {
      tenantId_slug: {
        tenantId,
        slug,
      },
    },
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
  }

  return result;
};

// Create page
const createPageIntoDB = async (tenantId: string, payload: TPage) => {
  // Generate slug if not provided
  const slug =
    payload.slug ||
    (payload.title
      ? payload.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      : `page-${Date.now()}`);

  const result = await prisma.page.create({
    data: {
      tenantId,
      title: payload.title,
      slug,
      content: payload.content,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      sortOrder: payload.order || 0, // Interface likely has 'order', schema has 'sortOrder'
      pageCategoryId: payload.pageCategoryId, // Assuming payload has this if needed
    },
  });
  return result;
};

// Update page
const updatePageIntoDB = async (
  tenantId: string,
  slug: string,
  payload: Partial<TPage>
) => {
  const existing = await prisma.page.findUnique({
    where: {
      tenantId_slug: {
        tenantId,
        slug,
      },
    },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
  }

  const updateData: any = { ...payload };
  if (payload.order !== undefined) {
    updateData.sortOrder = payload.order;
    delete updateData.order;
  }

  const result = await prisma.page.update({
    where: { id: existing.id },
    data: updateData,
  });

  return result;
};

// Delete page
const deletePageFromDB = async (tenantId: string, slug: string) => {
  const existing = await prisma.page.findUnique({
    where: {
      tenantId_slug: {
        tenantId,
        slug,
      },
    },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page not found");
  }

  await prisma.page.delete({
    where: { id: existing.id },
  });

  return { success: true };
};

// Get page categories
const getPageCategoriesFromDB = async (tenantId: string) => {
  const result = await prisma.pageCategory.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
  return result;
};

// Create page category
const createPageCategoryIntoDB = async (
  tenantId: string,
  payload: TPageCategory
) => {
  let slug = payload.slug;
  if (!slug && payload.name) {
    slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const result = await prisma.pageCategory.create({
    data: {
      tenantId,
      name: payload.name,
      slug: slug || `cat-${Date.now()}`,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      sortOrder: payload.order || 0,
    },
  });
  return result;
};

// Update page category
const updatePageCategoryIntoDB = async (
  tenantId: string,
  id: string,
  payload: Partial<TPageCategory>
) => {
  const existing = await prisma.pageCategory.findFirst({
    where: { tenantId, id },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page category not found");
  }

  const updateData: any = { ...payload };
  if (payload.order !== undefined) {
    updateData.sortOrder = payload.order;
    delete updateData.order;
  }

  const result = await prisma.pageCategory.update({
    where: { id: existing.id },
    data: updateData,
  });

  return result;
};

// Delete page category
const deletePageCategoryFromDB = async (tenantId: string, id: string) => {
  const existing = await prisma.pageCategory.findFirst({
    where: { tenantId, id },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Page category not found");
  }

  await prisma.pageCategory.delete({
    where: { id: existing.id },
  });

  return { success: true };
};

export const PageServices = {
  getAllPagesFromDB,
  getEnabledPagesFromDB,
  getPageBySlugFromDB,
  createPageIntoDB,
  updatePageIntoDB,
  deletePageFromDB,
  getPageCategoriesFromDB,
  createPageCategoryIntoDB,
  updatePageCategoryIntoDB,
  deletePageCategoryFromDB,
};
