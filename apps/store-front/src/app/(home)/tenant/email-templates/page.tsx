import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { EmailTemplatesClient } from "./EmailTemplatesClient";

export const metadata: Metadata = {
  title: "Email Templates",
  description: "Manage transactional email templates",
};

export default async function EmailTemplatesPage() {
  const user = await requireAuth("tenant");

  if (user.role !== "tenant" && user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className='mx-auto w-full py-4'>
      <h1 className='mb-6 text-2xl font-semibold w-full tracking-tight'>Email Templates</h1>
      <EmailTemplatesClient />
    </div>
  );
}
