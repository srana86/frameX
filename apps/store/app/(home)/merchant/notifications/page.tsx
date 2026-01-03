import { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./NotificationsClient";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View and manage your notifications",
};

export default async function NotificationsPage() {
  const user = await requireAuth("merchant");

  if (user.role !== "merchant" && user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className='mx-auto w-full py-4'>
      <h1 className='mb-6 text-2xl font-semibold w-full tracking-tight'>Notifications</h1>
      <NotificationsClient />
    </div>
  );
}
