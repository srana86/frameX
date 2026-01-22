import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { InvestmentsClient } from "./InvestmentsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Investments",
  description: "Track business investments and expenses",
};

interface InvestmentsPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Investments Page
 * Track business investments and ROI
 */
export default async function InvestmentsPage({ params }: InvestmentsPageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch investments data
  let initialData = {
    investments: [] as any[],
    summary: {
      totalInvested: 0,
      totalReturns: 0,
      roi: 0,
    },
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("investments");
    initialData = { ...initialData, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch investments:", error);
  }

  return (
    <InvestmentsClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
