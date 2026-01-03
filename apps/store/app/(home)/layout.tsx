import { Suspense } from "react";
import TopNav from "@/components/site/TopNav";
import AdminAwareFooter from "@/components/site/AdminAwareFooter";
import { FloatingCart } from "@/components/site/FloatingCart";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { AffiliatePromoHandler } from "@/components/site/AffiliatePromoHandler";
import { getCollection } from "@/lib/mongodb";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";

interface EnabledFooterPage {
  slug: string;
  title: string;
  category: string;
}

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

async function getEnabledPages(): Promise<EnabledFooterPage[]> {
  try {
    const col = await getCollection("footer_pages");
    const pages = await col.find({ enabled: true }).sort({ category: 1, title: 1 }).toArray();
    return pages.map((page: any) => ({
      slug: page.slug,
      title: page.title,
      category: page.category || "General",
    }));
  } catch (error) {
    console.error("Error fetching enabled pages:", error);
    return [];
  }
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
