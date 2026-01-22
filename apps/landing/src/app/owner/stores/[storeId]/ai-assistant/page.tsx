import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { AiAssistantClient } from "./AiAssistantClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "AI Assistant",
  description: "AI-powered tools for your store",
};

interface AiAssistantPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * AI Assistant Page
 * AI-powered tools for product descriptions, SEO, etc.
 */
export default async function AiAssistantPage({ params }: AiAssistantPageProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  return (
    <AiAssistantClient
      storeId={storeId}
      permission={access.permission}
    />
  );
}
