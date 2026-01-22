import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Store Dashboard",
  description: "Store overview and analytics",
};

interface DashboardPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Store Dashboard Page
 * Shows overview and analytics for a specific store
 */
export default async function StoreDashboardPage({
  params,
}: DashboardPageProps) {
  const { storeId } = await params;

  // Verify access
  await requireStoreAccess(storeId);

  // Fetch dashboard data
  let dashboardData = {
    stats: {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      totalCustomers: 0,
      pendingOrders: 0,
      lowStockItems: 0,
    },
    recentOrders: [],
    topProducts: [],
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    dashboardData = await storeApi.get("statistics");
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Continue with empty data - store-server may not be running or user not authorized
  }

  return <DashboardClient initialData={dashboardData} storeId={storeId} />;
}
