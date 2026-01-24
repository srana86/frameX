"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageViewer } from "./ImageViewer";
import { toast } from "sonner";
import type { Review } from "@/lib/reviews-data";

type ProductReviewsProps = {
  reviews: Review[];
};

export function ProductReviews({ reviews }: ProductReviewsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ reviewIndex: number; imageIndex: number } | null>(null);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  const handleImageClick = (reviewIndex: number, imageIndex: number) => {
    setSelectedImageIndex({ reviewIndex, imageIndex });
  };

  const getCurrentImages = () => {
    if (!selectedImageIndex) return [];
    const review = reviews[selectedImageIndex.reviewIndex];
    return review?.images || [];
  };

  const getCurrentImageIndex = () => {
    return selectedImageIndex?.imageIndex || 0;
  };

  return (
    <>
      <div className='space-y-6'>
        {reviews.map((review, reviewIdx) => (
          <div key={review.id} className='border-b border-border pb-6 last:border-0 last:pb-0'>
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${review.avatarColor} flex items-center justify-center text-lg font-semibold`}
                >
                  {review.initials}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <p className='font-semibold'>{review.name}</p>
                    {review.verified && (
                      <span className='text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full'>
                        Verified
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-muted-foreground'>{review.date}</p>
                </div>
              </div>
              <div className='flex items-center gap-1'>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-4 w-4 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                    ⭐
                  </div>
                ))}
              </div>
            </div>
            <p className='text-muted-foreground leading-relaxed mb-3'>{review.review}</p>
            {review.images && review.images.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-4'>
                {review.images.map((imageUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleImageClick(reviewIdx, idx)}
                    className='relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity group'
                  >
                    <Image
                      src={imageUrl}
                      alt={`Review image ${idx + 1} by ${review.name}`}
                      fill
                      className='object-cover'
                      sizes='(max-width: 640px) 80px, 96px'
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                      <div className='rounded-full bg-black/50 p-1.5'>
                        <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7' />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className='flex items-center gap-4 mt-4 pt-4 border-t border-border/50'>
              <button
                onClick={() => {
                  if (helpfulClicked[review.id]) {
                    toast.info("You've already marked this review as helpful");
                    return;
                  }
                  const currentCount = helpfulCounts[review.id] || 0;
                  setHelpfulCounts({ ...helpfulCounts, [review.id]: currentCount + 1 });
                  setHelpfulClicked({ ...helpfulClicked, [review.id]: true });
                  toast.success("Thank you for your feedback!");
                }}
                className={`text-sm transition-colors flex items-center gap-1 ${
                  helpfulClicked[review.id]
                    ? "text-green-600 dark:text-green-400 cursor-default"
                    : "text-muted-foreground hover:text-foreground cursor-pointer"
                }`}
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5' />
                </svg>
                Helpful {helpfulCounts[review.id] > 0 && `(${helpfulCounts[review.id]})`}
              </button>
              <button className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
                Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Viewer Modal */}
      {selectedImageIndex && (
        <ImageViewer
          images={getCurrentImages()}
          initialIndex={getCurrentImageIndex()}
          isOpen={!!selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  );
}

