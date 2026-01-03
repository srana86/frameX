import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";
import { CartProvider } from "@/components/providers/cart-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import { BrandLoaderWrapper } from "@/components/admin/BrandLoaderWrapper";
import { TrackingScripts } from "@/components/site/TrackingScripts";
import { SourceTracker } from "@/components/site/SourceTracker";
import { VisitTracker } from "@/components/site/VisitTracker";
import { defaultBrandConfig, type BrandConfig } from "@/lib/brand-config";
import { loadMerchantDocument } from "@/lib/merchant-data-loader";
import { getAdsConfig } from "@/lib/ads-config";
import { hexToOklch } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BRAND_CONFIG_ID = "brand_config_v1";

async function getBrandConfig(): Promise<BrandConfig> {
  try {
    // Use merchant-aware loader to get the correct brand config for the current merchant
    const doc = await loadMerchantDocument<any>("brand_config", { id: BRAND_CONFIG_ID });
    if (doc) {
      const { _id, ...config } = doc;
      return config as BrandConfig;
    }
  } catch (error) {
    console.error("Error fetching brand config:", error);
  }
  return defaultBrandConfig;
}

// Helper function to convert relative URLs to absolute URLs
function getAbsoluteUrl(url: string | undefined, metadataBase: URL): string | undefined {
  if (!url || url.trim() === "") return undefined;
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }
  // If it starts with /, it's a relative path
  if (trimmedUrl.startsWith("/")) {
    return new URL(trimmedUrl, metadataBase).toString();
  }
  // Otherwise, assume it's already absolute or treat as relative
  return new URL(trimmedUrl.startsWith("./") ? trimmedUrl.slice(2) : trimmedUrl, metadataBase).toString();
}

export async function generateMetadata(): Promise<Metadata> {
  const brandConfig = await getBrandConfig();

  // Get current host from request headers for dynamic metadataBase
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  // Get absolute URLs for images (filter out empty strings)
  const socialShareImage = brandConfig.meta.socialShareImage || brandConfig.meta.openGraph.image || brandConfig.meta.twitter.image;
  const absoluteSocialImage =
    socialShareImage && socialShareImage.trim() !== "" ? getAbsoluteUrl(socialShareImage, metadataBase) : undefined;

  // Get absolute URLs for favicons
  const faviconPath = brandConfig.favicon.path
    ? getAbsoluteUrl(brandConfig.favicon.path, metadataBase) || brandConfig.favicon.path
    : "/favicon.ico";
  const appleTouchIcon = brandConfig.favicon.appleTouchIcon
    ? getAbsoluteUrl(brandConfig.favicon.appleTouchIcon, metadataBase) || brandConfig.favicon.appleTouchIcon
    : faviconPath;
  const manifestIcon = brandConfig.favicon.manifestIcon
    ? getAbsoluteUrl(brandConfig.favicon.manifestIcon, metadataBase) || brandConfig.favicon.manifestIcon
    : null;

  // Build icons array
  const iconArray: Array<{ url: string; type?: string; sizes?: string }> = [{ url: faviconPath, type: "image/x-icon" }];
  if (manifestIcon) {
    iconArray.push({ url: manifestIcon, sizes: "192x192", type: "image/png" });
  }

  const openGraph: Metadata["openGraph"] = {
    title: brandConfig.meta.openGraph.title || brandConfig.meta.title.default,
    description: brandConfig.meta.openGraph.description || brandConfig.meta.description,
    type: (brandConfig.meta.openGraph.type || "website") as "website",
    locale: brandConfig.meta.openGraph.locale || "en_US",
    url: "/",
    siteName: brandConfig.meta.openGraph.siteName || brandConfig.brandName,
  };

  if (absoluteSocialImage) {
    openGraph.images = [{ url: absoluteSocialImage }];
  }

  const twitter: Metadata["twitter"] = {
    card: (brandConfig.meta.twitter.card || "summary_large_image") as "summary_large_image",
    title: brandConfig.meta.twitter.title || brandConfig.meta.title.default,
    description: brandConfig.meta.twitter.description || brandConfig.meta.description,
  };

  if (absoluteSocialImage) {
    twitter.images = [absoluteSocialImage];
  }

  return {
    title: {
      default: brandConfig.meta.title.default,
      template: brandConfig.meta.title.template,
    },
    description: brandConfig.meta.description,
    metadataBase,
    keywords: Array.isArray(brandConfig.meta.keywords) ? brandConfig.meta.keywords.join(", ") : brandConfig.meta.keywords,
    openGraph,
    twitter,
    icons: {
      icon: iconArray,
      apple: appleTouchIcon ? [{ url: appleTouchIcon }] : undefined,
      shortcut: faviconPath,
    },
    other: {
      "theme-color": brandConfig.theme.primaryColor,
    },
  };
}

// Note: viewport must be static, but we'll set theme-color dynamically in the head
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brandConfig = await getBrandConfig();
  const adsConfig = await getAdsConfig();

  // Apply theme color immediately via style tag to prevent FOUC
  const themeColorOklch = hexToOklch(brandConfig.theme.primaryColor);

  // Get absolute URLs for favicons (same logic as in generateMetadata)
  const metadataBaseUrl = brandConfig.meta.metadataBase || "https://shoestore.local";
  const faviconPath = brandConfig.favicon.path
    ? brandConfig.favicon.path.startsWith("http")
      ? brandConfig.favicon.path
      : brandConfig.favicon.path.startsWith("/")
      ? new URL(brandConfig.favicon.path, metadataBaseUrl).toString()
      : brandConfig.favicon.path
    : "/favicon.ico";

  const appleTouchIcon = brandConfig.favicon.appleTouchIcon
    ? brandConfig.favicon.appleTouchIcon.startsWith("http")
      ? brandConfig.favicon.appleTouchIcon
      : brandConfig.favicon.appleTouchIcon.startsWith("/")
      ? new URL(brandConfig.favicon.appleTouchIcon, metadataBaseUrl).toString()
      : brandConfig.favicon.appleTouchIcon
    : faviconPath;

  const manifestIcon = brandConfig.favicon.manifestIcon
    ? brandConfig.favicon.manifestIcon.startsWith("http")
      ? brandConfig.favicon.manifestIcon
      : brandConfig.favicon.manifestIcon.startsWith("/")
      ? new URL(brandConfig.favicon.manifestIcon, metadataBaseUrl).toString()
      : brandConfig.favicon.manifestIcon
    : null;

  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${themeColorOklch};
                --sidebar-primary: ${themeColorOklch};
              }
            `,
          }}
        />
        {/* Inject favicon and icon link tags dynamically with cache-busting */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var head = document.getElementsByTagName('head')[0];
                var timestamp = '?v=' + Date.now();
                
                // Helper to add cache-busting to URL if it doesn't already have query params
                function addCacheBust(url) {
                  if (!url) return url;
                  if (url.includes('?') || url.includes('#')) return url;
                  return url + timestamp;
                }
                
                var faviconUrl = addCacheBust('${faviconPath}');
                var appleUrl = addCacheBust('${appleTouchIcon}');
                ${manifestIcon ? `var manifestUrl = addCacheBust('${manifestIcon}');` : ""}
                
                // Remove existing favicon links to force refresh
                var existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
                existingFavicons.forEach(function(link) {
                  link.remove();
                });
                
                // Create new favicon link
                var faviconLink = document.createElement('link');
                faviconLink.rel = 'icon';
                faviconLink.type = 'image/x-icon';
                faviconLink.href = faviconUrl;
                head.appendChild(faviconLink);
                
                // Create shortcut icon
                var shortcutLink = document.createElement('link');
                shortcutLink.rel = 'shortcut icon';
                shortcutLink.href = faviconUrl;
                head.appendChild(shortcutLink);
                
                // Remove existing apple-touch-icon
                var existingApple = document.querySelector('link[rel="apple-touch-icon"]');
                if (existingApple) existingApple.remove();
                
                // Create new apple-touch-icon
                var appleLink = document.createElement('link');
                appleLink.rel = 'apple-touch-icon';
                appleLink.href = appleUrl;
                head.appendChild(appleLink);
                
                ${
                  manifestIcon
                    ? `
                // Remove existing manifest icon
                var existingManifest = document.querySelector('link[rel="icon"][sizes="192x192"]');
                if (existingManifest) existingManifest.remove();
                
                // Create new manifest icon
                var manifestLink = document.createElement('link');
                manifestLink.rel = 'icon';
                manifestLink.type = 'image/png';
                manifestLink.sizes = '192x192';
                manifestLink.href = manifestUrl;
                head.appendChild(manifestLink);
                `
                    : ""
                }
                
                // Update theme-color meta tag
                var meta = document.querySelector('meta[name="theme-color"]');
                if (!meta) {
                  meta = document.createElement('meta');
                  meta.name = 'theme-color';
                  head.appendChild(meta);
                }
                meta.content = '${brandConfig.theme.primaryColor}';
              })();
            `,
          }}
        />
        <BrandLoaderWrapper brandConfig={brandConfig} />
        <TrackingScripts adsConfig={adsConfig} />
        <Suspense fallback={null}>
          <SourceTracker />
          <VisitTracker />
        </Suspense>
        <ThemeProvider primaryColor={brandConfig.theme.primaryColor} />
        <CartProvider>
          <WishlistProvider>
            <Analytics />
            {children}
            <Toaster richColors closeButton position='top-right' />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
