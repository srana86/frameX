import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { CouponsClient } from "./CouponsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Coupons",
  description: "Manage discount coupons and promotions",
};

interface CouponsPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Coupons Page
 * Manage discount codes and promotions
 */
export default async function CouponsPage({ params }: CouponsPageProps) {
  const { storeId } = await params;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch coupons
  let initialCoupons: any[] = [];

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("coupons");
    initialCoupons = (result as any).coupons || [];
  } catch (error) {
    console.error("Failed to fetch coupons:", error);
  }

  return (
    <CouponsClient
      initialCoupons={initialCoupons}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
