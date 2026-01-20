"use client";

import dynamic from "next/dynamic";

const FeatureContainer = dynamic(() => import("./feature/FeatureContainer"), { ssr: false, loading: () => <SectionLoader /> });
const StepsContainer = dynamic(() => import("./steps/StepsContainer"), { ssr: false, loading: () => <SectionLoader /> });
const MockContainer = dynamic(() => import("./mock/MockContainer"), { ssr: false, loading: () => <SectionLoader /> });
const TestimonialContainer = dynamic(() => import("./testimonial/TestimonialContainer"), { ssr: false, loading: () => <SectionLoader /> });
const PricingContainer = dynamic(() => import("./pricing/PricingContainer"), { ssr: false, loading: () => <SectionLoader /> });
const ExploreContainer = dynamic(() => import("./explore-section/ExploreContainer"), { ssr: false, loading: () => <SectionLoader /> });
const TeamContainer = dynamic(() => import("./team/TeamContainer"), { ssr: false, loading: () => <SectionLoader /> });
const FaqContainer = dynamic(() => import("./faq/FaqContainer"), { ssr: false, loading: () => <SectionLoader /> });

function SectionLoader() {
  return (
    <div className='w-full min-h-[400px] flex items-center justify-center'>
      <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin' />
    </div>
  );
}

export default function HomeDeferredSections() {
  return (
    <>
      <section id='features' className='scroll-mt-20 md:scroll-mt-24' aria-label='Features'>
        <FeatureContainer />
      </section>
      <section id='steps' className='scroll-mt-20 md:scroll-mt-24' aria-label='Steps'>
        <StepsContainer />
      </section>
      <section id='demo' className='scroll-mt-20 md:scroll-mt-24' aria-label='Demo'>
        <MockContainer />
      </section>
      <section id='testimonials' className='scroll-mt-20 md:scroll-mt-24' aria-label='Testimonials'>
        <TestimonialContainer />
      </section>
      <section id='pricing' className='scroll-mt-20 md:scroll-mt-24' aria-label='Pricing'>
        <PricingContainer />
      </section>
      <section id='explore' className='scroll-mt-20 md:scroll-mt-24' aria-label='Explore'>
        <ExploreContainer />
      </section>
      <section id='team' className='scroll-mt-20 md:scroll-mt-24' aria-label='Team'>
        <TeamContainer />
      </section>
      <section id='faq' className='scroll-mt-20 md:scroll-mt-24' aria-label='FAQ'>
        <FaqContainer />
      </section>
    </>
  );
}
