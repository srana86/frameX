import { getCollection } from "@/lib/mongodb";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";

const BRAND_CONFIG_ID = "brand_config_v1";

export async function loadBrandConfig(): Promise<BrandConfig> {
  try {
    const col = await getCollection("brand_config");
    const doc = await col.findOne({ id: BRAND_CONFIG_ID });
    if (doc) {
      const { _id, ...config } = doc;
      return config as BrandConfig;
    }
  } catch (error) {
    console.error("Error fetching brand config:", error);
  }

  return defaultBrandConfig;
}
