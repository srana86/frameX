import type { Metadata } from "next";
import HomeContainer from "./_components/modules/home/HomeContainer";

const siteUrl = "https://www.framextech.com";

const title = "FrameX Tech – eCommerce Website Builder in Bangladesh";

const description =
  "FrameX Tech helps small business owners, F-commerce sellers, and startups build professional eCommerce websites in Bangladesh with custom design, payment gateway setup, and ongoing support.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,

  keywords: [
    // HIGH BUYING INTENT (MOST IMPORTANT)
    "ecommerce website builder Bangladesh",
    "ecommerce website development Bangladesh",
    "ecommerce website design Bangladesh",
    "ecommerce website price Bangladesh",
    "cheap ecommerce website Bangladesh",
    "affordable ecommerce website Bangladesh",
    "ecommerce website in 500 taka per month",

    // AGENCY / COMPANY INTENT
    "ecommerce website agency Bangladesh",
    "ecommerce development company Bangladesh",
    "online store development Bangladesh",
    "website builder for small business Bangladesh",
    "best ecommerce website builder Bangladesh",

    // F-COMMERCE / FACEBOOK SELLERS
    "facebook business to ecommerce website",
    "f commerce to ecommerce Bangladesh",
    "website for facebook page business Bangladesh",
    "facebook seller online store Bangladesh",

    // LOCAL PAYMENT INTENT
    "bkash payment ecommerce website",
    "nagad payment ecommerce website",
    "sslcommerz ecommerce integration",
    "cash on delivery ecommerce website Bangladesh",

    // INDUSTRY INTENT
    "fashion ecommerce website Bangladesh",
    "cosmetics ecommerce website Bangladesh",
    "electronics ecommerce website Bangladesh",
    "grocery ecommerce website Bangladesh",
    "food order website Bangladesh",

    // BRAND
    "FrameX Tech",
    "FrameX Tech ecommerce",
    "FrameX ecommerce platform Bangladesh",
  ],

  alternates: {
    canonical: siteUrl,
    languages: {
      "en-BD": siteUrl,
    },
  },

  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "FrameX Tech",
    type: "website",
    locale: "en_BD",
    images: [
      {
        url: `${siteUrl}/socialshare/socialshare.avif`,
        width: 1200,
        height: 630,
        alt: "FrameX Tech - Affordable eCommerce Website Builder in Bangladesh (৳500/month)",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/socialshare/socialshare.avif`],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "technology",
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // =========================================================
      // Organization (Primary Brand Entity)
      // =========================================================
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "FrameX Tech",
        alternateName: ["FrameX"],
        url: siteUrl,
        email: "support@framextech.com",
        foundingDate: "2025-12",
        logo: `${siteUrl}/logo/framex-white.png`,
        image: `${siteUrl}/logo/framex-white.png`,
        sameAs: ["https://www.facebook.com/framextech"],
        knowsAbout: [
          "eCommerce website development",
          "eCommerce website design",
          "Online store setup in Bangladesh",
          "Payment gateway integration",
          "Cash on delivery eCommerce workflow",
          "F-commerce to eCommerce website migration",
        ],
        areaServed: "Bangladesh",
      },

      // =========================================================
      // Website (Site Entity)
      // =========================================================
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "FrameX Tech",
        description,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: ["en-BD", "bn-BD"],
      },

      // =========================================================
      // WebPage (Homepage)
      // =========================================================
      {
      "@type": "WebPage",
      "@id": `${siteUrl}/#home`,
        url: siteUrl,
        name: title,
        description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
        primaryImageOfPage: `${siteUrl}/socialshare/socialshare.avif`,
        inLanguage: "en-BD",
      },

      // =========================================================
      // LocalBusiness (Local trust + still serves whole Bangladesh)
      // Best practice: show real locality (Bogura) + areaServed BD
      // =========================================================
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#localbusiness`,
        name: "FrameX Tech",
        url: siteUrl,
        image: { "@id": `${siteUrl}/#logo` },
        email: "support@framextech.com",
        foundingDate: "2025-12",
        address: "Bogura, Rajshahi Division, BD",
        areaServed: "Bangladesh",
        // If you later add phone number:
        // "telephone": "+8801XXXXXXXXX",
        // If you later add office hours:
        // "openingHours": "Sa-Th 10:00-20:00"
      },

      // =========================================================
      // Main Service (Core Offering)
      // =========================================================
      {
        "@type": "Service",
        "@id": `${siteUrl}/#service`,
        name: "eCommerce Website Builder & Development in Bangladesh",
        serviceType: "eCommerce Website Development",
        description:
          "Affordable eCommerce website building and development in Bangladesh with custom design, product setup, payment and delivery workflow, and ongoing support.",
        provider: { "@id": `${siteUrl}/#organization` },
        areaServed: "Bangladesh",
      },
    ],
  };

  return (
    <div>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeContainer />
    </div>
  );
}
