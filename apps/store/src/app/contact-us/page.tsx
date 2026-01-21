import type { Metadata } from "next";
import { loadTenantDocument } from "@/lib/tenant-data-loader";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";
import { ContactUsClient } from "./ContactUsClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with us. We'd love to hear from you!",
};

async function getBrandConfig(): Promise<BrandConfig> {
  try {
    const doc = await loadTenantDocument<any>("brand_config", { id: "brand_config_v1" });
    if (doc) {
      const { _id, ...config } = doc;
      return config as BrandConfig;
    }
  } catch (error) {
    console.error("Error fetching brand config:", error);
  }
  return defaultBrandConfig;
}

export default async function ContactUsPage() {
  const brandConfig = await getBrandConfig();

  return <ContactUsClient brandConfig={brandConfig} />;
}
