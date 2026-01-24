import { createServerStoreApiClient } from "@/lib/store-api-client.server";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";

export async function loadBrandConfig(storeId: string): Promise<BrandConfig> {
  if (!storeId) return defaultBrandConfig;

  try {
    const client = createServerStoreApiClient(storeId);
    const response = await client.get<any>("/brand-config");

    // The API now returns the data in the structured format matching BrandConfig
    if (response) {
      const apiConfig = response;
      return {
        ...defaultBrandConfig,
        ...apiConfig,
      } as BrandConfig;
    }
  } catch (error) {
    console.error(`Error fetching brand config for store ${storeId}:`, error);
  }

  return defaultBrandConfig;
}

