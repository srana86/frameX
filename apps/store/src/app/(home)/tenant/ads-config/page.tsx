import { AdsConfigClient } from "./AdsConfigClient";
import { getAdsConfig } from "@/lib/ads-config";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata = {
  title: "Tenant · Ads & Tracking Configuration",
  description: "Configure tracking pixels and analytics for your store",
};

export default async function AdsConfigPage() {
  await requireAuth("tenant");

  // Load Ads config server-side
  const adsConfig = await getAdsConfig();

  return (
    <div className='space-y-6 mt-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Ads & Tracking Configuration</h1>
        <p className='text-muted-foreground mt-2'>Configure tracking pixels, analytics, and advertising platforms for your store</p>
      </div>

      <AdsConfigClient initialConfig={adsConfig} />
    </div>
  );
}
