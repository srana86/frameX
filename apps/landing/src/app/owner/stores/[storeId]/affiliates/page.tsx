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
  } = {
    affiliates: [],
    pendingWithdrawals: [],
    stats: {
      totalAffiliates: 0,
      totalEarnings: 0,
      pendingPayouts: 0,
    },
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);

    // Fetch in parallel
    const [affiliatesRes, statsRes, withdrawalsRes] = await Promise.all([
      storeApi.get("affiliates"),
      storeApi.get("affiliates/stats"),
      storeApi.get("affiliates/withdrawals?status=PENDING")
    ]);

    initialData = {
      affiliates: (affiliatesRes as any).affiliates || [],
      stats: (statsRes as any).settings || (statsRes as any) || initialData.stats, // Handle possible variations
      pendingWithdrawals: (withdrawalsRes as any).withdrawals || [],
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
