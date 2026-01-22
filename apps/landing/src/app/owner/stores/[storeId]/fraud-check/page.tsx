import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { FraudCheckClient } from "./FraudCheckClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Fraud Check",
  description: "Review and manage fraud detection",
};

interface FraudCheckPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Fraud Check Page
 */
export default async function FraudCheckPage({ params }: FraudCheckPageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch fraud data
  let initialData = {
    settings: {
      enabled: true,
      autoBlock: false,
      riskThreshold: 70,
    },
    flaggedOrders: [] as any[],
    blockedIps: [] as string[],
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("fraud-check");
    initialData = { ...initialData, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch fraud data:", error);
  }

  return (
    <FraudCheckClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
