export interface BrandConfig {
  // Tenant Identifier (for connecting to super-admin)
  tenantId?: string;

  // Brand Identity
  brandName: string;
  brandTagline?: string;

  // Logo Configuration
  logo: {
    type: "image" | "text";
    // Logo style for text logos: "default" | "icon-text" | "gradient" | "minimal" | "badge" | "monogram"
    style?:
    | "default"
    | "icon-text"
    | "gradient"
    | "minimal"
    | "badge"
    | "monogram";
    // If type is 'image', provide the path to the logo image
    imagePath?: string;
    // If type is 'text', provide the text to display
    text?: {
      primary: string;
      secondary?: string;
    };
    // Icon configuration for icon-text style (XPIPS style)
    icon?: {
      // Image path for icon (takes precedence over symbol if provided)
      imagePath?: string;
      // Symbol to display in icon (e.g., "X", "S", "A", or custom SVG character) - fallback if no image
      symbol?: string;
      // Background color for icon square
      backgroundColor?: string;
      // Icon/symbol color (usually white or light) - only used for symbol, not image
      iconColor?: string;
      // Icon size variant: "sm" | "md" | "lg"
      size?: "sm" | "md" | "lg";
      // Border radius for icon container: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "full"
      borderRadius?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "full";
    };
    // Style-specific colors
    colors?: {
      primary?: string;
      secondary?: string;
      gradientFrom?: string;
      gradientTo?: string;
    };
    // Alt text for logo image
    altText?: string;
  };

  // Favicon
  favicon: {
    path: string;
    // Optional: different favicons for different devices
    appleTouchIcon?: string;
    manifestIcon?: string;
  };

  // Meta Tags & SEO
  meta: {
    title: {
      default: string;
      template: string;
    };
    description: string;
    keywords: string[];
    metadataBase: string;
    socialShareImage?: string;
    openGraph: {
      title: string;
      description: string;
      type: string;
      locale: string;
      siteName: string;
      image?: string;
    };
    twitter: {
      card: string;
      title: string;
      description: string;
      image?: string;
    };
  };

  // Contact Information
  contact: {
    email: string;
    phone: string;
    address: string;
  };

  // Social Media Links
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };

  // Footer Content
  footer: {
    description: string;
    copyrightText?: string;
  };

  // Theme Colors (for favicon theme-color)
  theme: {
    primaryColor: string;
  };

  // Currency Settings
  currency: {
    iso: string; // ISO 4217 currency code (e.g., "USD", "EUR", "GBP")
  };
}

// Default Configuration - Fallback if database config doesn't exist
export const defaultBrandConfig: BrandConfig = {
  brandName: "ShoeStore",
  brandTagline: "Modern Footwear Shop",

  logo: {
    type: "text",
    style: "default",
    text: {
      primary: "Shoe",
      secondary: "Store",
    },
    altText: "ShoeStore Logo",
    icon: {
      symbol: "S",
      backgroundColor: "#000000",
      iconColor: "#ffffff",
      size: "md",
      borderRadius: "md",
    },
    colors: {
      primary: "#000000",
      secondary: "#ffffff",
      gradientFrom: "#000000",
      gradientTo: "#ffffff",
    },
  },

  favicon: {
    path: "/favicon.ico",
    appleTouchIcon: "/favicon.ico",
    manifestIcon: "/favicon.ico",
  },

  meta: {
    title: {
      default: "ShoeStore – Modern Footwear Shop",
      template: "%s | ShoeStore",
    },
    description:
      "Discover sleek and comfortable shoes. Shop sneakers, runners, and classics with fast checkout and cash on delivery.",
    keywords: [
      "shoes",
      "sneakers",
      "footwear",
      "running shoes",
      "casual",
      "ecommerce",
    ],
    metadataBase: "", // Dynamic: determined from request headers
    socialShareImage: "",
    openGraph: {
      title: "ShoeStore – Modern Footwear Shop",
      description:
        "Discover sleek and comfortable shoes. Shop sneakers, runners, and classics with fast checkout and cash on delivery.",
      type: "website",
      locale: "en_US",
      siteName: "ShoeStore",
      image: "",
    },
    twitter: {
      card: "summary_large_image",
      title: "ShoeStore – Modern Footwear Shop",
      description:
        "Discover sleek and comfortable shoes. Shop sneakers, runners, and classics with fast checkout and cash on delivery.",
      image: "",
    },
  },

  contact: {
    email: "support@shoestore.com",
    phone: "+1 (555) 123-4567",
    address: "123 Fashion St, NY 10001",
  },

  social: {
    facebook: "#",
    twitter: "#",
    instagram: "#",
    youtube: "#",
  },

  footer: {
    description:
      "Discover premium footwear that combines style, comfort, and quality. Your perfect pair awaits.",
    copyrightText: `© ${new Date().getFullYear()} ShoeStore. All rights reserved.`,
  },

  theme: {
    primaryColor: "#000000",
  },

  currency: {
    iso: "USD", // Default to USD
  },
};

// Client-safe export - uses default config
// For dynamic config from database, use the /api/brand-config API route
export const brandConfig: BrandConfig = defaultBrandConfig;

/**
 * Helper function to get the full brand name
 */
export function getBrandName(): string {
  return brandConfig.brandName;
}

/**
 * Helper function to get the logo display component props
 */
export function getLogoProps() {
  return brandConfig.logo;
}

/**
 * Helper function to get meta tags configuration
 */
export function getMetaConfig() {
  return brandConfig.meta;
}
