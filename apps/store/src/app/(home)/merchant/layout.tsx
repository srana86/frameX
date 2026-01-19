import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { getPublicServerClient } from "@/lib/server-utils";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";
import { requireAuth } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getBrandConfig(): Promise<BrandConfig> {
  try {
    const client = await getPublicServerClient();
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

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth("customer"); // Require at least customer level (authenticated)

  // Strict role check: only MERCHANT can access this area
  // ADMIN and SUPER_ADMIN should use the dashboard app instead
  const normalizedRole = user.role.toLowerCase();
  if (normalizedRole === "admin" || normalizedRole === "super_admin") {
    // Redirect admins to the dashboard (different app)
    redirect(process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001/admin");
  }

  if (normalizedRole !== "merchant") {
    // Non-merchant, non-admin users go to account
    redirect("/account");
  }

  const brandConfig = await getBrandConfig();

  return (
    <AdminLayoutClient brandConfig={brandConfig}>{children}</AdminLayoutClient>
  );
}
