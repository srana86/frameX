import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { DomainClient } from "./DomainClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Domain Settings",
  description: "Configure custom domain for your store",
};

interface DomainPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Domain Settings Page
 * Configure custom domain
 */
export default async function DomainPage({ params }: DomainPageProps) {
  const { storeId } = await params;

  // Verify access - requires FULL permission
  const access = await requireStoreAccess(storeId, "FULL");

  // Fetch domain settings
  let initialSettings = {
    subdomain: "",
    customDomain: "",
    domainStatus: "PENDING",
    sslStatus: "PENDING",
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("domain");
    initialSettings = { ...initialSettings, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch domain settings:", error);
  }

  return (
    <DomainClient
      initialSettings={initialSettings}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
