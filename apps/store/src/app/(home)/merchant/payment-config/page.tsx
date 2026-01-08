import { PaymentConfigClient } from "./PaymentConfigClient";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata = {
  title: "Merchant · Payment Configuration",
  description: "Configure SSLCommerz payment gateway",
};

export default async function PaymentConfigPage() {
  await requireAuth("merchant");

  // Load SSLCommerz config server-side
  const sslcommerzConfig = await getSSLCommerzConfig();

  return (
    <div className='space-y-6 pt-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Payment Configuration</h1>
        <p className='text-muted-foreground mt-2'>Configure SSLCommerz payment gateway for online payments</p>
      </div>

      <PaymentConfigClient initialConfig={sslcommerzConfig} />
    </div>
  );
}
