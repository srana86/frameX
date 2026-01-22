import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.framextech.com",
      },
    ],
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: "FrameX Admin",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_ADMIN_URL || "http://admin.localhost:3002",
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Strict mode for development
  reactStrictMode: true,
};

export default nextConfig;
