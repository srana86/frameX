import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // Enable modern image formats
    formats: ["image/avif", "image/webp"],
    // Optimize device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 30 days
    minimumCacheTTL: 2592000,
  },
  // Performance optimizations
  experimental: {
    // Reduce memory usage by optimizing package imports
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-popover",
    ],
    // Increase body size limit for server actions (file uploads)
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Enable compression
  compress: true,
  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,
  // Enable strict mode for better React practices
  reactStrictMode: true,
  // Power by header (optional - can remove for security)
  poweredByHeader: false,
};

export default nextConfig;
