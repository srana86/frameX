"use client";

import Image from "next/image";

export function MarketingUi() {
  return (
    <div className='relative w-full h-full flex items-center justify-center overflow-hidden -mt-2'>
      <Image
        src='/marketing-icons/marketing-beam.png'
        alt='Marketing Platforms Integration'
        width={1200}
        height={800}
        className='w-full h-full object-contain'
        priority
      />
    </div>
  );
}
