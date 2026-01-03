import type { Metadata } from "next";
import { DashboardClient } from "./DashboardClient";
import type { Product, Order } from "@/lib/types";
import type { ProductCategory } from "@/app/api/products/categories/route";
import { loadMerchantCollectionData } from "@/lib/merchant-data-loader";
import type { Investment } from "@/app/(home)/merchant/investments/actions";
import { loadBrandConfig } from "./brand/loadBrandConfig";

export const metadata: Metadata = {
  title: "Admin · Dashboard",
  description: "Admin dashboard overview.",
};

async function getDashboardData() {
  try {
    // Load merchant-specific data using the merchant data loader
    const [products, orders, categories, investments] = await Promise.all([
      loadMerchantCollectionData<any>("products", {}, { sort: { _id: -1 } }),
      loadMerchantCollectionData<any>("orders", {}, { sort: { _id: -1 } }),
      loadMerchantCollectionData<any>("product_categories"),
      loadMerchantCollectionData<any>("investments", {}, { sort: { createdAt: -1 } }),
    ]);

    // Transform products
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

    // Transform orders
    const ordersData: Order[] = (orders as any[]).map((d) => ({
      id: String(d._id),
      createdAt: d.createdAt,
      status: d.status,
      orderType: d.orderType || "online",
      items: d.items,
      subtotal: Number(d.subtotal ?? 0),
      discountPercentage: d.discountPercentage !== undefined ? Number(d.discountPercentage) : undefined,
      discountAmount: d.discountAmount !== undefined ? Number(d.discountAmount) : undefined,
      vatTaxPercentage: d.vatTaxPercentage !== undefined ? Number(d.vatTaxPercentage) : undefined,
      vatTaxAmount: d.vatTaxAmount !== undefined ? Number(d.vatTaxAmount) : undefined,
      shipping: Number(d.shipping ?? 0),
      total: Number(d.total ?? 0),
      paymentMethod: d.paymentMethod,
      paymentStatus: d.paymentStatus,
      paidAmount: d.paidAmount !== undefined ? Number(d.paidAmount) : undefined,
      customer: d.customer,
      courier: d.courier,
    }));

    // Transform categories
    const categoriesData: ProductCategory[] = (categories as any[]).map(({ _id, ...cat }) => cat);

    // Transform investments
    const investmentsData: Investment[] = (investments as any[]).map((d) => ({
      _id: String(d._id),
      merchantId: d.merchantId,
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
      categories: categoriesData,
      investments: investmentsData,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return {
      products: [],
      orders: [],
      categories: [],
      investments: [],
    };
  }
}

export default async function AdminDashboardPage() {
  const [data, brandConfig] = await Promise.all([getDashboardData(), loadBrandConfig()]);

  return <DashboardClient initialData={data} brandName={brandConfig.brandName} />;
}
