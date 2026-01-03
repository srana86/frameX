import ContactUsContainer from "../_components/modules/contact-us/ContactUsContainer";
import PageBottom from "../_components/shared/PageBottom";

export default function ContactUsPage() {
  return (
    <main>
      <ContactUsContainer />
      {/* Page Bottom CTA */}
      <PageBottom
        title='Ready to Join Us?'
        subtitle='Start your e-commerce journey with FrameX today and experience the difference.'
        buttonText='Get Started'
        variant='gradient'
      />
    </main>
  );
}
