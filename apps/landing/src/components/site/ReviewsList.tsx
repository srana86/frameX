"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageViewer } from "./ImageViewer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Review } from "@/lib/reviews-data";

type ReviewsListProps = {
  reviews: Review[];
  itemsPerPage?: number;
};

export function ReviewsList({ reviews, itemsPerPage = 10 }: ReviewsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ reviewIndex: number; imageIndex: number } | null>(null);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

  const handleImageClick = (reviewIndex: number, imageIndex: number) => {
    setSelectedImageIndex({ reviewIndex, imageIndex });
  };

  const getCurrentImages = () => {
    if (!selectedImageIndex) return [];
    const review = reviews[startIndex + selectedImageIndex.reviewIndex];
    return review?.images || [];
  };

  const getCurrentImageIndex = () => {
    return selectedImageIndex?.imageIndex || 0;
  };

  return (
    <>
      <div className='space-y-6'>
        {currentReviews.map((review, reviewIdx) => (
          <div key={review.id} className='border-b border-border pb-6 last:border-0 last:pb-0'>
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${review.avatarColor} flex items-center justify-center text-lg font-semibold shrink-0`}>
                  {review.initials}
                </div>
                <div>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <p className='font-semibold'>{review.name}</p>
                    {review.verified && (
                      <span className='text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full'>
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-muted-foreground'>{review.date}</p>
                </div>
              </div>
              <div className='flex items-center gap-1 shrink-0'>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-4 w-4 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                    ⭐
                  </div>
                ))}
              </div>
            </div>
            <p className='text-muted-foreground leading-relaxed mb-4'>{review.review}</p>
            {review.images && review.images.length > 0 && (
              <div className='flex flex-wrap gap-3 mt-4'>
                {review.images.map((imageUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleImageClick(reviewIdx, idx)}
                    className='relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-80 transition-opacity group'
                  >
                    <Image
                      src={imageUrl}
                      alt={`Review image ${idx + 1} by ${review.name}`}
                      fill
                      className='object-cover'
                      sizes='(max-width: 640px) 96px, 128px'
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
                    <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                      <div className='rounded-full bg-black/50 p-2'>
                        <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-8 pt-6 border-t border-border'>
          <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
            <p className='text-sm text-muted-foreground text-center sm:text-left'>
              Showing {startIndex + 1}-{Math.min(endIndex, reviews.length)} of {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className='flex items-center gap-1'>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size='sm'
                        onClick={() => setCurrentPage(page)}
                        className='min-w-[40px]'
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className='px-2 text-muted-foreground'>
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

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

