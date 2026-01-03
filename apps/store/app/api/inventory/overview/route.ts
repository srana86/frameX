import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { Product } from "@/lib/types";

export type InventoryOverview = {
  totalProducts: number;
  totalStock: number;
  productsWithStock: number;
  productsOutOfStock: number;
  lowStockProducts: number;
  lowStockThreshold: number;
  lowStockItems: Product[];
  outOfStockItems: Product[];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lowStockThreshold = parseInt(searchParams.get("lowStockThreshold") || "10");

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
    const lowStockProducts = products.filter(
      (p) => p.stock !== undefined && p.stock > 0 && p.stock <= lowStockThreshold
    );

    const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);

    const overview: InventoryOverview = {
      totalProducts: products.length,
      totalStock,
      productsWithStock: productsWithStock.length,
      productsOutOfStock: productsOutOfStock.length,
      lowStockProducts: lowStockProducts.length,
      lowStockThreshold,
      lowStockItems: lowStockProducts,
      outOfStockItems: productsOutOfStock,
    };

    return NextResponse.json(overview);
  } catch (error: any) {
    console.error("Failed to fetch inventory overview:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch overview" }, { status: 500 });
  }
}

