import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, StarHalf, Truck, Shield, RotateCcw } from "lucide-react";

import { loadTenantDocument, loadTenantCollectionData } from "@/lib/tenant-data-loader";
import type { Product } from "@/lib/types";
import { AddToCart } from "@/components/site/AddToCart";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductReviews } from "@/components/site/ProductReviews";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteBreadcrumb } from "@/components/site/Breadcrumb";
import { ProductDetailsWrapper } from "@/components/site/ProductDetailsWrapper";
import { ProductViewers } from "@/components/site/ProductViewers";

import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";
import { formatPriceFromConfig } from "@/lib/currency";

// In this project Next.js provides params as a Promise (per PPR),
// so we need to await it to read the slug.
type Props = { params: Promise<{ slug: string }> };

type Review = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  date: string;
  verified: boolean;
  review: string;
  avatarColor: string;
  images: string[];
};

// Helper function to normalize slug (matches the slugify function used in ProductsClient)
function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // Decode URL-encoded slug (Next.js should do this automatically, but be safe)
    const decodedSlug = decodeURIComponent(slug);

    // Try exact match first (as stored in DB)
    let d = await loadTenantDocument<any>("products", { slug: decodedSlug });

    // If not found, try with normalized slug (spaces to hyphens, lowercase)
    if (!d) {
      const normalizedSlug = normalizeSlug(decodedSlug);
      d = await loadTenantDocument<any>("products", { slug: normalizedSlug });
    }

    // If still not found, try with original slug (in case it wasn't encoded)
    if (!d) {
      d = await loadTenantDocument<any>("products", { slug: slug });
    }

    // If still not found, try normalized version of original slug
    if (!d) {
      const normalizedOriginal = normalizeSlug(slug);
      d = await loadTenantDocument<any>("products", { slug: normalizedOriginal });
    }

    // Last resort: case-insensitive search across all products
    if (!d) {
      const allProducts = await loadTenantCollectionData<any>("products", {});
      d = allProducts.find(
        (p: any) =>
          p.slug?.toLowerCase() === decodedSlug.toLowerCase() ||
          p.slug?.toLowerCase() === slug.toLowerCase() ||
          p.slug?.toLowerCase() === normalizeSlug(decodedSlug) ||
          p.slug?.toLowerCase() === normalizeSlug(slug)
      );
    }

    if (d) {
      return {
        id: String(d._id),
        slug: d.slug,
        name: d.name,
        brand: d.brand,
        category: typeof d.category === "object" ? d.category?.name || d.category?.label || "General" : d.category || "General",
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
      };
    }
  } catch (error) {
    console.error("Error fetching product:", error);
  }
  return null;
}

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

async function getProductReviews(slug: string): Promise<Review[]> {
  try {
    const reviews = await loadTenantCollectionData<any>("reviews", { productSlug: slug }, { sort: { createdAt: -1 } });

    return reviews.map((r) => ({
      id: String(r._id),
      name: r.name,
      initials:
        r.initials ||
        r.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      rating: Number(r.rating ?? 5),
      date:
        r.date ||
        (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Just now"),
      verified: Boolean(r.verified ?? false),
      review: r.review || r.text || "",
      avatarColor: r.avatarColor || "from-primary/20 to-accent/20",
      images: Array.isArray(r.images) ? r.images : [],
    }));
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}

async function getRelatedProducts(product: Product): Promise<Product[]> {
  try {
    const related = await loadTenantCollectionData<any>("products", product.category ? { category: product.category } : {}, {
      limit: 12,
    });

    return related
      .filter((p: any) => p.slug !== product.slug)
      .slice(0, 4)
      .map((p: any) => ({
        id: String(p._id),
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description ?? "",
        price: Number(p.price ?? 0),
        images: Array.isArray(p.images) ? p.images : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        colors: Array.isArray(p.colors) ? p.colors : [],
        materials: Array.isArray(p.materials) ? p.materials : [],
        weight: p.weight || undefined,
        dimensions: p.dimensions || undefined,
        sku: p.sku || undefined,
        condition: p.condition || undefined,
        warranty: p.warranty || undefined,
        tags: Array.isArray(p.tags) ? p.tags : [],
        discountPercentage: p.discountPercentage !== undefined ? Number(p.discountPercentage) : undefined,
        featured: Boolean(p.featured ?? false),
        stock: p.stock !== undefined ? Number(p.stock) : undefined,
      }));
  } catch (error) {
    console.error("Failed to fetch related products:", error);
    return [];
  }
}

export default async function ProductDetailsClient({ params }: Props) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [allReviews, brandConfig, relatedProducts] = await Promise.all([
    getProductReviews(slug),
    getBrandConfig(),
    getRelatedProducts(product),
  ]);

  const gallery = product.images?.length ? product.images : ["/file.svg"];
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  // Calculate average rating from real reviews
  const totalRating = allReviews.length > 0 ? allReviews.reduce((sum, review) => sum + review.rating, 0) : 0;
  const averageRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : "0.0";
  const averageRatingNum = parseFloat(averageRating);
  const fullStars = Math.floor(averageRatingNum);
  const hasHalfStar = averageRatingNum % 1 >= 0.5;
  const finalPrice =
    product.discountPercentage && product.discountPercentage > 0 ? product.price * (1 - product.discountPercentage / 100) : product.price;
  const savings = product.discountPercentage && product.discountPercentage > 0 ? product.price - finalPrice : 0;
  const specPills = [
    product.sku && `SKU: ${product.sku}`,
    product.weight && `Weight: ${product.weight}`,
    product.dimensions && `Size: ${product.dimensions}`,
    product.warranty && `Warranty: ${product.warranty}`,
    product.condition && `Condition: ${product.condition}`,
    product.materials?.length ? `Materials: ${product.materials.slice(0, 3).join(", ")}` : null,
  ].filter(Boolean) as string[];
  const highlightTags = product.tags?.length
    ? product.tags.slice(0, 4)
    : ["Crafted for comfort", "Everyday ready", "Quality tested", "Hassle-free support"];
  const benefitBullets = [
    product.materials?.length
      ? `Premium build: ${product.materials.slice(0, 2).join(", ")}`
      : "Premium build that holds shape wear after wear",
    product.weight ? `Lightweight feel at ${product.weight}` : "Lightweight feel for all-day wear",
    product.warranty ? `Backed by ${product.warranty}` : "Protected with support and an easy warranty",
  ];
  const reviewsToShow = allReviews.slice(0, 4);
  const hasRichDescription = !!product.description?.includes("<");
  const shippingLabel = isOutOfStock ? "Restocking soon" : "";
  const currencyCode = brandConfig?.currency?.iso || "USD";

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    {
      label: product.category || "Products",
      href: product.category ? `/products?category=${encodeURIComponent(product.category)}` : "/products",
    },
    { label: product.name },
  ];

  return (
    <ProductDetailsWrapper product={product} currencyCode={currencyCode}>
      <div className='bg-linear-to-b from-[#f7fbff] via-background to-[#eef4ff]'>
        <div className='mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
          {/* Breadcrumb */}
          <div className='mb-4 sm:mb-6'>
            <SiteBreadcrumb items={breadcrumbItems} />
          </div>

          <div className='space-y-4 sm:space-y-6 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:items-start'>
            {/* Product Gallery - Always first */}
            <div className='lg:col-span-1'>
              <div className='-mx-4 sm:mx-0'>
                <ProductGallery images={gallery} productName={product.name} />
              </div>
            </div>

            {/* Product Details - Below gallery on mobile, right side on desktop */}
            <div className='lg:col-start-2 lg:sticky lg:top-24'>
              <div className='rounded-2xl border border-border bg-card p-4 md:p-6 space-y-4 md:space-y-5'>
                {/* Category + Stock - Compact on mobile */}
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <span className='text-muted-foreground'>{product.category || "Product"}</span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${isOutOfStock
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}
                  >
                    {isOutOfStock ? "Waitlist" : "In Stock"}
                  </span>
                </div>

                {/* Product Title */}
                <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-foreground leading-tight'>{product.name}</h1>

                {/* Ratings - More compact */}
                <div className='flex items-center justify-between gap-2 flex-wrap'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <div className='flex items-center gap-0.5'>
                      {Array.from({ length: 5 }).map((_, i) => {
                        if (i < fullStars) return <Star key={i} className='h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400 text-amber-400' />;
                        if (i === fullStars && hasHalfStar)
                          return <StarHalf key={i} className='h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400 text-amber-400' />;
                        return <Star key={i} className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/30' />;
                      })}
                    </div>
                    <span className='text-sm font-medium'>{averageRating}</span>
                    <span className='text-xs sm:text-sm text-muted-foreground'>({allReviews.length} reviews)</span>
                  </div>
                  {/* Live Viewer Count - Psychological triggers */}
                  <ProductViewers productSlug={product.slug} stock={product.stock} />
                </div>

                {/* Price - More prominent with Psychological Anchoring */}
                <div className='space-y-2 py-3 border-y border-border/50 bg-gradient-to-r from-background via-muted/20 to-background'>
                  <div className='flex items-baseline gap-2 sm:gap-3 flex-wrap'>
                    <div className='flex flex-col'>
                      <span className='text-2xl sm:text-3xl font-extrabold text-foreground leading-tight'>
                        {formatPriceFromConfig(finalPrice, brandConfig)}
                      </span>
                      {product.discountPercentage && product.discountPercentage > 0 && (
                        <span className='text-[10px] text-muted-foreground mt-0.5'>Special Price</span>
                      )}
                    </div>
                    {product.discountPercentage && product.discountPercentage > 0 && (
                      <>
                        <div className='flex flex-col items-start'>
                          <span className='text-base sm:text-lg text-muted-foreground line-through'>
                            {formatPriceFromConfig(product.price, brandConfig)}
                          </span>
                          <span className='text-[10px] text-muted-foreground'>Was</span>
                        </div>
                        <div className='flex flex-col items-center gap-0.5'>
                          <span className='text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 px-2.5 py-1 rounded-md shadow-sm'>
                            {product.discountPercentage}% OFF
                          </span>
                          <span className='text-[9px] text-muted-foreground'>Limited Time</span>
                        </div>
                      </>
                    )}
                  </div>
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <p className='text-sm text-emerald-600 font-medium'>You save {formatPriceFromConfig(savings, brandConfig)}</p>
                  )}
                </div>

                {/* Stock indicator - Only show if low */}
                {product.stock !== undefined && product.stock > 0 && product.stock <= 30 && (
                  <div className='flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg'>
                    <span className='h-2 w-2 rounded-full bg-amber-500 animate-pulse' />
                    <span className='font-medium'>Only {product.stock} left in stock - Order soon!</span>
                  </div>
                )}

                {/* Add to Cart */}
                <div className='pt-1'>
                  <AddToCart product={product} currencyCode={currencyCode} />
                </div>

                {/* Trust badges - Enhanced design */}
                <div className='grid grid-cols-3 gap-2 pt-2'>
                  <div className='flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-muted/50 text-center'>
                    <Truck className='w-4 h-4 sm:w-5 sm:h-5 text-primary' />
                    <span className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Fast Delivery</span>
                  </div>
                  <div className='flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-muted/50 text-center'>
                    <Shield className='w-4 h-4 sm:w-5 sm:h-5 text-primary' />
                    <span className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Secure Payment</span>
                  </div>
                  <div className='flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-muted/50 text-center'>
                    <RotateCcw className='w-4 h-4 sm:w-5 sm:h-5 text-primary' />
                    <span className='text-[10px] sm:text-xs font-medium text-muted-foreground'>Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section - Below gallery and product details on mobile, left side on desktop */}
            <div className='lg:col-span-1  lg:row-start-2'>
              <section className='rounded-2xl bg-card/60 p-4 sm:p-6 shadow-sm border border-border/70'>
                <div className='mb-3 sm:mb-4 flex flex-wrap items-center gap-3 sm:gap-4'>
                  <div>
                    <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Customer love</p>
                    <h2 className='text-2xl sm:text-3xl font-semibold'>What shoppers are saying</h2>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1 text-amber-500'>
                      {Array.from({ length: 5 }).map((_, i) => {
                        if (i < fullStars) return <Star key={i} className='h-4 w-4 fill-amber-400 text-amber-400' />;
                        if (i === fullStars && hasHalfStar) return <StarHalf key={i} className='h-4 w-4 fill-amber-300 text-amber-300' />;
                        return <Star key={i} className='h-4 w-4 text-muted-foreground/40' />;
                      })}
                    </div>
                    <span className='font-medium text-foreground'>{averageRating}</span>
                    <span>
                      Based on {allReviews.length} review{allReviews.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <ProductReviews reviews={reviewsToShow} />

                <div className='mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border/60 flex flex-col sm:flex-row gap-2.5 sm:gap-3'>
                  <Button asChild className='w-full sm:w-auto'>
                    <Link href={`/products/${product.slug}/reviews`}>Write a Review</Link>
                  </Button>
                  <Button asChild variant='outline' className='w-full sm:w-auto'>
                    <Link href={`/products/${product.slug}/reviews`}>
                      View All {allReviews.length} Review{allReviews.length !== 1 ? "s" : ""}
                    </Link>
                  </Button>
                </div>
              </section>
            </div>
          </div>

          <div className='mt-8 sm:mt-12 space-y-6 sm:space-y-8'>
            {relatedProducts.length > 0 && (
              <section className='rounded-2xl bg-card/60 p-4 sm:p-6 shadow-sm border border-border/70'>
                <div className='flex items-center justify-between gap-3 mb-2.5 sm:mb-3'>
                  <div>
                    <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>You may also like</p>
                    <h2 className='text-xl sm:text-2xl font-semibold text-foreground'>Curated for you</h2>
                  </div>
                </div>
                <div className='grid grid-flow-col auto-cols-[75%] gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 sm:gap-4 lg:gap-6 scrollbar-hide'>
                  {relatedProducts.map((p) => (
                    <div key={p.id} className='snap-start'>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </ProductDetailsWrapper>
  );
}
