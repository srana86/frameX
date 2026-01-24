import { BrandConfigClient } from "../BrandConfigClient";
import { loadBrandConfig } from "../loadBrandConfig";

export default async function BrandIdentityPage({ params }: { params: { storeId: string } }) {
  const { storeId } = await params;
  const brandConfig = await loadBrandConfig(storeId);

  return (
    <div className='max-w-4xl'>
      <BrandConfigClient
        initialConfig={brandConfig}
        initialTab='identity'
        storeId={storeId}
        hideHeader={true}
      />
    </div>
  );
}
