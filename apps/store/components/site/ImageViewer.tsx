"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageViewerProps = {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
};

export function ImageViewer({ images, initialIndex = 0, isOpen, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm'>
      {/* Close Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={onClose}
        className='absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70'
      >
        <X className='h-6 w-6' />
      </Button>

      {/* Previous Button */}
      {images.length > 1 && (
        <Button
          variant='ghost'
          size='icon'
          onClick={handlePrevious}
          className='absolute left-4 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70'
        >
          <ChevronLeft className='h-6 w-6' />
        </Button>
      )}

      {/* Next Button */}
      {images.length > 1 && (
        <Button
          variant='ghost'
          size='icon'
          onClick={handleNext}
          className='absolute right-4 z-10 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70'
        >
          <ChevronRight className='h-6 w-6' />
        </Button>
      )}

      {/* Image Container */}
      <div className='relative w-full h-full flex flex-col items-center justify-center px-4 py-16'>
        <div className='relative w-full max-w-[1440px]' style={{ height: "calc(90vh - 200px)", minHeight: "400px" }}>
          <Image
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            fill
            className='object-contain'
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw'
            priority
            unoptimized={images[currentIndex]?.startsWith("http")}
          />
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className='absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white z-20'>
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-2 overflow-x-auto max-w-full px-4 z-20'>
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  idx === currentIndex ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className='object-cover'
                  sizes='64px'
                  unoptimized={img?.startsWith("http")}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
