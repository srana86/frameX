import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
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
  let initialData = {
    affiliates: [],
    pendingWithdrawals: [],
    stats: {
      totalAffiliates: 0,
      totalEarnings: 0,
      pendingPayouts: 0,
    },
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("affiliates");
    initialData = { ...initialData, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch affiliates:", error);
  }

  return (
    <AffiliatesClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
