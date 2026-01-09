import type { Metadata } from "next";
import { OrderDetailsClient } from "./OrderDetailsClient";
import { requireAuth } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order Details #${id}`,
    description: `View and manage order details for order #${id}`,
  };
}

export default async function OrderDetailsPage({ params }: Props) {
  await requireAuth("merchant");
  const { id } = await params;

  // Import API helpers for server-side data fetching
  const { getMerchantCollectionForAPI, buildMerchantQuery } = await import("@/lib/api-helpers");
  const { ObjectId } = await import("@/lib/api-helpers");
  const { loadMerchantCollectionData } = await import("@/lib/merchant-data-loader");

  // Fetch order data and adjacent order IDs
  let order;
  let prevOrderId: string | null = null;
  let nextOrderId: string | null = null;

  try {
    const orders = await loadMerchantCollectionData<any>("orders", {}, { sort: { _id: -1 } });
    const currentIndex = orders.findIndex((o: any) => String(o._id) === id || o.id === id);
    const orderDoc = orders[currentIndex];

    if (!orderDoc) {
      notFound();
    }

    // Get adjacent order IDs for navigation (orders are sorted newest first)
    // Previous order = newer order (lower index), Next order = older order (higher index)
    if (currentIndex > 0) {
      prevOrderId = String(orders[currentIndex - 1]._id);
    }
    if (currentIndex < orders.length - 1) {
      nextOrderId = String(orders[currentIndex + 1]._id);
    }

    order = {
      id: String(orderDoc._id),
      customOrderId: orderDoc.customOrderId, // Custom order ID (format: BRD-XXXXXXX)
      createdAt: orderDoc.createdAt,
      status: orderDoc.status,
      orderType: orderDoc.orderType || "online", // Default to "online" if not set
      items: orderDoc.items || [],
      subtotal: Number(orderDoc.subtotal ?? 0),
      discountPercentage: orderDoc.discountPercentage !== undefined ? Number(orderDoc.discountPercentage) : undefined,
      discountAmount: orderDoc.discountAmount !== undefined ? Number(orderDoc.discountAmount) : undefined,
      vatTaxPercentage: orderDoc.vatTaxPercentage !== undefined ? Number(orderDoc.vatTaxPercentage) : undefined,
      vatTaxAmount: orderDoc.vatTaxAmount !== undefined ? Number(orderDoc.vatTaxAmount) : undefined,
      shipping: Number(orderDoc.shipping ?? 0),
      total: Number(orderDoc.total ?? 0),
      paymentMethod: orderDoc.paymentMethod,
      paymentStatus: orderDoc.paymentStatus,
      paidAmount: orderDoc.paidAmount !== undefined ? Number(orderDoc.paidAmount) : undefined,
      paymentTransactionId: orderDoc.paymentTransactionId,
      paymentValId: orderDoc.paymentValId,
      customer: orderDoc.customer,
      courier: orderDoc.courier,
      couponCode: orderDoc.couponCode,
      couponId: orderDoc.couponId,
      timeline: orderDoc.timeline || [],
      // Include fraudCheck data if available (stored during order creation)
      ...(orderDoc.fraudCheck && { fraudCheck: orderDoc.fraudCheck }),
      // Include sourceTracking data if available
      ...(orderDoc.sourceTracking && { sourceTracking: orderDoc.sourceTracking }),
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    notFound();
  }

  // Fetch products for product details
  let products: any[] = [];
  try {
    const productsData = await loadMerchantCollectionData<any>("products");
    products = productsData.map((p: any) => ({
      id: String(p._id),
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category,
      description: p.description ?? "",
      price: Number(p.price ?? 0),
      images: Array.isArray(p.images) ? p.images : [],
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      warranty: p.warranty,
      sku: p.sku,
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <OrderDetailsClient
      initialOrder={order}
      products={products}
      prevOrderId={prevOrderId}
      nextOrderId={nextOrderId}
    />
  );
}
