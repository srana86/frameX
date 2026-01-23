import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { IpAnalyticsClient } from "./IpAnalyticsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "IP Analytics",
  description: "View visitor analytics and traffic patterns",
};

interface IpAnalyticsPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * IP Analytics Page
 */
export default async function IpAnalyticsPage({ params }: IpAnalyticsPageProps) {
  const { storeId } = await params;

  // Verify access - requires VIEW permission
  const access = await requireStoreAccess(storeId, "VIEW");

  // Fetch analytics data
  let initialData = {
    summary: {
      totalVisitors: 0,
      uniqueVisitors: 0,
      pageViews: 0,
      bounceRate: 0,
    },
    byCountry: [] as any[],
    byDevice: [] as any[],
    recentVisitors: [] as any[],
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("ip-analytics");
    initialData = { ...initialData, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch IP analytics:", error);
  }

  return (
    <IpAnalyticsClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
