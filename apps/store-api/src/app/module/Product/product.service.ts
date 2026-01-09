/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Decimal } from "@prisma/client/runtime/library";

// Get all products with pagination
const getAllProductsFromDB = async (
  tenantId: string,
  query: Record<string, unknown>
) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.product,
    query: query,
    searchFields: ["name", "description"],
  });

  const result = await builder
    .addBaseWhere({ tenantId, status: "ACTIVE" })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();

  return result;
};

// Get single product
const getSingleProductFromDB = async (tenantId: string, idOrSlug: string) => {
  const result = await prisma.product.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: { category: true, inventory: true },
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  return result;
};

// Create product
const createProductIntoDB = async (
  tenantId: string,
  payload: {
    name: string;
    slug?: string;
    description?: string;
    price: number;
    comparePrice?: number;
    images?: string[];
    categoryId?: string;
    featured?: boolean;
    stock?: number;
  }
) => {
  const slug =
    payload.slug ||
    payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const product = await prisma.product.create({
    data: {
      tenantId,
      name: payload.name,
      slug,
      description: payload.description,
      price: new Decimal(payload.price),
      comparePrice: payload.comparePrice
        ? new Decimal(payload.comparePrice)
        : null,
      images: payload.images || [],
      categoryId: payload.categoryId,
      featured: payload.featured || false,
      status: "ACTIVE",
    },
    include: { category: true },
  });

  // Create inventory if stock provided
  if (payload.stock !== undefined) {
    await prisma.inventory.create({
      data: {
        tenantId,
        productId: product.id,
        quantity: payload.stock,
      },
    });
  }

  return product;
};

// Update product
const updateProductIntoDB = async (
  tenantId: string,
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    price: number;
    comparePrice: number;
    images: string[];
    categoryId: string;
    featured: boolean;
    status: string;
  }>
) => {
  const existing = await prisma.product.findFirst({
    where: { tenantId, OR: [{ id }, { slug: id }] },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const updateData: any = { ...payload };
  if (payload.price !== undefined) {
    updateData.price = new Decimal(payload.price);
  }
  if (payload.comparePrice !== undefined) {
    updateData.comparePrice = new Decimal(payload.comparePrice);
  }

  const result = await prisma.product.update({
    where: { id: existing.id },
    data: updateData,
    include: { category: true, inventory: true },
  });

  return result;
};

// Delete product
const deleteProductFromDB = async (tenantId: string, id: string) => {
  const existing = await prisma.product.findFirst({
    where: { tenantId, OR: [{ id }, { slug: id }] },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  await prisma.product.update({
    where: { id: existing.id },
    data: { status: "ARCHIVED" },
  });

  return { ok: true };
};

// Get all categories
const getAllCategoriesFromDB = async (tenantId: string) => {
  return prisma.category.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
};

// Create category
const createCategoryIntoDB = async (
  tenantId: string,
  payload: {
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    sortOrder?: number;
  }
) => {
  const slug =
    payload.slug ||
    payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return prisma.category.create({
    data: {
      tenantId,
      name: payload.name,
      slug,
      description: payload.description,
      image: payload.image,
      sortOrder: payload.sortOrder || 0,
    },
  });
};

// Update category
const updateCategoryIntoDB = async (
  tenantId: string,
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    image: string;
    sortOrder: number;
    isActive: boolean;
  }>
) => {
  const existing = await prisma.category.findFirst({
    where: { tenantId, OR: [{ id }, { slug: id }] },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  return prisma.category.update({
    where: { id: existing.id },
    data: payload,
  });
};

// Delete category
const deleteCategoryFromDB = async (tenantId: string, id: string) => {
  const existing = await prisma.category.findFirst({
    where: { tenantId, OR: [{ id }, { slug: id }] },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  await prisma.category.update({
    where: { id: existing.id },
    data: { isActive: false },
  });

  return { ok: true };
};

export const ProductServices = {
  getAllProductsFromDB,
  getSingleProductFromDB,
  createProductIntoDB,
  updateProductIntoDB,
  deleteProductFromDB,
  getAllCategoriesFromDB,
  createCategoryIntoDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
