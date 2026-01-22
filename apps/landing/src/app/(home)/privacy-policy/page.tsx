import type { Metadata } from "next";
import PrivacyPolicyContainer from "../_components/modules/privacy-policy/PrivacyPolicyContainer";

const siteUrl = "https://www.framextech.com";

const title = "Privacy Policy | FrameX Tech";
const description =
  "Read FrameX Tech's Privacy Policy. Learn how we collect, use, and protect your personal information when you use our eCommerce website building services.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/privacy-policy`,
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

export default function PrivacyPolicyPage() {
  return (
    <div>
      <PrivacyPolicyContainer />
    </div>
  );
}
