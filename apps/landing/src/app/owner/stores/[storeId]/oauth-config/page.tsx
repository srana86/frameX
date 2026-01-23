import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { OAuthConfigClient } from "./OAuthConfigClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "OAuth Configuration",
  description: "Configure social login providers",
};

interface OAuthConfigPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * OAuth Configuration Page
 */
export default async function OAuthConfigPage({ params }: OAuthConfigPageProps) {
  const { storeId } = await params;

  // Verify access - requires FULL permission
  const access = await requireStoreAccess(storeId, "FULL");

  // Fetch OAuth config
  let initialConfig = {
    google: { enabled: false, clientId: "", clientSecret: "" },
    facebook: { enabled: false, clientId: "", clientSecret: "" },
    github: { enabled: false, clientId: "", clientSecret: "" },
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("oauth-config");
    initialConfig = { ...initialConfig, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch OAuth config:", error);
  }

  return (
    <OAuthConfigClient
      initialConfig={initialConfig}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
