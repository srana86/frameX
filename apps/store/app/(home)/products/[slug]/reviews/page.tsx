import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { loadMerchantDocument, loadMerchantCollectionData } from "@/lib/merchant-data-loader";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/site/ReviewForm";
import { ReviewsList } from "@/components/site/ReviewsList";

type Props = { params: Promise<{ slug: string }> };

// Helper function to normalize slug
function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let product: Product | undefined = undefined;
  try {
    const decodedSlug = decodeURIComponent(slug);

    // Try exact match first
    let d = await loadMerchantDocument<any>("products", { slug: decodedSlug });

    // Try normalized slug
    if (!d) {
      const normalizedSlug = normalizeSlug(decodedSlug);
      d = await loadMerchantDocument<any>("products", { slug: normalizedSlug });
    }

    // Try original slug
    if (!d) {
      d = await loadMerchantDocument<any>("products", { slug: slug });
    }

    // Try normalized original
    if (!d) {
      const normalizedOriginal = normalizeSlug(slug);
      d = await loadMerchantDocument<any>("products", { slug: normalizedOriginal });
    }

    // Last resort: case-insensitive search
    if (!d) {
      const allProducts = await loadMerchantCollectionData<any>("products", {});
      d = allProducts.find(
        (p: any) =>
          p.slug?.toLowerCase() === decodedSlug.toLowerCase() ||
          p.slug?.toLowerCase() === slug.toLowerCase() ||
          p.slug?.toLowerCase() === normalizeSlug(decodedSlug) ||
          p.slug?.toLowerCase() === normalizeSlug(slug)
      );
    }

    if (d) {
      product = {
        id: String(d._id),
        slug: d.slug,
        name: d.name,
        brand: d.brand,
        category: d.category,
        description: d.description ?? "",
        price: Number(d.price ?? 0),
        images: Array.isArray(d.images) ? d.images : [],
        sizes: Array.isArray(d.sizes) ? d.sizes : [],
        featured: Boolean(d.featured ?? false),
        stock: d.stock !== undefined ? Number(d.stock) : undefined,
      };
    }
  } catch {}

  if (!product) return { title: "Product Not Found" };
  return {
    title: `Reviews - ${product.name}`,
    description: `Read all customer reviews for ${product.name}`,
  };
}

export default async function ReviewsPage({ params }: Props) {
  const { slug } = await params;
  let product: Product | undefined = undefined;
  try {
    const decodedSlug = decodeURIComponent(slug);

    // Try exact match first
    let d = await loadMerchantDocument<any>("products", { slug: decodedSlug });

    // Try normalized slug
    if (!d) {
      const normalizedSlug = normalizeSlug(decodedSlug);
      d = await loadMerchantDocument<any>("products", { slug: normalizedSlug });
    }

    // Try original slug
    if (!d) {
      d = await loadMerchantDocument<any>("products", { slug: slug });
    }

    // Try normalized original
    if (!d) {
      const normalizedOriginal = normalizeSlug(slug);
      d = await loadMerchantDocument<any>("products", { slug: normalizedOriginal });
    }

    // Last resort: case-insensitive search
    if (!d) {
      const allProducts = await loadMerchantCollectionData<any>("products", {});
      d = allProducts.find(
        (p: any) =>
          p.slug?.toLowerCase() === decodedSlug.toLowerCase() ||
          p.slug?.toLowerCase() === slug.toLowerCase() ||
          p.slug?.toLowerCase() === normalizeSlug(decodedSlug) ||
          p.slug?.toLowerCase() === normalizeSlug(slug)
      );
    }

    if (d) {
      product = {
        id: String(d._id),
        slug: d.slug,
        name: d.name,
        brand: d.brand,
        category: d.category,
        description: d.description ?? "",
        price: Number(d.price ?? 0),
        images: Array.isArray(d.images) ? d.images : [],
        sizes: Array.isArray(d.sizes) ? d.sizes : [],
        featured: Boolean(d.featured ?? false),
        stock: d.stock !== undefined ? Number(d.stock) : undefined,
      };
    }
  } catch {}

  if (!product) notFound();

  // Fetch reviews from MongoDB
  let allReviews: Array<{
    id: string;
    name: string;
    initials: string;
    rating: number;
    date: string;
    verified: boolean;
    review: string;
    avatarColor: string;
    images: string[];
  }> = [];
  try {
    const reviews = await loadMerchantCollectionData<any>("reviews", { productSlug: product.slug }, { sort: { createdAt: -1 } });

    allReviews = reviews.map((r) => ({
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
  }

  // Calculate average rating
  const totalRating = allReviews.length > 0 ? allReviews.reduce((sum, review) => sum + review.rating, 0) : 0;
  const averageRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : "0.0";
  const totalReviews = allReviews.length;

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: allReviews.filter((r) => r.rating === rating).length,
    percentage: allReviews.length > 0 ? (allReviews.filter((r) => r.rating === rating).length / allReviews.length) * 100 : 0,
  }));

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-accent/5'>
      <div className='mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <Button asChild variant='outline' size='sm' className='mb-6'>
            <Link href={`/products/${product.slug}`} className='flex items-center gap-2'>
              <ArrowLeft className='w-4 h-4' />
              <span>Back to Product</span>
            </Link>
          </Button>

          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold mb-2'>{product.name} - Reviews</h1>
              <p className='text-muted-foreground'>
                {product.brand} • {product.category}
              </p>
            </div>
            <div className='flex items-center gap-4'>
              <div className='text-center sm:text-right'>
                <div className='flex items-center gap-2 justify-center sm:justify-end mb-1'>
                  <div className='flex items-center gap-1'>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-6 w-6 ${i < Math.round(Number(averageRating)) ? "text-yellow-400" : "text-gray-300"}`}>
                        ⭐
                      </div>
                    ))}
                  </div>
                  <span className='text-3xl font-bold ml-2'>{averageRating}</span>
                </div>
                <p className='text-sm text-muted-foreground'>
                  Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Write Review Section */}
        <div className='mb-8'>
          <ReviewForm productName={product.name} productSlug={product.slug} />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Sidebar - Rating Summary */}
          <div className='lg:col-span-1'>
            <div className='rounded-2xl bg-card p-6 shadow-lg border sticky top-8'>
              <h2 className='text-xl font-bold mb-6'>Rating Summary</h2>

              {/* Rating Distribution */}
              <div className='space-y-3 mb-6'>
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className='flex items-center gap-3'>
                    <div className='flex items-center gap-1 w-20'>
                      <span className='text-sm font-medium'>{rating}</span>
                      <div className='h-4 w-4 text-yellow-400'>⭐</div>
                    </div>
                    <div className='flex-1 h-2 bg-muted rounded-full overflow-hidden'>
                      <div className='h-full bg-yellow-400 rounded-full transition-all' style={{ width: `${percentage}%` }} />
                    </div>
                    <span className='text-sm text-muted-foreground w-12 text-right'>{count}</span>
                  </div>
                ))}
              </div>

              {/* Overall Stats */}
              <div className='pt-6 border-t border-border space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>5 Stars</span>
                  <span className='font-semibold'>{ratingDistribution[0].count}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>4 Stars</span>
                  <span className='font-semibold'>{ratingDistribution[1].count}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>3 Stars</span>
                  <span className='font-semibold'>{ratingDistribution[2].count}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>2 Stars</span>
                  <span className='font-semibold'>{ratingDistribution[3].count}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>1 Star</span>
                  <span className='font-semibold'>{ratingDistribution[4].count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className='lg:col-span-3'>
            <div className='rounded-2xl bg-card p-6 sm:p-8 shadow-xl border'>
              <div className='flex items-center justify-between mb-8'>
                <h2 className='text-2xl font-bold'>All Reviews ({allReviews.length})</h2>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>Sort by:</span>
                  <select className='px-3 py-1.5 text-sm border border-border rounded-lg bg-background'>
                    <option>Most Recent</option>
                    <option>Highest Rated</option>
                    <option>Lowest Rated</option>
                    <option>Most Helpful</option>
                  </select>
                </div>
              </div>

              <ReviewsList reviews={allReviews} itemsPerPage={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
