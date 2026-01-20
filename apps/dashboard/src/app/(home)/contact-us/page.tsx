import type { Metadata } from "next";
import ContactUsContainer from "../_components/modules/contact-us/ContactUsContainer";
import PageBottom from "../_components/shared/PageBottom";

const siteUrl = "https://www.framextech.com";

const title = "Contact Us | FrameX Tech - Get Your E-Commerce Website Started";
const description =
  "Get in touch with FrameX Tech to start building your eCommerce website in Bangladesh. Contact us for custom design, development, payment integration, and support starting at ৳500/month.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: `${siteUrl}/contact-us`,
  },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/contact-us`,
    siteName: "FrameX Tech",
    type: "website",
    locale: "en_BD",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

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
