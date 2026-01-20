import type { Metadata } from "next";
import AboutUsContainer from "../_components/modules/about-us/AboutUsContainer";
import PageBottom from "../_components/shared/PageBottom";

const siteUrl = "https://www.framextech.com";

const title = "About Us | FrameX Tech - Affordable eCommerce Solutions in Bangladesh";
const description =
  "Learn about FrameX Tech - helping small businesses, F-commerce sellers, and startups build professional eCommerce websites in Bangladesh. Affordable solutions starting at ৳500/month.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: `${siteUrl}/about-us`,
  },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/about-us`,
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
