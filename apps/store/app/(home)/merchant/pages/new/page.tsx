import type { Metadata } from "next";
import PageForm from "@/components/admin/PageForm";

export const metadata: Metadata = {
  title: "Admin · New Page",
};

export default function AdminNewPagePage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Create New Page</h1>
      <PageForm />
    </div>
  );
}

