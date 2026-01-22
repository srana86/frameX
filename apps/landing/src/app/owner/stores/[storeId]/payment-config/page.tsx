import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { PaymentConfigClient } from "./PaymentConfigClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Payment Configuration",
  description: "Configure payment gateways and settings",
};

interface PaymentConfigPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Payment Configuration Page
 * Configure payment gateways
 */
export default async function PaymentConfigPage({ params }: PaymentConfigPageProps) {
  const { storeId } = await params;

  // Verify access - requires FULL permission
  const access = await requireStoreAccess(storeId, "FULL");

  // Fetch payment config
  let initialConfig = {
    gateways: {
      stripe: { enabled: false, publicKey: "", secretKey: "" },
      paypal: { enabled: false, clientId: "", clientSecret: "" },
      cod: { enabled: false },
    },
    currency: "USD",
    testMode: true,
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("payment-config");
    initialConfig = { ...initialConfig, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch payment config:", error);
  }

  return (
    <PaymentConfigClient
      initialConfig={initialConfig}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
