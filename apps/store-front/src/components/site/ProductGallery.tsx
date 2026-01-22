"use client";

import { useState, useEffect } from "react";
import CloudImage from "@/components/site/CloudImage";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const gallery = images?.length ? images : ["/file.svg"];

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleThumbnailClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  const scrollPrev = () => api?.scrollPrev();
  const scrollNext = () => api?.scrollNext();

  return (
    <div className='flex flex-col gap-2'>
      {/* Main Image Carousel */}
      <div className='relative group w-full overflow-hidden rounded-lg sm:rounded-xl bg-neutral-100'>
        <Carousel className='relative w-full' setApi={setApi}>
          <CarouselContent className='ml-0'>
            {gallery.map((src, idx) => (
              <CarouselItem key={idx} className='pl-0'>
                <div className='relative w-full h-[350px] sm:h-[420px] md:h-[500px] lg:h-[580px] xl:h-[650px]'>
                  <CloudImage
                    src={src}
                    alt={`${productName} ${idx + 1}`}
                    fill
                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 50vw'
                    className='object-contain'
                    priority={idx === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows - Inside carousel */}
          {gallery.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/95 border border-border/20 shadow-md flex items-center justify-center opacity-80 hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95'
                aria-label='Previous image'
              >
                <ChevronLeft className='h-5 w-5 sm:h-6 sm:w-6 text-foreground' />
              </button>
              <button
                onClick={scrollNext}
                className='absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/95 border border-border/20 shadow-md flex items-center justify-center opacity-80 hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95'
                aria-label='Next image'
              >
                <ChevronRight className='h-5 w-5 sm:h-6 sm:w-6 text-foreground' />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {gallery.length > 1 && (
            <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10'>
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`transition-all duration-200 rounded-full ${
                    current === idx ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-white/60 hover:bg-white/80"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </Carousel>
      </div>

      {/* Thumbnail Gallery */}
      {gallery.length > 1 && (
        <div className='flex gap-2 overflow-x-auto scrollbar-thin px-4 md:px-0'>
          {gallery.slice(0, 8).map((src, idx) => (
            <button
              key={idx}
              onClick={() => handleThumbnailClick(idx)}
              className={`relative h-16 w-16 sm:h-[72px] sm:w-[72px] md:h-20 md:w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-150 ${
                current === idx
                  ? "border-primary shadow ring-1 ring-primary/20"
                  : "border-border/40 hover:border-primary/40 opacity-75 hover:opacity-100"
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <CloudImage src={src} alt={`Thumbnail ${idx + 1}`} fill className='object-cover' />
            </button>
          ))}
          {gallery.length > 8 && (
            <div className='flex h-16 w-16 sm:h-[72px] sm:w-[72px] md:h-20 md:w-20 shrink-0 items-center justify-center rounded-md bg-muted/70 text-xs font-semibold text-muted-foreground border border-dashed border-border'>
              +{gallery.length - 8}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
