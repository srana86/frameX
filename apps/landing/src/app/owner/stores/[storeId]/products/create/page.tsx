import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { ProductCreateClient } from "./ProductCreateClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Create Product",
  description: "Add a new product to your store",
};

interface ProductCreatePageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Product Creation Page
 */
export default async function ProductCreatePage({ params }: ProductCreatePageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch categories
  let categories: any[] = [];

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("products/categories");
    categories = (result as any).categories || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }

  return (
    <ProductCreateClient
      categories={categories}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
