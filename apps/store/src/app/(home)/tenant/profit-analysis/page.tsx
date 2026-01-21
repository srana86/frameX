import type { Metadata } from "next";
import { ProfitAnalysisClient } from "./ProfitAnalysisClient";
import type { Product, Order } from "@/lib/types";
import { loadTenantCollectionData } from "@/lib/tenant-data-loader";
import type { Investment } from "@/app/(home)/tenant/investments/actions";

export const metadata: Metadata = {
  title: "Profit Analysis",
  description: "Detailed profit analysis and breakdown",
};

async function getProfitAnalysisData() {
  try {
    const [products, orders, investments] = await Promise.all([
      loadTenantCollectionData<any>("products", {}, { sort: { _id: -1 } }),
      loadTenantCollectionData<any>("orders", {}, { sort: { _id: -1 } }),
      loadTenantCollectionData<any>("investments", {}, { sort: { createdAt: -1 } }),
    ]);

    const productsData: Product[] = (products as any[]).map((d) => ({
      id: String(d._id),
      slug: d.slug,
      name: d.name,
      brand: d.brand,
      category: d.category,
      description: d.description ?? "",
      price: Number(d.price ?? 0),
      buyPrice: d.buyPrice !== undefined ? Number(d.buyPrice) : undefined,
      images: Array.isArray(d.images) ? d.images : [],
      sizes: Array.isArray(d.sizes) ? d.sizes : [],
      featured: Boolean(d.featured ?? false),
      stock: d.stock !== undefined ? Number(d.stock) : undefined,
      order: d.order !== undefined ? Number(d.order) : undefined,
    }));

    const ordersData: Order[] = (orders as any[]).map((d) => ({
      id: String(d._id),
      createdAt: d.createdAt,
      status: d.status,
      orderType: d.orderType,
      items: d.items,
      subtotal: Number(d.subtotal ?? 0),
      shipping: Number(d.shipping || 0),
      total: Number(d.total ?? 0),
      paymentMethod: d.paymentMethod,
      paymentStatus: d.paymentStatus,
      customer: d.customer,
      discountAmount: d.discountAmount,
      discountPercentage: d.discountPercentage,
      courier: d.courier, // Include courier info for status categorization
    }));

    const investmentsData: Investment[] = (investments as any[]).map((d) => ({
      _id: String(d._id),
      tenantId: d.tenantId,
      key: d.key,
      value: Number(d.value ?? 0),
      category: d.category,
      notes: d.notes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return {
      products: productsData,
      orders: ordersData,
      investments: investmentsData,
    };
  } catch (error) {
    console.error("Failed to fetch profit analysis data:", error);
    return {
      products: [],
      orders: [],
      investments: [],
    };
  }
}

export default async function ProfitAnalysisPage() {
  const data = await getProfitAnalysisData();

  return (
    <div className='space-y-6 mt-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Profit Analysis</h1>
        <p className='text-muted-foreground mt-2'>Detailed breakdown of revenue, costs, and profit margins</p>
      </div>
      <ProfitAnalysisClient initialData={data} />
    </div>
  );
}
