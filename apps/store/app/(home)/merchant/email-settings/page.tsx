import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { EmailSettingsClient } from "@/app/(home)/merchant/email-settings/EmailSettingsClient";

export const metadata: Metadata = {
  title: "Email Settings",
  description: "Configure SMTP/ESP providers for email delivery",
};

export default async function EmailSettingsPage() {
  const user = await requireAuth("merchant");

  if (user.role !== "merchant" && user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className='mx-auto w-full py-4'>
      <h1 className='mb-6 text-2xl font-semibold w-full tracking-tight'>Email Settings</h1>
      <EmailSettingsClient />
    </div>
  );
}
