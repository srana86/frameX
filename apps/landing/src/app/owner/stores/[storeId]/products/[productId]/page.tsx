import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/store-auth-helpers";
import { createServerStoreApiClient } from "@/lib/store-api-client.server";
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
  let product: any | null = null;
  let categories: any[] = [];

  try {
    const storeApi = createServerStoreApiClient(storeId);
    const [productResult, categoriesResult] = await Promise.all([
      storeApi.get(`products/${productId}`),
      storeApi.get("products/categories"),
    ]);
    product = productResult;
    categories = (categoriesResult as any).categories || [];
  } catch (error) {
    console.error("Failed to fetch product:", error);
  }

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailClient

      product={{
        ...product,
        stock: product.inventory?.quantity ?? 0,
        lowStockThreshold: product.inventory?.lowStock,
        categoryId: product.categoryId || product.category?.id,
        // Ensure explicit mapping for other potentially nested or mismatched fields if needed
      } as any}
      categories={categories}
      storeId={storeId}
      permission={access.permission}
    />
  );
}
