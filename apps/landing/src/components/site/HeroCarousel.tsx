"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import CloudImage from "@/components/site/CloudImage";
import type { HeroSlide } from "@/lib/types";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  if (slides.length === 0) {
    return null;
  }

  return (
    <div className='mb-3'>
      <Carousel
        className='w-full'
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id || index}>
              {/* Mobile-focused hero: single clean image, natural height */}
              <div className='w-full md:hidden'>
                <CloudImage
                  src={slide.mobileImage || slide.image}
                  alt={slide.title || "Hero slide"}
                  sizes='100vw'
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  className='w-full h-auto object-contain object-center'
                />
              </div>

              {/* Desktop / tablet hero */}
              <div className='w-full hidden md:block'>
                <CloudImage
                  src={slide.image}
                  alt={slide.title || "Hero slide"}
                  sizes='100vw'
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  className='w-full h-auto object-contain object-center'
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious className='left-4 top-1/2 -translate-y-1/2 border border-white/30 bg-white/60 text-slate-800 hover:bg-white' />
            <CarouselNext className='right-4 top-1/2 -translate-y-1/2 border border-white/30 bg-white/60 text-slate-800 hover:bg-white' />
          </>
        )}
      </Carousel>
    </div>
  );
}
