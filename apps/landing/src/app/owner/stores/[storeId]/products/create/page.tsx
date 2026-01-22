import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
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
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("product-categories");
    categories = (result as any) || [];
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
