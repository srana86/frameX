"use server";

import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { ObjectId } from "@/lib/api-helpers";
import type { Product } from "@/lib/types";
import type { InventoryTransaction, InventoryOverview } from "@/lib/types";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ProductsResponse = {
  products: Product[];
  pagination: PaginationData;
};

type TransactionsResponse = {
  transactions: InventoryTransaction[];
  pagination: PaginationData;
};

export async function getInventoryProducts(
  page: number = 1,
  limit: number = 30,
  stockFilter: "all" | "in-stock" | "low-stock" | "out-of-stock" = "all",
  search: string = "",
  lowStockThreshold: number = 10
): Promise<ProductsResponse> {
  try {
    const skip = (page - 1) * limit;
    const col = await getMerchantCollectionForAPI("products");
    const baseQuery = await buildMerchantQuery();
    let query: any = { ...baseQuery };

    // Build stock filter
    if (stockFilter === "in-stock") {
      query.stock = { $gt: lowStockThreshold };
    } else if (stockFilter === "low-stock") {
      query.stock = { $gt: 0, $lte: lowStockThreshold };
    } else if (stockFilter === "out-of-stock") {
      // For out-of-stock, we need to use $or which requires $and structure
      const outOfStockCondition = {
        $or: [{ stock: 0 }, { stock: { $exists: false } }, { stock: null }],
      };
      if (query.$and) {
        query.$and.push(outOfStockCondition);
      } else {
        query.$and = [outOfStockCondition];
      }
    }
    // "all" - no stock filter

    // Add search filter
    if (search.trim()) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchCondition = {
        $or: [{ name: searchRegex }, { sku: searchRegex }, { category: searchRegex }, { brand: searchRegex }],
      };
      if (query.$and) {
        query.$and.push(searchCondition);
      } else {
        query.$and = [searchCondition];
      }
    }

    // Get total count for pagination
    const totalCount = await col.countDocuments(query);

    // Fetch products with pagination
    const docs = (await col.find(query).sort({ order: 1, _id: -1 }).skip(skip).limit(limit).toArray()) as any[];

    const items: Product[] = docs.map((d) => ({
      id: String(d._id),
      slug: d.slug,
      name: d.name,
      brand: d.brand,
      category: d.category,
      description: d.description ?? "",
      price: Number(d.price ?? 0),
      images: Array.isArray(d.images) ? d.images : [],
      sizes: Array.isArray(d.sizes) ? d.sizes : [],
      colors: Array.isArray(d.colors) ? d.colors : [],
      materials: Array.isArray(d.materials) ? d.materials : [],
      weight: d.weight || undefined,
      dimensions: d.dimensions || undefined,
      sku: d.sku || undefined,
      condition: d.condition || undefined,
      warranty: d.warranty || undefined,
      tags: Array.isArray(d.tags) ? d.tags : [],
      discountPercentage: d.discountPercentage !== undefined ? Number(d.discountPercentage) : undefined,
      featured: Boolean(d.featured ?? false),
      stock: d.stock !== undefined ? Number(d.stock) : undefined,
      order: d.order !== undefined ? Number(d.order) : undefined,
    }));

    return {
      products: items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch inventory products:", error);
    throw new Error(error?.message || "Failed to fetch products");
  }
}

export async function getInventoryTransactions(page: number = 1, limit: number = 30, productId?: string): Promise<TransactionsResponse> {
  try {
    const skip = (page - 1) * limit;
    const transactionsCol = await getMerchantCollectionForAPI("inventory_transactions");
    const baseQuery = await buildMerchantQuery();
    let query: any = { ...baseQuery };

    if (productId && ObjectId.isValid(productId)) {
      query.productId = productId;
    }

    // Get total count for pagination
    const totalCount = await transactionsCol.countDocuments(query);

    // Fetch transactions with pagination
    const transactions = await transactionsCol.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).toArray();

    const formatted: InventoryTransaction[] = (transactions as any[]).map((t) => ({
      id: String(t._id),
      productId: t.productId,
      productName: t.productName,
      type: t.type,
      quantity: Number(t.quantity),
      previousStock: Number(t.previousStock),
      newStock: Number(t.newStock),
      reason: t.reason,
      orderId: t.orderId,
      createdAt: t.createdAt,
      createdBy: t.createdBy,
    }));

    return {
      transactions: formatted,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch inventory transactions:", error);
    throw new Error(error?.message || "Failed to fetch transactions");
  }
}

export async function getInventoryOverview(lowStockThreshold: number = 10): Promise<InventoryOverview> {
  try {
    const productsCol = await getMerchantCollectionForAPI("products");
    const query = await buildMerchantQuery();
    const allProducts = await productsCol.find(query).toArray();

    const products: Product[] = (allProducts as any[]).map((d) => ({
      id: String(d._id),
      slug: d.slug,
      name: d.name,
      brand: d.brand,
      category: d.category,
      description: d.description ?? "",
      price: Number(d.price ?? 0),
      images: Array.isArray(d.images) ? d.images : [],
      sizes: Array.isArray(d.sizes) ? d.sizes : [],
      stock: d.stock !== undefined ? Number(d.stock) : undefined,
    }));

    const productsWithStock = products.filter((p) => p.stock !== undefined && p.stock > 0);
    const productsOutOfStock = products.filter((p) => p.stock === 0 || p.stock === undefined);
    const lowStockProducts = products.filter((p) => p.stock !== undefined && p.stock > 0 && p.stock <= lowStockThreshold);

    const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);

    return {
      totalProducts: products.length,
      totalStock,
      productsWithStock: productsWithStock.length,
      productsOutOfStock: productsOutOfStock.length,
      lowStockProducts: lowStockProducts.length,
      lowStockThreshold,
      lowStockItems: lowStockProducts,
      outOfStockItems: productsOutOfStock,
    };
  } catch (error: any) {
    console.error("Failed to fetch inventory overview:", error);
    throw new Error(error?.message || "Failed to fetch overview");
  }
}

export async function adjustInventoryStock(
  productId: string,
  quantity: number,
  reason?: string,
  type: "adjustment" | "restock" = "adjustment"
) {
  try {
    const { getMerchantIdForAPI, isUsingSharedDatabase } = await import("@/lib/api-helpers");
    const productsCol = await getMerchantCollectionForAPI("products");
    const transactionsCol = await getMerchantCollectionForAPI("inventory_transactions");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    const query = ObjectId.isValid(productId) ? { ...baseQuery, _id: new ObjectId(productId) } : { ...baseQuery, slug: productId };
    const product = (await productsCol.findOne(query)) as any;

    if (!product) {
      throw new Error("Product not found");
    }

    const currentStock = Number(product.stock ?? 0);
    const adjustmentQty = Number(quantity);
    const newStock = Math.max(0, currentStock + adjustmentQty);

    // Update product stock
    await productsCol.updateOne(query, {
      $set: { stock: newStock },
    });

    // Create transaction record
    const transaction: any = {
      productId: String(product._id),
      productName: product.name,
      type,
      quantity: adjustmentQty,
      previousStock: currentStock,
      newStock,
      reason: reason || undefined,
      createdAt: new Date().toISOString(),
    };

    // Add merchantId if using shared database
    if (merchantId) {
      const useShared = await isUsingSharedDatabase();
      if (useShared) {
        transaction.merchantId = merchantId;
      }
    }

    await transactionsCol.insertOne(transaction);

    const updatedProduct = await productsCol.findOne(query);
    const formattedProduct: Product = {
      id: String(updatedProduct!._id),
      slug: updatedProduct!.slug,
      name: updatedProduct!.name,
      brand: updatedProduct!.brand,
      category: updatedProduct!.category,
      description: updatedProduct!.description ?? "",
      price: Number(updatedProduct!.price ?? 0),
      images: Array.isArray(updatedProduct!.images) ? updatedProduct!.images : [],
      sizes: Array.isArray(updatedProduct!.sizes) ? updatedProduct!.sizes : [],
      stock: updatedProduct!.stock !== undefined ? Number(updatedProduct!.stock) : undefined,
    };

    return { product: formattedProduct, transaction };
  } catch (error: any) {
    console.error("Failed to adjust inventory:", error);
    throw new Error(error?.message || "Failed to adjust inventory");
  }
}
