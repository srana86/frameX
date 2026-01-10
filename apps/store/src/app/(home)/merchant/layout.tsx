import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { serverSideApiClient } from "@/lib/api-client";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";
import { requireAuth } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getBrandConfig(): Promise<BrandConfig> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
    const domain = host.split(":")[0];

    const client = serverSideApiClient(undefined, undefined, domain);
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

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth("merchant");

  if (user.role !== "merchant" && user.role !== "admin") {
    redirect("/");
  }

  const brandConfig = await getBrandConfig();

  return <AdminLayoutClient brandConfig={brandConfig}>{children}</AdminLayoutClient>;
}
