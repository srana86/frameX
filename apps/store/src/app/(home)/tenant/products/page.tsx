import type { Metadata } from "next";
import Link from "next/link";
import ProductsClient from "./ProductsClient";
import { Button } from "@/components/ui/button";
import { getTenantCollectionForAPI, buildTenantQuery } from "@/lib/api-helpers";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tenant · Products",
  description: "Create, edit and delete products.",
};

async function getInitialData() {
  try {
    const col = await getTenantCollectionForAPI("products");
    const query = await buildTenantQuery();

    // Get total count
    const totalCount = await col.countDocuments(query);

    // Fetch first page (30 items)
    const limit = 30;
    const docs = (await col.find(query).sort({ order: 1, _id: -1 }).limit(limit).toArray()) as any[];

    const products: Product[] = docs.map((d) => ({
      id: String(d._id),
      slug: d.slug,
      name: d.name,
      brand: d.brand,
      category: d.category,
      description: d.description ?? "",
      price: Number(d.price ?? 0),
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
      discountPercentage: d.discountPercentage !== undefined ? Number(d.discountPercentage) : undefined,
      featured: Boolean(d.featured ?? false),
      stock: d.stock !== undefined ? Number(d.stock) : undefined,
      order: d.order !== undefined ? Number(d.order) : undefined,
    }));

    // Get unique categories
    const categories = await col.distinct("category", query);

    return {
      products,
      pagination: {
        page: 1,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: limit < totalCount,
        hasPrevPage: false,
      },
      categories: categories.filter(Boolean).sort(),
    };
  } catch (error) {
    console.error("Error fetching initial products:", error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 30,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      categories: [],
    };
  }
}

export default async function AdminProductsPage() {
  const initialData = await getInitialData();

  return (
    <div className='mx-auto w-full py-4'>
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>All Products</h1>
        <p className='text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2'>Create, edit and delete products</p>
      </div>
      <ProductsClient initialData={initialData} />
    </div>
  );
}
