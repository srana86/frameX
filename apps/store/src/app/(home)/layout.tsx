import { Suspense } from "react";
import TopNav from "@/components/site/TopNav";
import AdminAwareFooter from "@/components/site/AdminAwareFooter";
import { FloatingCart } from "@/components/site/FloatingCart";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { AffiliatePromoHandler } from "@/components/site/AffiliatePromoHandler";
import { serverSideApiClient } from "@/lib/api-client";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";

interface EnabledFooterPage {
  slug: string;
  title: string;
  category: string;
}

async function getBrandConfig(): Promise<BrandConfig> {
  try {
    const client = serverSideApiClient();
    const response = await client.get("/brand-config");
    if (response.data?.data) {
      // Merge with defaultBrandConfig to ensure all required fields are present
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

async function getEnabledPages(): Promise<EnabledFooterPage[]> {
  try {
    const client = serverSideApiClient();
    const response = await client.get("/pages/enabled");
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data.map((page: any) => ({
        slug: page.slug,
        title: page.title,
        category: page.category || "General",
      }));
    }
  } catch (error) {
    console.error("Error fetching enabled pages:", error);
  }
  return [];
}

async function HomeLayoutContent({ children }: { children: React.ReactNode }) {
  const [brandConfig, enabledPages] = await Promise.all([getBrandConfig(), getEnabledPages()]);

  return (
    <>
      <AffiliatePromoHandler />
      <TopNav brandConfig={brandConfig} />
      <main className='min-h-[calc(100vh-64px-200px)] pb-safe'>{children}</main>
      <AdminAwareFooter brandConfig={brandConfig} enabledPages={enabledPages} />
      <FloatingCart />
      <MobileBottomNav />
    </>
  );
}

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-muted-foreground'>Loading...</div>
        </div>
      }
    >
      <HomeLayoutContent>{children}</HomeLayoutContent>
    </Suspense>
  );
}
