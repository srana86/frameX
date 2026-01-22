import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { ProfitAnalysisClient } from "./ProfitAnalysisClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Profit Analysis",
  description: "Analyze store profits and margins",
};

interface ProfitAnalysisPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Profit Analysis Page
 */
export default async function ProfitAnalysisPage({ params }: ProfitAnalysisPageProps) {
  const { storeId } = await params;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch profit data
  let initialData = {
    summary: {
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      profitMargin: 0,
    },
    byProduct: [] as any[],
    byCategory: [] as any[],
    trend: [] as any[],
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("profit-analysis");
    initialData = { ...initialData, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch profit analysis:", error);
  }

  return (
    <ProfitAnalysisClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
