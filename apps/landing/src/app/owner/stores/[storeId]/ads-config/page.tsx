import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { AdsConfigClient } from "./AdsConfigClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Ads Configuration",
  description: "Configure advertising and tracking pixels",
};

interface AdsConfigPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Ads Configuration Page
 */
export default async function AdsConfigPage({ params }: AdsConfigPageProps) {
  const { storeId } = await params;

  // Verify access - requires FULL permission
  const access = await requireStoreAccess(storeId, "FULL");

  // Fetch ads config
  let initialConfig = {
    googleAnalytics: { enabled: false, trackingId: "" },
    facebookPixel: { enabled: false, pixelId: "" },
    tiktokPixel: { enabled: false, pixelId: "" },
    googleAds: { enabled: false, conversionId: "" },
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("ads-config");
    initialConfig = { ...initialConfig, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch ads config:", error);
  }

  return (
    <AdsConfigClient
      initialConfig={initialConfig}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
