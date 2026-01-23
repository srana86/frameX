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
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            status: true,
            sku: true,
            category: { select: { name: true } },
          },
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
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
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
  id: string,
  data: { quantity?: number; lowStock?: number }
) => {
  const existing = await prisma.inventory.findFirst({
    where: { tenantId, id },
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
        select: { id: true, name: true, slug: true, images: true, sku: true },
      },
    },
  });

  return inventory.filter((inv) => inv.quantity <= inv.lowStock);
};

/**
 * Get all inventory transactions
 */
const getAllInventoryTransactionsFromDB = async (
  tenantId: string,
  query: {
    page?: number;
    limit?: number;
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  const { page = 1, limit = 20, productId, type, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.InventoryTransactionWhereInput = {
    tenantId,
    ...(productId && { productId }),
    ...(type && { type: type as any }), // Cast to enum if needed, or validate
    ...(startDate &&
      endDate && {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }),
  };

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, slug: true, images: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return {
    data: transactions,
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
  };
};

/**
 * Create inventory transaction
 */
const createInventoryTransactionIntoDB = async (
  tenantId: string,
  payload: {
    productId: string;
    type: "order" | "restock" | "adjustment" | "return";
    quantity: number;
    orderId?: string;
    notes?: string;
  }
) => {
  const { productId, type, quantity, orderId, notes } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Get current inventory
    const inventory = await tx.inventory.findUnique({
      where: {
        productId, // Assuming 1:1 relation where productId is unique per tenant? 
        // Wait, schema says `productId String @unique` on Inventory model??
        // Checking schema line 159: `productId String @unique`
        // But wait, `tenantId` is also there. If it is unique GLOBALLY that's an issue for multi-tenant if same product ID exists?
        // Actually Product ID is UUID, so it is globally unique.
      },
    });

    if (!inventory) {
      throw new AppError(StatusCodes.NOT_FOUND, "Inventory not found");
    }

    if (inventory.tenantId !== tenantId) {
      throw new AppError(StatusCodes.FORBIDDEN, "Access denied");
    }

    // 2. Calculate new stock
    let newStock = inventory.quantity;
    let change = 0; // The stored quantity in transaction (can be negative/positive)

    // Enum mapping: ORDER, RESTOCK, ADJUSTMENT, RETURN
    // Input type is lowercase string from validation?
    // Map to Prisma Enum
    let transactionType: any;

    switch (type) {
      case "order":
        if (inventory.quantity < quantity) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient stock");
        }
        newStock -= quantity;
        change = -quantity;
        transactionType = "ORDER";
        break;
      case "restock":
        newStock += quantity;
        change = quantity;
        transactionType = "RESTOCK";
        break;
      case "return":
        newStock += quantity;
        change = quantity;
        transactionType = "RETURN";
        break;
      case "adjustment":
        // If adjustment is positive, add. If negative (passed as negative quantity?), subtract?
        // Usually adjustment input might be absolute or relative.
        // Let's assume input quantity is always positive magnitude, and we need logic?
        // Or assume adjustment implies "set to" or "add/subtract"?
        // Let's assume simple implementation: adjustment adds/subtracts directly if user passes signed int?
        // Validation schema said `quantity: z.number()`.
        // Let's assume for adjustment, we just add the quantity (so user sends negative for reduction).
        newStock += quantity;
        change = quantity;
        transactionType = "ADJUSTMENT";

        // Safety check
        if (newStock < 0) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Resulting stock cannot be negative");
        }
        break;
      default:
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transaction type");
    }

    // 3. Update Inventory
    await tx.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newStock },
    });

    // 4. Create Transaction
    const transaction = await tx.inventoryTransaction.create({
      data: {
        tenantId,
        inventoryId: inventory.id,
        productId,
        type: transactionType,
        quantity: change,
        previousStock: inventory.quantity,
        newStock,
        orderId,
        notes,
      },
      include: {
        product: true,
      }
    });

    return transaction;
  });

  return result;
};

/**
 * Get inventory overview
 */
const getInventoryOverviewFromDB = async (tenantId: string) => {
  const [totalProducts, lowStockProducts, totalValue] = await Promise.all([
    prisma.inventory.count({ where: { tenantId } }),
    prisma.inventory.count({
      where: {
        tenantId,
        quantity: { lte: prisma.inventory.fields.lowStock },
      },
    }),
    // Calculate total value? Requires price from product.
    // Simplify for now or use aggregation if possible.
    // Prisma aggregation with relation is tricky.
    // Let's just return counts for now.
    Promise.resolve(0),
  ]);

  return {
    totalProducts,
    lowStockProducts,
    totalValue,
  };
};

export const InventoryServices = {
  getAllInventory,
  getProductInventory,
  updateInventory,
  adjustInventory,
  bulkUpdateInventory,
  getLowStockAlerts,
  getAllInventoryTransactionsFromDB,
  createInventoryTransactionIntoDB,
  getInventoryOverviewFromDB,
};
