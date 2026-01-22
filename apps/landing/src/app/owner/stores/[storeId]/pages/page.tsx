import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { PagesClient } from "./PagesClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Content Pages",
  description: "Manage store content pages",
};

interface ContentPagesProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Content Pages
 * Manage store pages like About, Contact, FAQ, etc.
 */
export default async function ContentPages({ params }: ContentPagesProps) {
  const { storeId } = await params;

  // Verify access - requires EDIT permission
  const access = await requireStoreAccess(storeId, "EDIT");

  // Fetch pages
  let initialPages: any[] = [];

  try {
    const storeApi = createStoreApiClient(storeId);
    const result = await storeApi.get("pages");
    initialPages = (result as any) || [];
  } catch (error) {
    console.error("Failed to fetch pages:", error);
  }

  return (
    <PagesClient
      initialPages={initialPages}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
