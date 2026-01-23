import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { SubscriptionClient } from "./SubscriptionClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Subscription",
  description: "Manage your store subscription",
};

interface SubscriptionPageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * Subscription Management Page
 */
export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { storeId } = await params;

  // Verify access - requires FULL permission
  const access = await requireStoreAccess(storeId, "FULL");

  // Fetch subscription data
  let initialData = {
    plan: "FREE",
    status: "ACTIVE",
    features: [] as string[],
    limits: {
      products: 10,
      orders: 100,
      storage: "100MB",
    },
    usage: {
      products: 0,
      orders: 0,
      storage: "0MB",
    },
    billingCycle: null as string | null,
    nextBillingDate: null as string | null,
    price: 0,
  };

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const result = await storeApi.get("subscription");
    initialData = { ...initialData, ...(result as any) };
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
  }

  return (
    <SubscriptionClient
      initialData={initialData}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
