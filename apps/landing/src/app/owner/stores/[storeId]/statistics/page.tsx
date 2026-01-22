import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { StatisticsClient } from "./StatisticsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Statistics",
  description: "View store analytics and performance metrics",
};

interface StatisticsPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Statistics Page
 * View store analytics and metrics
 */
export default async function StatisticsPage({ params }: StatisticsPageProps) {
  const { storeId } = await params;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch statistics
  let initialStats = {
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
    },
    revenueByPeriod: [] as { date: string; revenue: number }[],
    ordersByStatus: [] as { status: string; count: number }[],
    topProducts: [] as { id: string; name: string; sales: number; revenue: number }[],
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("statistics");
    initialStats = { ...initialStats, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
  }

  return (
    <StatisticsClient
      initialStats={initialStats}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
