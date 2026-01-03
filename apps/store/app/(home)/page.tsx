import type { Metadata } from "next";

import { loadMerchantCollectionData, loadMerchantDocument } from "@/lib/merchant-data-loader";
import { getMerchantContext } from "@/lib/merchant-context";
import { createCachedFunction, CACHE_TAGS } from "@/lib/cache-helpers";
import type { Product } from "@/lib/types";
import type { ProductCategory } from "@/app/api/products/categories/route";
import type { HeroSlide } from "@/app/api/hero-slides/route";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { MobilePromoBanner } from "@/components/site/MobilePromoBanner";
import { CategoryFilters } from "@/components/site/CategoryFilters";
import { HomePageClient } from "./HomePageClient";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Home",
  description: "Browse our latest products.",
};

const MOST_LOVED_LIMIT = 8;

function mapProductDocument(d: any): Product {
  return {
    id: String(d._id),
    slug: d.slug,
    name: d.name,
    brand: d.brand,
    category: d.category,
    description: d.description ?? "",
    price: Number(d.price ?? 0),
    images: Array.isArray(d.images) ? d.images : [],
    sizes: Array.isArray(d.sizes) ? d.sizes : [],
    colors: Array.isArray(d.colors) ? d.colors : [],
    materials: Array.isArray(d.materials) ? d.materials : [],
    weight: d.weight || undefined,
    dimensions: d.dimensions || undefined,
    sku: d.sku || undefined,
    condition: d.condition || undefined,
    warranty: d.warranty || undefined,
    tags: Array.isArray(d.tags) ? d.tags : [],
    discountPercentage: d.discountPercentage !== undefined ? Number(d.discountPercentage) : undefined,
    featured: Boolean(d.featured ?? false),
    stock: d.stock !== undefined ? Number(d.stock) : undefined,
    order: d.order !== undefined ? Number(d.order) : undefined,
  };
}

const cachedCategories = createCachedFunction(
  async (_merchantCacheKey: string) => {
    const categories = await loadMerchantCollectionData<any>(
      "product_categories",
      {},
      {
        sort: { order: 1, name: 1 },
        projection: { _id: 1, id: 1, name: 1, order: 1, createdAt: 1, updatedAt: 1 },
      }
    );
    return categories.map(({ _id, ...cat }) => cat);
  },
  ["home-categories"],
  { tags: [CACHE_TAGS.CATEGORIES], revalidate: 300 }
);

const cachedProducts = createCachedFunction(
  async (_merchantCacheKey: string) => {
    const docs = await loadMerchantCollectionData<any>(
      "products",
      {},
      {
        sort: { order: 1, _id: -1 },
        limit: 300,
        projection: {
          _id: 1,
          slug: 1,
          name: 1,
          brand: 1,
          category: 1,
          description: 1,
          price: 1,
          images: 1,
          sizes: 1,
          colors: 1,
          materials: 1,
          weight: 1,
          dimensions: 1,
          sku: 1,
          condition: 1,
          warranty: 1,
          tags: 1,
          discountPercentage: 1,
          featured: 1,
          stock: 1,
          order: 1,
        },
      }
    );
    return docs.map(mapProductDocument);
  },
  ["home-products"],
  { tags: [CACHE_TAGS.PRODUCTS], revalidate: 180 }
);

const cachedHeroSlides = createCachedFunction(
  async (_merchantCacheKey: string) => {
    const slides = await loadMerchantCollectionData<any>(
      "hero_slides",
      { enabled: true },
      {
        sort: { order: 1, _id: 1 },
        projection: {
          _id: 1,
          image: 1,
          mobileImage: 1,
          title: 1,
          subtitle: 1,
          description: 1,
          buttonText: 1,
          buttonLink: 1,
          textPosition: 1,
          textColor: 1,
          overlay: 1,
          overlayOpacity: 1,
          order: 1,
          enabled: 1,
        },
      }
    );
    return slides.map((slide: any) => ({
      id: String(slide._id),
      image: slide.image,
      mobileImage: slide.mobileImage || undefined,
      title: slide.title,
      subtitle: slide.subtitle || "",
      description: slide.description || "",
      buttonText: slide.buttonText || "",
      buttonLink: slide.buttonLink || "",
      textPosition: slide.textPosition || "center",
      textColor: slide.textColor || "#ffffff",
      overlay: slide.overlay !== undefined ? slide.overlay : true,
      overlayOpacity: slide.overlayOpacity !== undefined ? slide.overlayOpacity : 0.4,
      order: slide.order || 0,
      enabled: slide.enabled !== undefined ? slide.enabled : true,
    }));
  },
  ["home-hero-slides"],
  { tags: [CACHE_TAGS.HERO_SLIDES], revalidate: 180 }
);

async function getCategories(merchantCacheKey: string): Promise<ProductCategory[]> {
  try {
    return await cachedCategories(merchantCacheKey);
  } catch {
    return [];
  }
}

async function getProducts(merchantCacheKey: string): Promise<Product[]> {
  try {
    return await cachedProducts(merchantCacheKey);
  } catch {
    return [];
  }
}

async function getHeroSlides(merchantCacheKey: string): Promise<HeroSlide[]> {
  try {
    return await cachedHeroSlides(merchantCacheKey);
  } catch {
    return [];
  }
}

const cachedMostLovedProducts = createCachedFunction(
  async (_merchantCacheKey: string) => {
    const orders = await loadMerchantCollectionData<any>(
      "orders",
      {},
      {
        projection: { items: 1, status: 1 },
      }
    );

    const productSalesCount = new Map<string, number>();

    orders.forEach((order) => {
      if (order.status === "cancelled" || !Array.isArray(order.items)) return;

      order.items.forEach((item: any) => {
        const productId = item.productId ? String(item.productId) : undefined;
        if (!productId) return;

        const quantity = Number(item.quantity ?? 1);
        productSalesCount.set(productId, (productSalesCount.get(productId) ?? 0) + quantity);
      });
    });

    const sortedProductIds = Array.from(productSalesCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productId)
      .slice(0, MOST_LOVED_LIMIT);

    const products: Product[] = [];

    for (const productId of sortedProductIds) {
      const product = await loadMerchantDocument<any>(
        "products",
        ObjectId.isValid(productId) ? { _id: new ObjectId(productId) } : { slug: productId }
      );

      if (product) {
        products.push(mapProductDocument(product));
      }
    }

    if (products.length < MOST_LOVED_LIMIT) {
      const existingIds = new Set(products.map((p) => p.id));
      const additionalProducts = await loadMerchantCollectionData<any>(
        "products",
        existingIds.size
          ? {
              _id: {
                $nin: Array.from(existingIds).map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
              },
            }
          : {},
        {
          sort: { featured: -1, order: 1, _id: -1 },
          limit: MOST_LOVED_LIMIT - products.length,
          projection: {
            _id: 1,
            slug: 1,
            name: 1,
            brand: 1,
            category: 1,
            description: 1,
            price: 1,
            images: 1,
            sizes: 1,
            colors: 1,
            materials: 1,
            weight: 1,
            dimensions: 1,
            sku: 1,
            condition: 1,
            warranty: 1,
            tags: 1,
            discountPercentage: 1,
            featured: 1,
            stock: 1,
            order: 1,
          },
        }
      );

      additionalProducts.forEach((product) => {
        products.push(mapProductDocument(product));
      });
    }

    return products.slice(0, MOST_LOVED_LIMIT);
  },
  ["home-most-loved"],
  { tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.ORDERS], revalidate: 600 }
);

async function getMostLovedProducts(merchantCacheKey: string): Promise<Product[]> {
  try {
    return await cachedMostLovedProducts(merchantCacheKey);
  } catch (error) {
    console.error("Failed to load most loved products:", error);
    return [];
  }
}

export default async function Home() {
  const merchantContext = await getMerchantContext();
  const merchantCacheKey = merchantContext?.merchant.id || "default";

  const [categories, products, heroSlides, mostLovedProducts] = await Promise.all([
    getCategories(merchantCacheKey),
    getProducts(merchantCacheKey),
    getHeroSlides(merchantCacheKey),
    getMostLovedProducts(merchantCacheKey),
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
