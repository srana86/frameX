/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { InventoryTransaction } from "./inventory.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TInventoryTransaction } from "./inventory.interface";
import { Product } from "../Product/product.model";

// Get all inventory transactions with pagination, filter, and search
const getAllInventoryTransactionsFromDB = async (
  query: Record<string, unknown>
) => {
  const transactionQuery = new QueryBuilder(InventoryTransaction.find(), query)
    .search(["productId", "productName", "orderId", "notes"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await transactionQuery.modelQuery;
  const meta = await transactionQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

// Create inventory transaction
const createInventoryTransactionIntoDB = async (
  payload: TInventoryTransaction
) => {
  // Generate ID if not provided
  if (!payload.id) {
    payload.id = `INV${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current stock
  const product = await Product.findOne({
    $or: [{ id: payload.productId }, { slug: payload.productId }],
  });

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  payload.productName = product.name;
  payload.previousStock = product.stock || 0;

  // Calculate new stock based on type
  let stockChange = 0;
  if (payload.type === "order" || payload.type === "adjustment") {
    stockChange = -payload.quantity;
  } else if (payload.type === "restock" || payload.type === "return") {
    stockChange = payload.quantity;
  }

  payload.newStock = payload.previousStock + stockChange;

  // Create transaction
  const result = await InventoryTransaction.create(payload);

  // Update product stock
  await Product.updateOne(
    { $or: [{ id: payload.productId }, { slug: payload.productId }] },
    { $set: { stock: payload.newStock } }
  );

  return result;
};

// Get inventory overview statistics
const getInventoryOverviewFromDB = async () => {
  // Query products where isDeleted is false or doesn't exist (for backward compatibility)
  const products = await Product.find({
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });

  let totalProducts = products.length;
  let totalStock = 0;
  let lowStockItems = 0;
  let outOfStockItems = 0;
  let totalValue = 0;
  const lowStockThreshold = 10;

  products.forEach((product) => {
    const stock = product.stock || 0;
    totalStock += stock;

    if (stock === 0) {
      outOfStockItems++;
    } else if (stock <= lowStockThreshold) {
      lowStockItems++;
    }

    if (product.buyPrice) {
      totalValue += stock * product.buyPrice;
    }
  });

  // Get categories with stock info
  const categories = await Product.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$category",
        totalStock: { $sum: "$stock" },
        lowStock: {
          $sum: {
            $cond: [{ $lte: ["$stock", lowStockThreshold] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        name: "$_id",
        totalStock: 1,
        lowStock: 1,
        _id: 0,
      },
    },
  ]);

  return {
    totalProducts,
    totalStock,
    lowStockItems,
    outOfStockItems,
    totalValue,
    categories,
  };
};

export const InventoryServices = {
  getAllInventoryTransactionsFromDB,
  createInventoryTransactionIntoDB,
  getInventoryOverviewFromDB,
};
