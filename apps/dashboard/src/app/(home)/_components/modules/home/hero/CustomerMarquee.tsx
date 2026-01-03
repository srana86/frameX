"use client";

import React from "react";
import Image from "next/image";

const ecommerceBrands = [
  {
    name: "Shopify",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/shopify.svg",
    website: "https://www.shopify.com",
  },
  {
    name: "WooCommerce",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/woocommerce.svg",
    website: "https://woocommerce.com",
  },
  {
    name: "BigCommerce",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/bigcommerce.svg",
    website: "https://www.bigcommerce.com",
  },
  {
    name: "Magento",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/magento.svg",
    website: "https://magento.com",
  },
  {
    name: "PrestaShop",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/prestashop.svg",
    website: "https://www.prestashop.com",
  },
  {
    name: "Squarespace",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/squarespace.svg",
    website: "https://www.squarespace.com",
  },
  {
    name: "Wix",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/wix.svg",
    website: "https://www.wix.com",
  },
];

export default function CustomerMarquee() {
  // Duplicate brands for seamless loop
  const duplicatedBrands = [...ecommerceBrands, ...ecommerceBrands];

  return (
    <section className='w-full py-12 md:py-16 lg:py-20 bg-linear-to-b from-white to-gray-50'>
      {/* Header */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12'>
        <h2 className='text-center text-lg sm:text-xl md:text-2xl font-medium text-gray-600'>
          Join the 120+ E-Commerce Businesses That Trust Our Platform
        </h2>
      </div>

      {/* Marquee Container */}
      <div className='w-full overflow-hidden relative'>
        {/* Gradient fade edges */}
        <div className='absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-white via-white/80 to-transparent z-10 pointer-events-none'></div>
        <div className='absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-white via-white/80 to-transparent z-10 pointer-events-none'></div>

        <div
          className='flex gap-4 md:gap-6 lg:gap-8 animate-marquee'
          style={{ width: "max-content" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.animationPlayState = "running";
          }}
        >
          {/* First set of brand cards */}
          {duplicatedBrands.map((brand, index) => (
            <div key={`first-${index}`} className='shrink-0 flex items-center justify-center p-2 pb-6'>
              <div className='flex flex-row items-center group relative px-4 py-2.5 min-w-[140px] md:min-w-40 justify-center gap-2 bg-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-gray-300'>
                {/* Hover background effect */}
                <div className='absolute inset-0 rounded-xl bg-linear-to-br from-[#0448FD] to-[#277CFF] opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                {/* Logo Image */}
                <div className='relative flex items-center justify-center h-10 md:h-12 w-10 md:w-12 z-10'>
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={80}
                    height={40}
                    className='object-contain w-auto h-full opacity-80 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert group-hover:scale-110 transition-all duration-300'
                    unoptimized
                    onError={(e) => {
                      // Fallback to brand name if image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement("div");
                        fallback.className = "text-xs font-semibold text-white";
                        fallback.textContent = brand.name;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>

                {/* Brand Name */}
                <span className='text-xs md:text-sm font-semibold text-gray-700 group-hover:text-white transition-colors duration-300 text-center z-10 relative'>
                  {brand.name}
                </span>
              </div>
            </div>
          ))}

          {/* Second set for seamless loop */}
          {duplicatedBrands.map((brand, index) => (
            <div key={`second-${index}`} className='shrink-0 flex items-center justify-center p-2 pb-6'>
              <div className='flex flex-row items-center group relative px-4 py-2.5 min-w-[140px] md:min-w-40 justify-center gap-2 bg-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-gray-300'>
                {/* Hover background effect */}
                <div className='absolute inset-0 rounded-xl bg-linear-to-br from-[#0448FD] to-[#277CFF] opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                {/* Logo Image */}
                <div className='relative flex items-center justify-center h-10 md:h-12 w-10 md:w-12 z-10'>
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={80}
                    height={40}
                    className='object-contain w-auto h-full opacity-80 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert group-hover:scale-110 transition-all duration-300'
                    unoptimized
                    onError={(e) => {
                      // Fallback to brand name if image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement("div");
                        fallback.className = "text-xs font-semibold text-white";
                        fallback.textContent = brand.name;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>

                {/* Brand Name */}
                <span className='text-xs md:text-sm font-semibold text-gray-700 group-hover:text-white transition-colors duration-300 text-center z-10 relative'>
                  {brand.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
