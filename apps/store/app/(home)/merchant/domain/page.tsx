import { requireAuth } from "@/lib/auth-helpers";
import { DomainClient } from "./DomainClient";
import { getDomainConfiguration } from "@/lib/domain-service";
import { getMerchantDeployment } from "@/lib/merchant-helpers";

export const metadata = {
  title: "Merchant · Domain",
  description: "Configure your custom domain",
};

export default async function DomainPage() {
  const user = await requireAuth("merchant");

  // Use merchantId if available (links to deployment), otherwise fall back to user.id
  const merchantId = user.merchantId || user.id;

  const [domainConfig, deployment] = await Promise.all([getDomainConfiguration(merchantId), getMerchantDeployment(merchantId)]);

  console.log(`[Domain Page] merchantId: ${merchantId}, domainConfig:`, domainConfig ? "found" : "null");

  return (
    <div className='space-y-6 mt-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Custom Domain</h1>
        <p className='text-muted-foreground mt-2'>Configure your custom domain for your store</p>
      </div>

      <DomainClient domainConfig={domainConfig} deployment={deployment} />
    </div>
  );
}
