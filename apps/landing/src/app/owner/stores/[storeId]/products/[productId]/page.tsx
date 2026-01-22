import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createStoreApiClient } from "@/lib/store-api-client";
import { ProductDetailClient } from "./ProductDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Product Details",
  description: "View and edit product details",
};

interface ProductDetailPageProps {
  params: Promise<{ storeId: string; productId: string }>;
}

/**
 * Product Detail/Edit Page
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { storeId, productId } = await params;

  // Verify access
  const access = await requireStoreAccess(storeId);

  // Fetch product details
  let product = null;
  let categories: any[] = [];

  try {
    const storeApi = createStoreApiClient(storeId);
    const [productResult, categoriesResult] = await Promise.all([
      storeApi.get(`products/${productId}`),
      storeApi.get("product-categories"),
    ]);
    product = productResult;
    categories = (categoriesResult as any) || [];
  } catch (error) {
    console.error("Failed to fetch product:", error);
  }

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={product as any}
      categories={categories}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
