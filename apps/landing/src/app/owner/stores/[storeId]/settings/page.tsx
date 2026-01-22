import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Store Settings",
  description: "Configure store settings and preferences",
};

interface SettingsPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Store Settings Page
 * General store configuration
 */
export default async function SettingsPage({ params }: SettingsPageProps) {
  const { storeId } = await params;

  // Verify access - requires FULL permission
  const access = await requireStoreAccess(storeId, "FULL");

  // Fetch store settings
  let initialSettings = {
    name: "",
    slug: "",
    status: "ACTIVE",
    customDomain: "",
    email: "",
    timezone: "UTC",
    language: "en",
    orderPrefix: "ORD",
    lowStockThreshold: 10,
    features: {
      enableReviews: true,
      enableWishlist: true,
      enableGuestCheckout: true,
      requireEmailVerification: false,
    },
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("settings");
    initialSettings = { ...initialSettings, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }

  return (
    <SettingsClient
      initialSettings={initialSettings}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
