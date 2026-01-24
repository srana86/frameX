import { BrandConfigClient } from "../BrandConfigClient";
import { loadBrandConfig } from "../loadBrandConfig";

export default async function BrandSocialPage({ params }: { params: { storeId: string } }) {
  const { storeId } = await params;
  const brandConfig = await loadBrandConfig(storeId);

  return (
    <div className='max-w-4xl'>
      <BrandConfigClient
        initialConfig={brandConfig}
        initialTab='social'
        storeId={storeId}
        hideHeader={true}
      />
    </div>
  );
}
