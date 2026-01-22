"use client";

import Image from "next/image";

export function MarketingUi() {
  return (
    <div className='relative w-full h-full flex items-center justify-center overflow-hidden -mt-2'>
      <Image
        src='/feature/marketing.avif'
        alt='Marketing Platforms Integration'
        width={1200}
        height={800}
        className='w-full h-full scale-115 object-contain'
        sizes='(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 520px'
        quality={70}
      />
    </div>
  );
}
