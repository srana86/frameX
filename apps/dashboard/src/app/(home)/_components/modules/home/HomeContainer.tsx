import { lazy, Suspense } from "react";
import HeroContainer from "./hero/HeroContainer";
import CustomerMarquee from "./hero/CustomerMarquee";

// Lazy load below-the-fold components for better performance
const FeatureContainer = lazy(() => import("./feature/FeatureContainer"));
const StepsContainer = lazy(() => import("./steps/StepsContainer"));
const MockContainer = lazy(() => import("./mock/MockContainer"));
const TestimonialContainer = lazy(() => import("./testimonial/TestimonialContainer"));
const PricingContainer = lazy(() => import("./pricing/PricingContainer"));
const ExploreContainer = lazy(() => import("./explore-section/ExploreContainer"));
const TeamContainer = lazy(() => import("./team/TeamContainer"));
const FaqContainer = lazy(() => import("./faq/FaqContainer"));

// Loading fallback component
function SectionLoader() {
  return (
    <div className='w-full min-h-[400px] flex items-center justify-center'>
      <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin' />
    </div>
  );
}

export default function HomeContainer() {
  return (
    <main className='scroll-smooth'>
      <section id='home' className='scroll-mt-20 md:scroll-mt-24'>
        <HeroContainer />
      </section>
      <section id='customers'>
        <CustomerMarquee />
      </section>
      <section id='features' className='scroll-mt-20 md:scroll-mt-24'>
        <Suspense fallback={<SectionLoader />}>
        <FeatureContainer />
        </Suspense>
      </section>
      <section id='steps' className='scroll-mt-20 md:scroll-mt-24'>
        <Suspense fallback={<SectionLoader />}>
        <StepsContainer />
        </Suspense>
      </section>
      <section id='demo' className='scroll-mt-20 md:scroll-mt-24'>
        <Suspense fallback={<SectionLoader />}>
        <MockContainer />
        </Suspense>
      </section>
      <section id='testimonials' className='scroll-mt-20 md:scroll-mt-24'>
        <Suspense fallback={<SectionLoader />}>
        <TestimonialContainer />
        </Suspense>
      </section>
      <section id='pricing' className='scroll-mt-20 md:scroll-mt-24'>
        <Suspense fallback={<SectionLoader />}>
        <PricingContainer />
        </Suspense>
      </section>
      <section id='explore' className='scroll-mt-20 md:scroll-mt-24'>
        <Suspense fallback={<SectionLoader />}>
        <ExploreContainer />
        </Suspense>
      </section>
      <section id='team' className='scroll-mt-20 md:scroll-mt-24'>
        <Suspense fallback={<SectionLoader />}>
        <TeamContainer />
        </Suspense>
      </section>
      <section id='faq' className='scroll-mt-20 md:scroll-mt-24'>
        <Suspense fallback={<SectionLoader />}>
        <FaqContainer />
        </Suspense>
      </section>
    </main>
  );
}
