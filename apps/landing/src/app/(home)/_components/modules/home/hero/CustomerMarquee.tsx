import Image from "next/image";

const ecommerceBrands = [
  {
    name: "Ahalan",
    logo: "https://i.ibb.co.com/5pRTW7K/Chat-GPT-Image-Jan-11-2026-11-28-29-AM-1.avif",
  },

  {
    name: "Magento",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/magento.svg",
  },

  {
    name: "Sidrah",
    logo: "https://i.ibb.co.com/DPrMhYcJ/Compress-JPEG-Online-img-400x400.jpg",
  },
  {
    name: "WooCommerce",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/woocommerce.svg",
  },
  {
    name: "China Source BD",
    logo: "https://i.ibb.co.com/1tRk6ypb/Chat-GPT-Image-Dec-12-2025-03-38-41-AM.avif",
  },
  {
    name: "PrestaShop",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/prestashop.svg",
  },
  {
    name: "Maiza",
    logo: "https://i.ibb.co.com/tptPL7jK/IMG-1436-2.avif",
  },
];

export default function CustomerMarquee() {
  // Triple duplication for smooth infinite loop
  const brands = [...ecommerceBrands, ...ecommerceBrands, ...ecommerceBrands];

  return (
    <section className='w-full pt-16 pb-8 sm:pb-10 md:pb-12 lg:pb-8 bg-white'>
      {/* Header */}
      <div className='max-w-7xl mx-auto px-4 mb-10'>
        <h2 className='text-center text-lg sm:text-xl md:text-2xl font-medium text-gray-600'>
          Trusted by 13,500+ Online Stores in Bangladesh
        </h2>
      </div>

      {/* Marquee */}
      <div className='relative overflow-hidden'>
        {/* Fade edges */}
        <div className='absolute left-0 top-0 h-full w-24 bg-linear-to-r from-white to-transparent z-10' />
        <div className='absolute right-0 top-0 h-full w-24 bg-linear-to-l from-white to-transparent z-10' />

        <div
          className='flex gap-6 animate-marquee w-max'
          style={{
            animation: "marquee 60s linear infinite",
          }}
        >
          {brands.map((brand, index) => (
            <div key={index} className='shrink-0 flex items-center justify-center'>
              <div className='group flex items-center gap-3 px-6 py-3 min-w-[160px] bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-gray-300'>
                {/* Logo */}
                <div className='relative h-10 w-10 flex items-center justify-center'>
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={40}
                    height={40}
                    className='object-contain rounded-sm grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300'
                    sizes='40px'
                  />
                </div>

                {/* Name */}
                <span className='text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors'>{brand.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
