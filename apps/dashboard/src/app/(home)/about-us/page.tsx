import AboutUsContainer from "../_components/modules/about-us/AboutUsContainer";
import PageBottom from "../_components/shared/PageBottom";

export default function AboutUsPAge() {
  return (
    <div>
      <AboutUsContainer />
      {/* Page Bottom CTA */}
      <PageBottom
        title='Ready to Join Us?'
        subtitle='Start your e-commerce journey with FrameX today and experience the difference.'
        buttonText='Get Started'
        variant='gradient'
      />
    </div>
  );
}
