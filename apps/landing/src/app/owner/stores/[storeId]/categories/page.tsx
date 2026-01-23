import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { CategoriesClient } from "./CategoriesClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Categories",
  description: "Manage product categories",
};

interface CategoriesPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Categories Page
 * Manage product categories
 */
export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { storeId } = await params;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch categories
  let initialCategories: any[] = [];

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("products/categories");
    initialCategories = (result as any).categories || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }

  return (
    <CategoriesClient
      initialCategories={initialCategories}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
