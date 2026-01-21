import { requireAuth } from "@/lib/auth-helpers";
import { SubscriptionPageClient } from "./SubscriptionPageClient";

export const metadata = {
  title: "Tenant · Subscription",
  description: "Manage your subscription and plan",
};

export default async function SubscriptionPage() {
  await requireAuth("tenant");

  return (
    <div className='space-y-6 pt-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Subscription & Billing</h1>
        <p className='text-muted-foreground mt-2'>Manage your subscription plan and billing</p>
      </div>

      <SubscriptionPageClient />
    </div>
  );
}
