import Image from "next/image";
import { StartBuildingButton, WatchDemoButton } from "../../../ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import WhiteShades from "../svg";
import { DashboardPreview } from "./DashboardPreview";

const { WhiteShadeLeft1, WhiteShadeLeft2, WhiteShadeRight1, WhiteShadeRight2 } = WhiteShades;

export default function HeroContainer() {
  return (
    <header
      className='w-full relative flex flex-col items-center px-3 pt-28 md:pt-32 lg:pt-48 overflow-hidden lg:max-h-[1215px]'
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(39, 124, 255, 0.2) 30%, rgba(39, 124, 255, 0.5) 60%, rgba(39, 124, 255, 0.8) 85%, #277CFF 100%)",
        height: "auto",
      }}
      aria-labelledby='hero-title'
    >
      {/* Left White Shades - Close together - Hidden on mobile */}
      <div className='hidden md:block absolute left-0 top-0 h-full pointer-events-none z-0' style={{ width: "auto" }}>
        <div className='absolute' style={{ top: 0, left: 0, height: "calc(62% - 5px)" }}>
          <WhiteShadeLeft2 className='h-full w-auto' style={{ height: "100%", width: "auto", display: "block" }} />
        </div>
        <div className='absolute' style={{ bottom: 0, left: 0, height: "calc(100% - 5px)" }}>
          <WhiteShadeLeft1 className='h-full w-auto' style={{ height: "100%", width: "auto", display: "block" }} />
        </div>
      </div>

      {/* Right White Shades - Close together - Hidden on mobile */}
      <div className='hidden md:block absolute right-0 top-0 h-full pointer-events-none z-0' style={{ width: "auto" }}>
        <div className='absolute' style={{ top: 0, right: 0, height: "calc(62% - 5px)" }}>
          <WhiteShadeRight2 className='h-full w-auto' style={{ height: "100%", width: "auto", display: "block" }} />
        </div>
        <div className='absolute' style={{ bottom: 0, right: 0, height: "calc(100% - 5px)" }}>
          <WhiteShadeRight1 className='h-full w-auto' style={{ height: "100%", width: "auto", display: "block" }} />
        </div>
      </div>
      {/* Hero Content */}
      <div className='w-full max-w-4xl mt-4 md:-mt-4 mx-auto text-center space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 shrink-0 relative z-10 px-2 sm:px-4'>
        {/* Badge */}
        <div className='inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-full border border-blue-200 bg-white/25 mx-auto mb-4 md:mb-8'>
          <Sparkles className='w-4 h-4 text-blue-500' />
          <span
            className='text-xs sm:text-base font-semibold text-gray-700'
            style={{
              fontFamily: "var(--font-urbanist)",
              fontWeight: 600,
            }}
          >
            Bangladesh's No.1 Online Growth Partner
          </span>
        </div>

        {/* Main Heading */}
        <h1
          id='hero-title'
          className='text-gray-900 text-center'
          style={{
            fontFamily: "var(--font-nunito-sans)",
            fontWeight: 600,
            fontSize: "clamp(40px, 8vw, 64px)",
            lineHeight: "120%",
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          <span className='inline sm:hidden'>Launch Your FrameX Store</span>
          <br className='inline sm:hidden' />
          <span className='inline sm:hidden bg-linear-to-r from-[#2078FF] to-[#4000FF] bg-clip-text text-transparent'>
            Sell & Grow Fast.
          </span>
          <span className='hidden sm:inline'>Launch Your FrameX Store</span>
          <br className='hidden sm:block' />
          <span className='hidden sm:inline'> </span>
          <span className='hidden sm:inline bg-linear-to-r from-[#2078FF] to-[#4000FF] bg-clip-text text-transparent'>
            Sell More. Grow Faster.
          </span>
        </h1>
        {/* Description */}
        <p
          className='text-gray-600 max-w-full md:max-w-2xl mx-auto text-center'
          style={{
            fontFamily: "var(--font-urbanist)",
            fontWeight: 400,
            fontSize: "clamp(14px, 2.5vw, 20px)",
            lineHeight: "1.5",
            letterSpacing: "0%",
            textAlign: "center",
            padding: "0 0.5rem",
          }}
        >
          Launch your professional e-commerce store in minutes with FrameX Tech. We help tenants in Bangladesh build affordable,
          fully-featured online stores to start selling and grow faster.
        </p>
        {/* CTA Buttons - Always flex */}
        <div className='flex flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 pt-2 sm:pt-3 md:pt-4 flex-wrap mb-12 md:mb-20'>
          <StartBuildingButton
            text='Start Building'
            icon={ArrowRight}
            iconPosition='right'
            className='text-xs sm:text-sm md:text-base'
            href='#pricing'
          />
          <WatchDemoButton text='Watch Demo' icon={Play} iconPosition='left' className='text-xs sm:text-sm md:text-base' href='#explore' />
        </div>
      </div>

      {/* Image Frame with Gradient Border */}
      <div className='w-full max-w-[1100px] mx-auto px-2 sm:px-3 md:px-4 shrink-0 relative z-10 mt-auto mb-0'>
        {/* White background with padding - only top, left, right */}
        {/* Reduced padding for mobile and tablet */}
        <div className='bg-white pt-0.5 px-0.5 rounded-t-lg sm:rounded-t-xl'>
          {/* Gradient Border Container - no bottom border */}
          {/* Reduced padding for mobile and tablet, full padding for large devices */}
          <div
            className='relative overflow-hidden rounded-t-lg sm:rounded-t-xl gradient-border-lg'
            style={{
              paddingTop: "4px",
              paddingLeft: "4px",
              paddingRight: "4px",
              paddingBottom: "0px",
              background:
                "linear-gradient(131.19deg, #2078FF -0.77%, #2078FF 5.73%, #2078FF 9.8%, #2078FF 14.16%, rgba(32, 120, 255, 0.8) 60.97%,rgba(32, 120, 255, 0.7) 70.72%, rgba(32, 120, 255, 0.6) 90.94%)",
            }}
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  @media (min-width: 1024px) {
                    .gradient-border-lg {
                      padding-top: 10px !important;
                      padding-left: 10px !important;
                      padding-right: 10px !important;
                    }
                  }
                `,
              }}
            />
            <div className='relative overflow-hidden bg-white rounded-t-lg sm:rounded-t-xl'>
              {/* Dashboard Image for Mobile and Tablet */}
              <div className='w-full h-[200px] sm:h-[260px] md:h-72 lg:hidden overflow-hidden'>
                <Image
                  src='/mock/dashboard.avif'
                  alt='Dashboard Preview'
                  width={1100}
                  height={600}
                  className='w-full h-full object-cover object-top'
                  priority
                  fetchPriority='high'
                  sizes='(max-width: 1024px) 100vw, 1100px'
                  quality={70}
                />
              </div>

              {/* Dashboard Preview Component for Large Devices */}
              <div className='hidden lg:block w-full h-[400px] xl:h-[450px] overflow-hidden'>
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
