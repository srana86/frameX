import { requireAuth } from "@/lib/auth-helpers";
import { DomainClient } from "./DomainClient";
import { getDomainConfiguration } from "@/lib/domain-service";
import { getTenantDeployment } from "@/lib/tenant-helpers";

export const metadata = {
  title: "Tenant · Domain",
  description: "Configure your custom domain",
};

export default async function DomainPage() {
  const user = await requireAuth("tenant");

  // Use tenantId if available (links to deployment), otherwise fall back to user.id
  const tenantId = user.tenantId || user.id;

  const [domainConfig, deployment] = await Promise.all([getDomainConfiguration(tenantId), getTenantDeployment(tenantId)]);

  console.log(`[Domain Page] tenantId: ${tenantId}, domainConfig:`, domainConfig ? "found" : "null");

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
