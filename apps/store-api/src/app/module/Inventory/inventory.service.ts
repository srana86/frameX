/**
 * Inventory Service - Prisma Version
 * Multi-tenant inventory operations
 */

import { prisma, Prisma } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

/**
 * Get inventory for all products
 */
const getAllInventory = async (
  tenantId: string,
  query: { page?: number; limit?: number; lowStock?: boolean }
) => {
  const { page = 1, limit = 20, lowStock } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.InventoryWhereInput = {
    tenantId,
    ...(lowStock && {
      // Prisma doesn't support comparing two columns directly in `where` easily without raw query
      // However, we can fetch and filter or use raw query if critical.
      // For now, we'll fetch all and filter in memory if lowStock is true, or improve query later.
    }),
  };

  const [inventory, total] = await Promise.all([
    prisma.inventory.findMany({
      where: { tenantId },
      include: {
        product: {
          select: { id: true, name: true, slug: true, images: true, status: true },
        },
      },
      orderBy: { quantity: "asc" },
      skip,
      take: limit,
    }),
    prisma.inventory.count({ where: { tenantId } }),
  ]);

  // Filter low stock in memory 
  const filtered = lowStock
    ? inventory.filter((inv) => inv.quantity <= inv.lowStock)
    : inventory;

  return {
    data: filtered,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get inventory for single product
 */
const getProductInventory = async (tenantId: string, productId: string) => {
  const inventory = await prisma.inventory.findFirst({
    where: { tenantId, productId },
    include: {
      product: true,
    },
  });

  if (!inventory) {
    throw new AppError(StatusCodes.NOT_FOUND, "Inventory not found");
  }

  return inventory;
};

/**
 * Update inventory quantity
 */
const updateInventory = async (
  tenantId: string,
  productId: string,
  data: { quantity?: number; lowStock?: number }
) => {
  const existing = await prisma.inventory.findFirst({
    where: { tenantId, productId },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Inventory not found");
  }

  return prisma.inventory.update({
    where: { id: existing.id },
    data,
    include: { product: true },
  });
};

/**
 * Adjust inventory (add or subtract)
 */
const adjustInventory = async (
  tenantId: string,
  productId: string,
  adjustment: number,
  reason?: string
) => {
  const existing = await prisma.inventory.findFirst({
    where: { tenantId, productId },
  });

  if (!existing) {
    throw new AppError(StatusCodes.NOT_FOUND, "Inventory not found");
  }

  const newQuantity = existing.quantity + adjustment;

  if (newQuantity < 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient inventory");
  }

  return prisma.inventory.update({
    where: { id: existing.id },
    data: { quantity: newQuantity },
    include: { product: true },
  });
};

/**
 * Bulk update inventory
 */
const bulkUpdateInventory = async (
  tenantId: string,
  updates: Array<{ productId: string; quantity: number }>
) => {
  const results = await Promise.all(
    updates.map(async (update) => {
      try {
        return await prisma.inventory.updateMany({
          where: { tenantId, productId: update.productId },
          data: { quantity: update.quantity },
        });
      } catch (error) {
        return { productId: update.productId, error: "Update failed" };
      }
    })
  );

  return results;
};

/**
 * Get low stock alerts
 */
const getLowStockAlerts = async (tenantId: string) => {
  const inventory = await prisma.inventory.findMany({
    where: { tenantId },
    include: {
      product: {
        select: { id: true, name: true, slug: true, images: true },
      },
    },
  });

  return inventory.filter((inv) => inv.quantity <= inv.lowStock);
};

export const InventoryServices = {
  getAllInventory,
  getProductInventory,
  updateInventory,
  adjustInventory,
  bulkUpdateInventory,
  getLowStockAlerts,
};
