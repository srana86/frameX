import HeroContainer from "./hero/HeroContainer";
import CustomerMarquee from "./hero/CustomerMarquee";
import HomeDeferredSections from "./HomeDeferredSections";

export default function HomeContainer() {
  return (
    <main className='scroll-smooth'>
      <section id='home' className='scroll-mt-20 md:scroll-mt-24' aria-label='Hero'>
        <HeroContainer />
      </section>
      <section id='customers' aria-label='Trusted Customers'>
        <CustomerMarquee />
      </section>
      <HomeDeferredSections />
    </main>
  );
}
