import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { PaymentsClient } from "./PaymentsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Payments",
  description: "View payment transactions",
};

interface PaymentsPageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}

/**
 * Payments Page
 * View payment transactions
 */
export default async function PaymentsPage({
  params,
  searchParams,
}: PaymentsPageProps) {
  const { storeId } = await params;
  const search = await searchParams;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch payments
  let initialData: {
    payments: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } = {
    payments: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const page = parseInt(search.page || "1", 10);
    const query = new URLSearchParams();
    query.set("page", page.toString());
    query.set("limit", "20");
    if (search.status) query.set("status", search.status);

    const result = await storeApi.getWithMeta(`payments?${query.toString()}`);
    initialData = {
      payments: result.data as any[],
      pagination: result.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  } catch (error) {
    console.error("Failed to fetch payments:", error);
  }

  return (
    <PaymentsClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
