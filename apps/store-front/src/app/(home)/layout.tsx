import { Suspense } from "react";
import { redirect } from "next/navigation";
import TopNav from "@/components/site/TopNav";
import AdminAwareFooter from "@/components/site/AdminAwareFooter";
import { FloatingCart } from "@/components/site/FloatingCart";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { AffiliatePromoHandler } from "@/components/site/AffiliatePromoHandler";
import { getPublicServerClient } from "@/lib/server-utils";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";

interface EnabledFooterPage {
  slug: string;
  title: string;
  category: string;
}

/**
 * Fetches brand config from API.
 * Returns null if the store is not found (STORE_NOT_FOUND error).
 * Returns defaultBrandConfig for other errors to allow graceful degradation.
 */
async function getBrandConfig(): Promise<BrandConfig | null> {
  try {
    const client = await getPublicServerClient();
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
  } catch (error: any) {
    // Check if this is a "store not found" error (404 with STORE_NOT_FOUND code)
    const status = error?.response?.status;
    const errorCode = error?.response?.data?.error;

    if (status === 404 && errorCode === "STORE_NOT_FOUND") {
      console.log("[HomeLayout] Store not found for this domain, redirecting...");
      return null; // Signal that store doesn't exist
    }

    console.error("Error fetching brand config:", error?.message || error);
  }
  return defaultBrandConfig;
}

async function getEnabledPages(): Promise<EnabledFooterPage[]> {
  try {
    const client = await getPublicServerClient();
    const response = await client.get("/pages/enabled");
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data.map((page: any) => ({
        slug: page.slug,
        title: page.title,
        category: page.category || "General",
      }));
    }
  } catch (error) {
    // Silently fail for pages - not critical
  }
  return [];
}

async function HomeLayoutContent({ children }: { children: React.ReactNode }) {
  const brandConfig = await getBrandConfig();

  // If store doesn't exist, redirect to the not found page
  if (brandConfig === null) {
    redirect("/store-not-found");
  }

  const enabledPages = await getEnabledPages();

  return (
    <>
      <AffiliatePromoHandler />
      <TopNav brandConfig={brandConfig} />
      <main className="min-h-[calc(100vh-64px-200px)] pb-safe">{children}</main>
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <HomeLayoutContent>{children}</HomeLayoutContent>
    </Suspense>
  );
}

