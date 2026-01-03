import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { getCollection } from "@/lib/mongodb";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";
import { requireAuth } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const BRAND_CONFIG_ID = "brand_config_v1";

async function getBrandConfig(): Promise<BrandConfig> {
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

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("merchant");

  if (user.role !== "merchant" && user.role !== "admin") {
    redirect("/");
  }

  const brandConfig = await getBrandConfig();

  return <AdminLayoutClient brandConfig={brandConfig}>{children}</AdminLayoutClient>;
}
