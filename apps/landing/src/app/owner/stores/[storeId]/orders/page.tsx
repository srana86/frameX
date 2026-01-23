import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { OrdersClient } from "./OrdersClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Orders",
  description: "Manage store orders",
};

interface OrdersPageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}

/**
 * Orders Page
 * Lists all orders for the store
 */
export default async function OrdersPage({
  params,
  searchParams,
}: OrdersPageProps) {
  const { storeId } = await params;
  const search = await searchParams;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch initial orders
  let initialData: {
    orders: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } = {
    orders: [],
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
    const status = search.status || "";

    const query = new URLSearchParams();
    query.set("page", page.toString());
    query.set("limit", "20");
    if (status) {
      query.set("status", status);
    }

    const result = await storeApi.getWithMeta(`orders?${query.toString()}`);
    initialData = {
      orders: Array.isArray(result.data) ? result.data : [],
      pagination: result.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  }

  return (
    <OrdersClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
