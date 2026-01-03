import { serverSideApiClient } from "@/lib/api-client";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { getMerchantContext } from "@/lib/merchant-context";
import type { Product, ProductCategory, HeroSlide } from "@/lib/types";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { MobilePromoBanner } from "@/components/site/MobilePromoBanner";
import { CategoryFilters } from "@/components/site/CategoryFilters";
import { HomePageClient } from "./HomePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Home",
  description: "Browse our latest products.",
};

async function getCategories(token?: string, merchantId?: string): Promise<ProductCategory[]> {
  try {
    const client = serverSideApiClient(token, merchantId);
    const response = await client.get("/products/categories", { params: { enabled: true } });
    return response.data?.data?.categories || [];
  } catch (error) {
    console.error("Failed to load categories:", error);
    return [];
  }
}

async function getProducts(token?: string, merchantId?: string): Promise<Product[]> {
  try {
    const client = serverSideApiClient(token, merchantId);
    const response = await client.get("/products", { params: { limit: 300 } });
    return response.data?.data?.products || [];
  } catch (error) {
    console.error("Failed to load products:", error);
    return [];
  }
}

async function getHeroSlides(token?: string, merchantId?: string): Promise<HeroSlide[]> {
  try {
    const client = serverSideApiClient(token, merchantId);
    const response = await client.get("/hero-slides");
    return response.data?.data || response.data || [];
  } catch (error: any) {
    console.error("Failed to load hero slides:", error?.response?.status, error?.message);
    return [];
  }
}

async function getMostLovedProducts(token?: string, merchantId?: string): Promise<Product[]> {
  try {
    const client = serverSideApiClient(token, merchantId);
    const response = await client.get("/products/most-loved", { params: { limit: 8 } });
    return response.data?.data || [];
  } catch (error) {
    console.error("Failed to load most loved products:", error);
    return [];
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const merchantCtx = await getMerchantContext();
  const merchantId = merchantCtx?.merchant?.id;
  console.log("[Home] Resolved merchantId:", merchantId);

  const [categories, products, heroSlides, mostLovedProducts] = await Promise.all([
    getCategories(token, merchantId),
    getProducts(token, merchantId),
    getHeroSlides(token, merchantId),
    getMostLovedProducts(token, merchantId),
  ]);

  // Group products by category
  const productsByCategory = new Map<string, Product[]>();
  products.forEach((product) => {
    const category = product.category || "Uncategorized";
    if (!productsByCategory.has(category)) {
      productsByCategory.set(category, []);
    }
    productsByCategory.get(category)!.push(product);
  });

  // Sort products within each category by order
  productsByCategory.forEach((prods) => {
    prods.sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    });
  });

  // Get ordered categories
  const orderedCategories =
    categories.length > 0
      ? categories
      : Array.from(productsByCategory.keys()).map((name) => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        order: 0,
        createdAt: "",
        updatedAt: "",
      }));

  // Get first hero slide for mobile promo banner (if available)
  const promoSlide = heroSlides.length > 0 ? heroSlides[0] : null;

  return (
    <div className='bg-linear-to-b from-[#f7fbff] via-background to-[#eef4ff]'>
      <div className='mx-auto max-w-[1440px] px-4 py-4 sm:py-8 sm:px-6 lg:px-8'>
        {/* Mobile Promotional Banner - Only visible on mobile */}
        {promoSlide && (
          <div className='md:hidden mb-6'>
            <MobilePromoBanner
              title={promoSlide.title}
              subtitle={promoSlide.subtitle}
              description={promoSlide.description}
              buttonText={promoSlide.buttonText}
              buttonLink={promoSlide.buttonLink}
              image={promoSlide.mobileImage || promoSlide.image}
              textColor={promoSlide.textColor}
              overlay={promoSlide.overlay}
              overlayOpacity={promoSlide.overlayOpacity}
            />
          </div>
        )}

        {/* Desktop Hero Carousel - Only visible on desktop */}
        <div className='hidden md:block mb-8 mt-1'>
          <HeroCarousel slides={heroSlides} />
        </div>

        {/* Mobile Category Filters */}
        <div className='md:hidden mb-4'>
          <CategoryFilters categories={orderedCategories.map((cat) => ({ id: cat.id, name: cat.name }))} />
        </div>

        {/* Product Sections */}
        <HomePageClient
          categories={orderedCategories}
          productsByCategory={Object.fromEntries(productsByCategory)}
          allProducts={products}
          mostLovedProducts={mostLovedProducts}
        />
      </div>
    </div>
  );
}
