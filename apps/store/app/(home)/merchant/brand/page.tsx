import { BrandConfigClient } from "./BrandConfigClient";
import { loadBrandConfig } from "./loadBrandConfig";

export default async function BrandConfigPage() {
  // Load brand config server-side first
  const brandConfig = await loadBrandConfig();

  return (
    <div className='space-y-6 py-4'>
      <BrandConfigClient initialConfig={brandConfig} initialTab='identity' />
    </div>
  );
}
