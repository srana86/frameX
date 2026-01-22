import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { EmailSettingsClient } from "./EmailSettingsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Email Settings",
  description: "Configure email settings for your store",
};

interface EmailSettingsPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Email Settings Page
 * Configure SMTP and email settings
 */
export default async function EmailSettingsPage({ params }: EmailSettingsPageProps) {
  const { storeId } = await params;

  // Verify access - requires FULL permission
  const access = await requireStoreAccess(storeId, "FULL");

  // Fetch email settings
  let initialSettings = {
    fromName: "",
    fromEmail: "",
    replyTo: "",
    smtp: {
      host: "",
      port: 587,
      secure: false,
      username: "",
      password: "",
    },
    enabled: false,
  };

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("email-settings");
    initialSettings = { ...initialSettings, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch email settings:", error);
  }

  return (
    <EmailSettingsClient
      initialSettings={initialSettings}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
