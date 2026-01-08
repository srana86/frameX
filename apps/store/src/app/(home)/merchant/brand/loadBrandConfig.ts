import { serverSideApiClient } from "@/lib/api-client";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";

export async function loadBrandConfig(): Promise<BrandConfig> {
  try {
    const client = serverSideApiClient();
    const response = await client.get("/brand-config");
    if (response.data?.data) {
      const apiConfig = response.data.data;
      return {
        ...defaultBrandConfig,
        ...apiConfig,
        logo: { ...defaultBrandConfig.logo, ...apiConfig.logo },
        favicon: { ...defaultBrandConfig.favicon, ...apiConfig.favicon },
        meta: { ...defaultBrandConfig.meta, ...apiConfig.meta },
        contact: { ...defaultBrandConfig.contact, ...apiConfig.contact },
        social: { ...defaultBrandConfig.social, ...apiConfig.social },
        footer: { ...defaultBrandConfig.footer, ...apiConfig.footer },
        theme: { ...defaultBrandConfig.theme, ...apiConfig.theme },
        currency: { ...defaultBrandConfig.currency, ...apiConfig.currency },
      } as BrandConfig;
    }
  } catch (error) {
    console.error("Error fetching brand config:", error);
  }

  return defaultBrandConfig;
}

