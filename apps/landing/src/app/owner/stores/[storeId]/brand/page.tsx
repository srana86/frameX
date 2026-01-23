import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { BrandConfigClient } from "./BrandConfigClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Brand Configuration",
  description: "Configure store branding and identity",
};

interface BrandPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Brand Configuration Page
 * Configure store branding (affects store-front only, NOT admin UI)
 */
export default async function BrandPage({ params }: BrandPageProps) {
  const { storeId } = await params;

  // Verify access - requires FULL permission
  const access = await requireStoreAccess(storeId, "FULL");

  // Fetch initial brand config
  let initialConfig = {
    brandName: "",
    tagline: "",
    logo: { light: "", dark: "" },
    favicon: { url: "" },
    meta: { title: "", description: "", keywords: "" },
    contact: { email: "", phone: "", address: "" },
    social: {},
    footer: { copyright: `© ${new Date().getFullYear()} Store. All rights reserved.` },
    theme: { primaryColor: "#000000", secondaryColor: "#ffffff" },
    currency: { code: "USD", symbol: "$", position: "before" },
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("brand-config");
    initialConfig = { ...initialConfig, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch brand config:", error);
  }

  return (
    <BrandConfigClient
      initialConfig={initialConfig}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
