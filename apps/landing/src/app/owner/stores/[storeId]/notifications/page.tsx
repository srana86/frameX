import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { NotificationsClient } from "./NotificationsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Notification Settings",
  description: "Configure notification preferences",
};

interface NotificationsPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Notification Settings Page
 */
export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch notification settings
  let initialSettings = {
    email: {
      newOrder: true,
      orderStatusChange: true,
      lowStock: true,
      newCustomer: false,
      review: false,
    },
    push: {
      newOrder: true,
      orderStatusChange: false,
      lowStock: true,
    },
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("notifications/settings");
    initialSettings = { ...initialSettings, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch notification settings:", error);
  }

  return (
    <NotificationsClient
      initialSettings={initialSettings}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
