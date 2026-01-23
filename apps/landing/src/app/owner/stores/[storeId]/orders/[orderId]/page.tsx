import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { OrderDetailClient } from "./OrderDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Order Details",
  description: "View and manage order details",
};

interface OrderDetailPageProps {
  params: Promise<{ storeId: string; orderId: string }>;
}

/**
 * Order Detail Page
 */
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { storeId, orderId } = await params;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch order details
  let order = null;

  try {
    const storeApi = createServerStoreApiClient(storeId);
    order = await storeApi.get(`orders/${orderId}`);
  } catch (error) {
    console.error("Failed to fetch order:", error);
  }

  if (!order) {
    notFound();
  }

  return (
    <OrderDetailClient
      order={order as any}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
