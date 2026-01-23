import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { InventoryClient } from "./InventoryClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Inventory",
  description: "Manage product inventory and stock levels",
};

interface InventoryPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Inventory Page
 * Manage product stock levels
 */
export default async function InventoryPage({ params }: InventoryPageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch initial inventory data
  let initialData: {
    products: any[];
    lowStockCount: number;
    outOfStockCount: number;
  } = {
    products: [],
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.getWithMeta("inventory/products");

    // Calculate stats from the fetched products
    // Api returns Inventory[], map to InventoryProduct[] (flattening product details)
    const rawInventory = (result.data as any).products || [];
    const products = rawInventory.map((inv: any) => ({
      id: inv.id, // Use Inventory ID for patching
      name: inv.product?.name || "Unknown Product",
      sku: inv.product?.sku,
      category: inv.product?.category?.name || "Uncategorized",
      stock: inv.quantity,
      lowStockThreshold: inv.lowStock,
    }));

    const lowStockCount = products.filter(
      (p: any) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)
    ).length;
    const outOfStockCount = products.filter((p: any) => p.stock === 0).length;

    initialData = {
      products,
      lowStockCount,
      outOfStockCount,
    };
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
  }

  return (
    <InventoryClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
