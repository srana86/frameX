import type { Metadata } from "next";
import { loadMerchantCollectionData } from "@/lib/merchant-data-loader";
import type { Product } from "@/lib/types";
import { ProductsListingClient } from "./ProductsListingClient";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse all our products with filters and search.",
};

async function getProducts(): Promise<Product[]> {
  try {
    const docs = await loadMerchantCollectionData<any>("products", {}, { sort: { order: 1, _id: -1 } });
    return docs.map((d) => ({
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
  } catch {
    return [];
  }
}

function getCategories(products: Product[]): string[] {
  const categories = new Set<string>();
  products.forEach((product) => {
    if (product.category) categories.add(product.category);
  });
  return Array.from(categories).sort();
}

function getBrands(products: Product[]): string[] {
  const brands = new Set<string>();
  products.forEach((product) => {
    if (product.brand) brands.add(product.brand);
  });
  return Array.from(brands).sort();
}

export default async function ProductsPage() {
  const products = await getProducts();
  const [categories, brands] = [getCategories(products), getBrands(products)];

  return <ProductsListingClient initialProducts={products} categories={categories} brands={brands} />;
}
