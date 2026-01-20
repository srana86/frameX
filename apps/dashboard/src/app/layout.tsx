import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Nunito_Sans, Urbanist } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import ClientEffects from "./components/ClientEffects";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = "https://www.framextech.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Affordable eCommerce Website Builder in Bangladesh | FrameX Tech",
    template: "%s | FrameX Tech",
  },

  description:
    "FrameX Tech helps small business owners, F-commerce sellers, and startups build professional eCommerce websites in Bangladesh. Get your online store with custom design, payment gateway, and support starting at just ৳500 per month.",

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
    languages: {
      "en-BD": siteUrl,
    },
  },

  openGraph: {
    title: "Affordable eCommerce Website Builder in Bangladesh | FrameX Tech",
    description:
      "Build your online store in Bangladesh starting at ৳500/month. Custom design, bKash & Nagad payment, delivery setup, and full support included.",
    url: siteUrl,
    siteName: "FrameX Tech",
    type: "website",
    locale: "en_BD",
    images: [
      {
        url: `${siteUrl}/socialshare/socialshare.avif`,

        width: 1200,
        height: 630,
        alt: "Affordable eCommerce Website Builder in Bangladesh - FrameX Tech",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Build eCommerce Website in Bangladesh from ৳500/Month | FrameX Tech",
    description: "Perfect for small businesses & Facebook sellers. Launch your online shop with payments & delivery.",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en-BD'>
      <head>
        <link rel='preconnect' href='https://i.ibb.co.com' />
        <link rel='preconnect' href='https://cdn.jsdelivr.net' crossOrigin='anonymous' />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${nunitoSans.variable} ${urbanist.variable} antialiased`}>
        <AuthProvider>
          <ClientEffects />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
