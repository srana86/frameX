"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Product {
  name: string;
  price: string;
  category: string;
  imageUrl: string;
}

const products: Product[] = [
  {
    name: "Cashmere Sweater",
    price: "$150",
    category: "Apparel",
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Linen Jumpsuit",
    price: "$220",
    category: "Apparel",
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "New Jeans",
    price: "$250",
    category: "Apparel",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Charcoal Blazers",
    price: "$250",
    category: "Apparel",
    imageUrl: "https://images.unsplash.com/photo-1594938291221-94f313b0a42a?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Cotton T-shirt",
    price: "$220",
    category: "Apparel",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&q=80",
  },
  {
    name: "Silk Midi Dress",
    price: "$120",
    category: "Apparel",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop&q=80",
  },
];

export function StoreSetup() {
  const [isVisible, setIsVisible] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleImageError = (idx: number) => {
    setImageErrors((prev) => new Set(prev).add(idx));
  };

  return (
    <div className='w-full h-full overflow-hidden relative bg-[#fafafa] rounded-xl' style={{ borderRadius: "12px" }}>
      <div className='w-full h-full flex flex-col relative z-10 min-h-0 rounded-xl overflow-hidden'>
        {/* Minimal Browser Header */}
        <div className='bg-white px-3 py-2 flex items-center gap-2 border-b border-neutral-100'>
          <div className='flex gap-1.5'>
            <div className='w-2.5 h-2.5 rounded-full bg-[#ff5f57]' />
            <div className='w-2.5 h-2.5 rounded-full bg-[#febc2e]' />
            <div className='w-2.5 h-2.5 rounded-full bg-[#28c840]' />
          </div>
          <div className='flex-1 bg-neutral-50 rounded-lg px-3 py-1 text-[11px] text-neutral-500 text-center font-medium tracking-wide'>
            framex.com
          </div>
        </div>

        {/* Store Content */}
        <div className='flex-1 bg-[#fafafa] p-2.5 sm:p-3 overflow-y-auto overflow-x-hidden relative min-h-0 flex flex-col'>
          {/* Clean Header */}
          <div
            className='flex items-center justify-between mb-2 pb-2 border-b border-neutral-100'
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.4s ease-out 0.1s",
            }}
          >
            <div className='flex items-center gap-2'>
              <div className='relative w-16 h-5 sm:w-20 sm:h-6 flex items-center'>
                <Image src='/logo/framrx.png' alt='FrameX' fill className='object-contain' priority />
              </div>
            </div>
            <div className='flex items-center gap-1.5'>
              <button className='w-6 h-6 rounded-md bg-white border border-neutral-100 flex items-center justify-center hover:border-neutral-200 transition-colors'>
                <svg className='w-3 h-3 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
              </button>
              <button className='w-6 h-6 rounded-md bg-white border border-neutral-100 flex items-center justify-center hover:border-neutral-200 transition-colors relative'>
                <svg className='w-3 h-3 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
                </svg>
                <span className='absolute -top-0.5 -right-0.5 w-3 h-3 bg-neutral-900 text-white text-[7px] font-medium rounded-full flex items-center justify-center'>
                  2
                </span>
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 relative z-10 pb-1'>
            {products.map((product, idx) => (
              <div
                key={idx}
                className='group/product relative bg-white rounded-xl overflow-hidden border border-neutral-100 hover:border-neutral-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 cursor-pointer'
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(16px)",
                  transition: `all 0.4s ease-out ${0.15 + idx * 0.05}s`,
                }}
              >
                {/* Product Image */}
                <div className='aspect-4/3 bg-neutral-100 relative overflow-hidden'>
                  {imageErrors.has(idx) ? (
                    <div className='absolute inset-0 bg-neutral-100 flex items-center justify-center'>
                      <svg className='w-8 h-8 text-neutral-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1}
                          d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                        />
                      </svg>
                    </div>
                  ) : (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className='object-cover transition-transform duration-500 group-hover/product:scale-105'
                      sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                      onError={() => handleImageError(idx)}
                      loading='lazy'
                    />
                  )}

                  {/* Wishlist Button */}
                  <button className='absolute top-1.5 right-1.5 w-5 h-5 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover/product:opacity-100 transition-opacity duration-200 hover:bg-white'>
                    <svg className='w-2.5 h-2.5 text-neutral-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                      />
                    </svg>
                  </button>
                </div>

                {/* Product Info */}
                <div className='p-2 sm:p-2.5'>
                  <p className='text-[9px] text-neutral-400 uppercase tracking-wider font-medium'>{product.category}</p>
                  <h3 className='text-[10px] sm:text-[11px] font-medium text-neutral-800 truncate leading-tight'>{product.name}</h3>
                  <div className='flex items-center justify-between mt-1'>
                    <span className='text-[10px] sm:text-[11px] font-semibold text-neutral-900'>{product.price}</span>
                    <button className='w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center opacity-0 group-hover/product:opacity-100 transition-all duration-200 hover:bg-neutral-800 transform scale-90 group-hover/product:scale-100'>
                      <svg className='w-2.5 h-2.5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
