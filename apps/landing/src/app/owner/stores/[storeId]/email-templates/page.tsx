import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { EmailTemplatesClient } from "./EmailTemplatesClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Email Templates",
  description: "Customize email templates for your store",
};

interface EmailTemplatesPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Email Templates Page
 */
export default async function EmailTemplatesPage({ params }: EmailTemplatesPageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch email templates
  let initialTemplates: any[] = [];

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("email-templates");
    initialTemplates = (result as any) || [];
  } catch (error) {
    console.error("Failed to fetch email templates:", error);
  }

  return (
    <EmailTemplatesClient
      initialTemplates={initialTemplates}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
