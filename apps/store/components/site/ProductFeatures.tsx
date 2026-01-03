"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Star, Truck, RotateCcw, Shield, Gem, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface Review {
  id: string;
  rating: number;
}

interface ProductFeaturesProps {
  productName: string;
  productUrl?: string;
  reviews?: Review[];
}

export function ProductFeatures({ productName, productUrl, reviews = [] }: ProductFeaturesProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    const currentUrl = typeof window !== "undefined" ? window.location.href : productUrl || "";

    // Try native share first (mobile devices)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out this amazing product: ${productName}`,
          url: currentUrl,
        });
        toast.success("Product shared successfully!");
        setIsSharing(false);
        return;
      } catch (error) {
        // User cancelled or error occurred, fall through to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success(
        <div className='flex items-center gap-2'>
          <Check className='w-4 h-4 text-green-600' />
          <span>Product link copied to clipboard!</span>
        </div>
      );
    } catch (error) {
      toast.error("Failed to copy link. Please try again.");
    }

    setTimeout(() => setIsSharing(false), 1000);
  };

  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "On orders $75+",
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "30-day policy",
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
    },
    {
      icon: Shield,
      title: "Warranty",
      description: "1-year coverage",
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
    },
    {
      icon: Gem,
      title: "Premium",
      description: "Quality assured",
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Share Button */}
      <div className='w-full'>
        <Button
          variant='outline'
          size='lg'
          onClick={handleShare}
          disabled={isSharing}
          className='w-full h-12 hover:scale-105 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50'
        >
          {isSharing ? (
            <>
              <Copy className='w-5 h-5 mr-2 animate-pulse' />
              Copying...
            </>
          ) : (
            <>
              <Share2 className='w-5 h-5 mr-2' />
              Share Product
            </>
          )}
        </Button>
      </div>

      {/* Features Grid */}
      <div className='grid grid-cols-2 gap-4'>
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <button
              key={index}
              className={`rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-md ${feature.bgColor} border border-transparent hover:border-current/20`}
              onClick={() => toast.info(`Learn more about our ${feature.title.toLowerCase()} policy`)}
            >
              <div className={`text-2xl mb-2 flex justify-center ${feature.color}`}>
                <IconComponent className='w-8 h-8' />
              </div>
              <div className={`text-sm font-medium ${feature.color}`}>{feature.title}</div>
              <div className='text-xs text-muted-foreground'>{feature.description}</div>
            </button>
          );
        })}
      </div>

      {/* Rating Section */}
      {reviews.length > 0 && (
        <div className='rounded-xl bg-accent/20 p-4 border'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold'>Customer Reviews</h3>
            <Badge variant='secondary'>
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {(() => {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = (totalRating / reviews.length).toFixed(1);
            const averageRatingNum = parseFloat(averageRating);
            const fullStars = Math.floor(averageRatingNum);
            const hasHalfStar = averageRatingNum % 1 >= 0.5;

            // Calculate rating distribution
            const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return { stars, count, percentage };
            });

            return (
              <>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='flex items-center gap-1'>
                    {[...Array(5)].map((_, i) => {
                      if (i < fullStars) {
                        return <Star key={i} className='w-4 h-4 fill-yellow-400 text-yellow-400' />;
                      } else if (i === fullStars && hasHalfStar) {
                        return <Star key={i} className='w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50' />;
                      } else {
                        return <Star key={i} className='w-4 h-4 text-gray-300' />;
                      }
                    })}
                  </div>
                  <span className='text-sm font-medium'>{averageRating} out of 5</span>
                </div>
                <div className='space-y-1'>
                  {ratingDistribution.map(({ stars, count, percentage }) => (
                    <div key={stars} className='flex items-center gap-2 text-xs'>
                      <span className='w-3'>{stars}</span>
                      <Star className='w-3 h-3 fill-current text-yellow-400' />
                      <div className='flex-1 bg-gray-200 rounded-full h-1.5'>
                        <div className='bg-yellow-400 h-1.5 rounded-full transition-all duration-500' style={{ width: `${percentage}%` }} />
                      </div>
                      <span className='text-muted-foreground w-8'>{count}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
