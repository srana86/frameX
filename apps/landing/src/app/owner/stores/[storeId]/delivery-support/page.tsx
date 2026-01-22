import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { DeliverySupportClient } from "./DeliverySupportClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Delivery Support",
  description: "Configure courier and delivery services",
};

interface DeliverySupportPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Delivery Support Page
 */
export default async function DeliverySupportPage({ params }: DeliverySupportPageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch delivery config
  let initialConfig = {
    providers: [] as any[],
    defaultProvider: "",
    freeShippingThreshold: 0,
    flatRate: 0,
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("delivery-support");
    initialConfig = { ...initialConfig, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch delivery config:", error);
  }

  return (
    <DeliverySupportClient
      initialConfig={initialConfig}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
