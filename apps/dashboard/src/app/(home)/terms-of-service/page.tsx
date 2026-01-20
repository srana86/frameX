import type { Metadata } from "next";
import TermsOfServiceContainer from "../_components/modules/terms-of-service/TermsOfServiceContainer";

const siteUrl = "https://www.framextech.com";

const title = "Terms of Service | FrameX Tech";
const description =
  "Read FrameX Tech's Terms of Service. Understand the terms and conditions for using our eCommerce website building and development services in Bangladesh.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: `${siteUrl}/terms-of-service`,
  },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/terms-of-service`,
    siteName: "FrameX Tech",
    type: "website",
    locale: "en_BD",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <div>
      <TermsOfServiceContainer />
    </div>
  );
}
