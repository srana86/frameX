import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { AffiliatesClient } from "./AffiliatesClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Affiliates",
  description: "Manage affiliate program",
};

interface AffiliatesPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Affiliates Page
 * Manage affiliate program
 */
export default async function AffiliatesPage({ params }: AffiliatesPageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch affiliates
  let initialData: {
    affiliates: any[];
    pendingWithdrawals: any[];
    stats: { totalAffiliates: number; totalEarnings: number; pendingPayouts: number };
    settings: any;
  } = {
    affiliates: [],
    pendingWithdrawals: [],
    stats: {
      totalAffiliates: 0,
      totalEarnings: 0,
      pendingPayouts: 0,
    },
    settings: {},
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);

    // Fetch in parallel
    const [affiliatesRes, statsRes, withdrawalsRes, settingsRes] = await Promise.all([
      storeApi.get("affiliates"),
      storeApi.get("affiliates/stats"),
      storeApi.get("affiliates/withdrawals?status=PENDING"),
      storeApi.get("affiliate/settings")
    ]);

    initialData = {
      affiliates: (affiliatesRes as any).data || (affiliatesRes as any).affiliates || [],
      stats: (statsRes as any).data || (statsRes as any).settings || (statsRes as any) || initialData.stats,
      pendingWithdrawals: (withdrawalsRes as any).data?.withdrawals || (withdrawalsRes as any).withdrawals || [],
      settings: (settingsRes as any).data?.settings || (settingsRes as any).settings || {},
    };

    // If stats are wrapped in an object, extract them
    if ((statsRes as any).data) {
      initialData.stats = (statsRes as any).data;
    }
  } catch (error) {
    console.error("Failed to fetch affiliates data:", error);
  }

  return (
    <AffiliatesClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
