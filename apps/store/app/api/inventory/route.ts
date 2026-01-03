import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI, isUsingSharedDatabase } from "@/lib/api-helpers";
import { ObjectId } from "mongodb";
import type { Product } from "@/lib/types";

export type InventoryTransaction = {
  id: string;
  productId: string;
  productName: string;
  type: "adjustment" | "order" | "restock" | "initial";
  quantity: number; // Positive for restock, negative for order
  previousStock: number;
  newStock: number;
  reason?: string;
  orderId?: string;
  createdAt: string;
  createdBy?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
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

    return NextResponse.json(
      {
        transactions: formatted,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch inventory transactions:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity, reason, type = "adjustment" } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: "productId and quantity are required" }, { status: 400 });
    }

    const productsCol = await getMerchantCollectionForAPI("products");
    const transactionsCol = await getMerchantCollectionForAPI("inventory_transactions");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    const query = ObjectId.isValid(productId) ? { ...baseQuery, _id: new ObjectId(productId) } : { ...baseQuery, slug: productId };
    const product = (await productsCol.findOne(query)) as any;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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

    return NextResponse.json({ product: formattedProduct, transaction });
  } catch (error: any) {
    console.error("Failed to adjust inventory:", error);
    return NextResponse.json({ error: error?.message || "Failed to adjust inventory" }, { status: 500 });
  }
}
