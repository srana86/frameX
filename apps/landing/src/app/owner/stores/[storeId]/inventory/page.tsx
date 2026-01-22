import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
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
  let initialData = {
    products: [],
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("inventory");
    initialData = result as any;
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
