import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { CustomersClient } from "./CustomersClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Customers",
  description: "View and manage customer information",
};

interface CustomersPageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}

/**
 * Customers Page
 * Lists all customers for the store
 */
export default async function CustomersPage({
  params,
  searchParams,
}: CustomersPageProps) {
  const { storeId } = await params;
  const search = await searchParams;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch initial customers
  let initialData: {
    customers: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } = {
    customers: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const page = parseInt(search.page || "1", 10);

    const query = new URLSearchParams();
    query.set("page", page.toString());
    query.set("limit", "20");
    if (search.status) {
      query.set("status", search.status);
    }

    const result = await storeApi.getWithMeta(`customers?${query.toString()}`);
    initialData = {
      customers: (result.data as any).customers || [],
      pagination: result.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  } catch (error) {
    console.error("Failed to fetch customers:", error);
  }

  return (
    <CustomersClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
