/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder, Decimal } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

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
    .include({ inventory: true })
    .execute();

  // Fetch categories for the response
  const categories = await prisma.category.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return { ...result, categories };
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
    costPrice?: number;
    comparePrice?: number;
    images?: string[];
    categoryId?: string;
    featured?: boolean;
    stock?: number;
    brand?: string;
    weight?: string;
    sku?: string;
    barcode?: string;
    metaTitle?: string;
    metaDescription?: string;
    dimensions?: any;
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
      costPrice: payload.costPrice ? new Decimal(payload.costPrice) : null,
      comparePrice: payload.comparePrice
        ? new Decimal(payload.comparePrice)
        : null,
      images: payload.images || [],
      categoryId: payload.categoryId || (payload as any).category,
      featured: payload.featured || false,
      status: "ACTIVE",
      brand: payload.brand,
      weight: payload.weight,
      sku: payload.sku,
      barcode: payload.barcode,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      dimensions: payload.dimensions,
    },
    include: { category: true, inventory: true },
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
    costPrice: number;
    comparePrice: number;
    images: string[];
    categoryId: string;
    featured: boolean;
    status: string;
    brand: string;
    weight: string;
    sku: string;
    barcode: string;
    stock: number;
    lowStockThreshold: number;
    category: string;
    metaTitle: string;
    metaDescription: string;
    dimensions: any;
  }>
) => {
  const existing = await prisma.product.findFirst({
    where: { tenantId, OR: [{ id }, { slug: id }] },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const {
    stock,
    lowStockThreshold,
    category,
    metaTitle,
    metaDescription,
    dimensions,
    ...rest
  } = payload;
  const updateData: any = { ...rest };

  if (payload.price !== undefined) {
    updateData.price = new Decimal(payload.price);
  }
  if (payload.comparePrice !== undefined) {
    updateData.comparePrice = new Decimal(payload.comparePrice);
  }
  if (payload.costPrice !== undefined) {
    updateData.costPrice = new Decimal(payload.costPrice);
  }

  if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
  if (metaDescription !== undefined)
    updateData.metaDescription = metaDescription;
  if (dimensions !== undefined) updateData.dimensions = dimensions;

  // Map category to categoryId
  if (category) {
    updateData.categoryId = category;
  }

  // Update product
  const result = await prisma.product.update({
    where: { id: existing.id },
    data: updateData,
    include: { category: true, inventory: true },
  });

  // Update inventory if stock or lowStockThreshold provided
  if (stock !== undefined || lowStockThreshold !== undefined) {
    await prisma.inventory.update({
      where: { productId: existing.id },
      data: {
        quantity: stock,
        lowStock: lowStockThreshold,
      },
    });
  }

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
      sortOrder: payload.sortOrder || (payload as any).order || 0,
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

  const { order, sortOrder, ...updateData } = payload as any;
  const finalSortOrder = sortOrder !== undefined ? sortOrder : order;

  return prisma.category.update({
    where: { id: existing.id },
    data: {
      ...updateData,
      ...(finalSortOrder !== undefined && { sortOrder: finalSortOrder }),
    },
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

// Search products
const searchProductsFromDB = async (
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
    .include({ inventory: true })
    .execute();

  return result;
};

// Update product order (bulk)
const updateProductOrder = async (
  tenantId: string,
  products: { id: string; sortOrder: number }[]
) => {
  const updates = products.map((product) =>
    prisma.product.update({
      where: { id: product.id },
      data: { sortOrder: product.sortOrder },
    })
  );

  await prisma.$transaction(updates);
  return { ok: true };
};

// Get brands (returns unique category names as the Product model doesn't have a brand field)
const getBrandsFromDB = async (tenantId: string) => {
  const categories = await prisma.category.findMany({
    where: { tenantId, isActive: true },
    select: { name: true },
    distinct: ["name"],
  });

  return categories.map((c) => c.name).filter(Boolean);
};

// Get categories with pagination
const getCategoriesFromDB = async (
  tenantId: string,
  query: Record<string, unknown>
) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.category,
    query: query,
    searchFields: ["name", "description"],
  });

  const result = await builder
    .addBaseWhere({ tenantId, isActive: true })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({ _count: { select: { products: true } } })
    .execute();

  // Map _count to productCount for the frontend
  result.data = (result.data as any[]).map((cat) => ({
    ...cat,
    productCount: cat._count?.products || 0,
  }));

  return result;
};

// Update category order (bulk)
const updateCategoryOrder = async (
  tenantId: string,
  categories: { id: string; sortOrder: number }[]
) => {
  const updates = categories.map((category) =>
    prisma.category.update({
      where: { id: category.id },
      data: { sortOrder: category.sortOrder },
    })
  );

  await prisma.$transaction(updates);
  return { ok: true };
};

// Get most loved products (by highest average rating or most reviews)
const getMostLovedProductsFromDB = async (tenantId: string, limit: number) => {
  const products = await prisma.product.findMany({
    where: { tenantId, status: "ACTIVE" },
    include: {
      category: true,
      inventory: true,
      reviews: {
        where: { approved: true },
        select: { rating: true },
      },
    },
    take: limit * 2, // Fetch more to filter/sort by reviews
  });

  // Calculate average rating and sort by it
  const productsWithRating = products
    .map((product) => {
      const reviews = product.reviews;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
      return { ...product, avgRating, reviewCount: reviews.length };
    })
    .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
    .slice(0, limit);

  return productsWithRating;
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
  searchProductsFromDB,
  updateProductOrder,
  getBrandsFromDB,
  getCategoriesFromDB,
  updateCategoryOrder,
  getMostLovedProductsFromDB,
};
