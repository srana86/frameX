import type { Metadata } from "next";
import ProductForm from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Admin · New Product",
};

export default function AdminNewProductPage() {
  return (
    <div className='w-full py-4'>
      <h1 className='mb-6 text-2xl font-semibold tracking-tight'>Create Product</h1>
      <ProductForm />
    </div>
  );
}
