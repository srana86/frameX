import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerClient } from "@/lib/server-utils";
import ProductForm from "@/components/admin/ProductForm";
import type { Product } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: "Admin · Edit Product" };
  return { title: `Edit · ${p.name}` };
}

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Edit Product
      </h1>
      <ProductForm initial={product} />
    </div>
  );
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const client = await getServerClient();
    const response = await client.get(`/products/${id}`);
    if (response.data?.data) {
      const d = response.data.data;
      return {
        id: d.id || d._id,
        slug: d.slug,
        name: d.name,
        brand: d.brand,
        category: d.category,
        description: d.description ?? "",
        price: Number(d.price ?? 0),
        buyPrice: d.buyPrice !== undefined ? Number(d.buyPrice) : undefined,
        images: Array.isArray(d.images) ? d.images : [],
        sizes: Array.isArray(d.sizes) ? d.sizes : [],
        colors: Array.isArray(d.colors) ? d.colors : [],
        materials: Array.isArray(d.materials) ? d.materials : [],
        weight: d.weight || undefined,
        dimensions: d.dimensions || undefined,
        sku: d.sku || undefined,
        condition: d.condition || undefined,
        warranty: d.warranty || undefined,
        tags: Array.isArray(d.tags) ? d.tags : [],
        discountPercentage:
          d.discountPercentage !== undefined
            ? Number(d.discountPercentage)
            : undefined,
        featured: Boolean(d.featured ?? false),
        stock: d.stock !== undefined ? Number(d.stock) : undefined,
      } as Product;
    }
  } catch (error) {
    console.error("Failed to fetch product:", error);
  }
  return null;
}
