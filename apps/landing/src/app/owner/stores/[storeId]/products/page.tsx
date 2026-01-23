import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { ProductsClient } from "./ProductsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Products",
  description: "Manage store products",
};

interface ProductsPageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}

/**
 * Products Page
 * Lists all products for the store
 */
export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { storeId } = await params;
  const search = await searchParams;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch initial products
  let initialData: {
    products: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    categories: any[];
  } = {
    products: [],
    pagination: {
      page: 1,
      limit: 30,
      total: 0,
      totalPages: 0,
    },
    categories: [],
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const page = parseInt(search.page || "1", 10);
    const category = search.category || "all";

    const query = new URLSearchParams();
    query.set("page", page.toString());
    query.set("limit", "30");
    if (category !== "all") {
      query.set("category", category);
    }

    const result = await storeApi.getWithMeta(`products?${query.toString()}`);
    initialData = {
      products: ((result.data as any).products || []).map((p: any) => ({
        ...p,
        stock: p.inventory?.quantity ?? 0,
      })),
      pagination: result.meta || { page: 1, limit: 30, total: 0, totalPages: 0 },
      categories: (result.data as any).categories || [],
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }

  return (
    <ProductsClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
