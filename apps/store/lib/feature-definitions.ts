// Feature Definitions - Single Source of Truth
// All available features that can be assigned to plans

export type FeatureType = "boolean" | "number" | "unlimited" | "string" | "array";

export interface FeatureDefinition {
  key: string; // Unique key (e.g., "max_products")
  name: string; // Display name (e.g., "Maximum Products")
  description: string;
  type: FeatureType;
  category: string; // e.g., "products", "storage", "domain", "analytics", "payment", "team", "support"
  defaultValue: boolean | number | string | string[] | "unlimited";
  options?: string[]; // For string/array types with predefined options
  unit?: string; // e.g., "GB", "items", "members"
  min?: number; // For number type
  max?: number; // For number type
}

/**
 * All available features that can be configured in plans
 * This is the single source of truth for features
 */
export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // ============================================
  // PRODUCT FEATURES
  // ============================================
  {
    key: "max_products",
    name: "Maximum Products",
    description: "Maximum number of products allowed",
    type: "number",
    category: "products",
    defaultValue: 0,
    unit: "products",
    min: 0,
  },
  {
    key: "max_categories",
    name: "Maximum Categories",
    description: "Maximum number of product categories",
    type: "number",
    category: "products",
    defaultValue: 0,
    unit: "categories",
    min: 0,
  },
  {
    key: "max_orders_per_month",
    name: "Monthly Order Limit",
    description: "Maximum orders per month",
    type: "number",
    category: "products",
    defaultValue: 0,
    unit: "orders",
    min: 0,
  },
  {
    key: "product_variants",
    name: "Product Variants",
    description: "Allow product variants (size, color, etc.)",
    type: "boolean",
    category: "products",
    defaultValue: false,
  },
  {
    key: "product_reviews",
    name: "Product Reviews",
    description: "Enable customer product reviews",
    type: "boolean",
    category: "products",
    defaultValue: false,
  },
  {
    key: "product_wishlist",
    name: "Wishlist Feature",
    description: "Enable customer wishlist functionality",
    type: "boolean",
    category: "products",
    defaultValue: false,
  },

  // ============================================
  // INVENTORY MANAGEMENT
  // ============================================
  {
    key: "inventory_management",
    name: "Inventory Management",
    description: "Advanced inventory tracking and management",
    type: "boolean",
    category: "inventory",
    defaultValue: false,
  },
  {
    key: "low_stock_alerts",
    name: "Low Stock Alerts",
    description: "Get alerts when inventory is low",
    type: "boolean",
    category: "inventory",
    defaultValue: false,
  },
  {
    key: "inventory_tracking",
    name: "Inventory Tracking",
    description: "Track inventory levels automatically",
    type: "boolean",
    category: "inventory",
    defaultValue: false,
  },
  {
    key: "multi_warehouse",
    name: "Multi-Warehouse",
    description: "Support for multiple warehouse locations",
    type: "boolean",
    category: "inventory",
    defaultValue: false,
  },
  {
    key: "inventory_reports",
    name: "Inventory Reports",
    description: "Advanced inventory reporting and analytics",
    type: "boolean",
    category: "inventory",
    defaultValue: false,
  },

  // ============================================
  // STORAGE FEATURES
  // ============================================
  {
    key: "max_storage_gb",
    name: "Storage Limit",
    description: "Maximum storage space in GB",
    type: "number",
    category: "storage",
    defaultValue: 0,
    unit: "GB",
    min: 0,
  },
  {
    key: "max_images",
    name: "Maximum Images",
    description: "Maximum number of images allowed",
    type: "number",
    category: "storage",
    defaultValue: 0,
    unit: "images",
    min: 0,
  },
  {
    key: "image_optimization",
    name: "Image Optimization",
    description: "Automatic image optimization and compression",
    type: "boolean",
    category: "storage",
    defaultValue: false,
  },
  {
    key: "cdn_access",
    name: "CDN Access",
    description: "Content Delivery Network for faster loading",
    type: "boolean",
    category: "storage",
    defaultValue: false,
  },

  // ============================================
  // DOMAIN & BRANDING
  // ============================================
  {
    key: "custom_domain",
    name: "Custom Domain",
    description: "Allow custom domain configuration",
    type: "boolean",
    category: "branding",
    defaultValue: false,
  },
  {
    key: "remove_branding",
    name: "Remove Branding",
    description: "Remove platform branding from store",
    type: "boolean",
    category: "branding",
    defaultValue: false,
  },
  {
    key: "white_label",
    name: "White Label",
    description: "White label option",
    type: "boolean",
    category: "branding",
    defaultValue: false,
  },
  {
    key: "custom_logo",
    name: "Custom Logo",
    description: "Upload and use custom logo",
    type: "boolean",
    category: "branding",
    defaultValue: false,
  },
  {
    key: "custom_theme",
    name: "Custom Theme",
    description: "Customize store theme and colors",
    type: "boolean",
    category: "branding",
    defaultValue: false,
  },
  {
    key: "hero_slides",
    name: "Hero Slides",
    description: "Create and manage hero banner slides",
    type: "boolean",
    category: "branding",
    defaultValue: false,
  },
  {
    key: "promotional_banner",
    name: "Promotional Banner",
    description: "Add promotional banners to store",
    type: "boolean",
    category: "branding",
    defaultValue: false,
  },
  {
    key: "max_hero_slides",
    name: "Maximum Hero Slides",
    description: "Maximum number of hero slides",
    type: "number",
    category: "branding",
    defaultValue: 1,
    unit: "slides",
    min: 1,
  },
  {
    key: "custom_favicon",
    name: "Custom Favicon",
    description: "Upload custom favicon",
    type: "boolean",
    category: "branding",
    defaultValue: false,
  },

  // ============================================
  // PAYMENT GATEWAYS
  // ============================================
  {
    key: "payment_gateways",
    name: "Payment Gateways",
    description: "Number of payment gateways allowed",
    type: "number",
    category: "payment",
    defaultValue: 0,
    unit: "gateways",
    min: 0,
  },
  {
    key: "payment_methods",
    name: "Payment Methods",
    description: "Available payment methods",
    type: "array",
    category: "payment",
    defaultValue: [],
    options: ["card", "bank_transfer", "cash_on_delivery", "wallet", "crypto", "installments"],
  },
  {
    key: "payment_gateway_types",
    name: "Payment Gateway Types",
    description: "Types of payment gateways available",
    type: "array",
    category: "payment",
    defaultValue: [],
    options: ["sslcommerz", "stripe", "paypal", "razorpay", "square", "custom"],
  },
  {
    key: "recurring_payments",
    name: "Recurring Payments",
    description: "Support for subscription/recurring payments",
    type: "boolean",
    category: "payment",
    defaultValue: false,
  },
  {
    key: "payment_analytics",
    name: "Payment Analytics",
    description: "Advanced payment analytics and reports",
    type: "boolean",
    category: "payment",
    defaultValue: false,
  },
  {
    key: "refund_management",
    name: "Refund Management",
    description: "Automated refund processing",
    type: "boolean",
    category: "payment",
    defaultValue: false,
  },

  // ============================================
  // SEO FEATURES
  // ============================================
  {
    key: "seo_basic",
    name: "Basic SEO",
    description: "Basic SEO features (meta tags, descriptions)",
    type: "boolean",
    category: "seo",
    defaultValue: false,
  },
  {
    key: "seo_advanced",
    name: "Advanced SEO",
    description: "Advanced SEO features (sitemap, robots.txt, schema markup)",
    type: "boolean",
    category: "seo",
    defaultValue: false,
  },
  {
    key: "custom_meta_tags",
    name: "Custom Meta Tags",
    description: "Add custom meta tags per page/product",
    type: "boolean",
    category: "seo",
    defaultValue: false,
  },
  {
    key: "sitemap_generation",
    name: "Sitemap Generation",
    description: "Automatic sitemap generation",
    type: "boolean",
    category: "seo",
    defaultValue: false,
  },
  {
    key: "robots_txt",
    name: "Robots.txt Control",
    description: "Customize robots.txt file",
    type: "boolean",
    category: "seo",
    defaultValue: false,
  },
  {
    key: "schema_markup",
    name: "Schema Markup",
    description: "Structured data (JSON-LD) for products",
    type: "boolean",
    category: "seo",
    defaultValue: false,
  },
  {
    key: "seo_analytics",
    name: "SEO Analytics",
    description: "SEO performance tracking and analytics",
    type: "boolean",
    category: "seo",
    defaultValue: false,
  },
  {
    key: "url_customization",
    name: "URL Customization",
    description: "Custom URL slugs for products and pages",
    type: "boolean",
    category: "seo",
    defaultValue: false,
  },

  // ============================================
  // ANALYTICS & TRACKING
  // ============================================
  {
    key: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Access to advanced analytics dashboard",
    type: "boolean",
    category: "analytics",
    defaultValue: false,
  },
  {
    key: "ads_tracking_platforms",
    name: "Ads Tracking Platforms",
    description: "Available ads tracking platforms",
    type: "array",
    category: "analytics",
    defaultValue: [],
    options: ["meta", "tiktok", "gtm", "ga4", "pinterest", "snapchat", "linkedin", "custom"],
  },
  {
    key: "sales_reports",
    name: "Sales Reports",
    description: "Detailed sales reports and insights",
    type: "boolean",
    category: "analytics",
    defaultValue: false,
  },
  {
    key: "customer_analytics",
    name: "Customer Analytics",
    description: "Customer behavior and analytics",
    type: "boolean",
    category: "analytics",
    defaultValue: false,
  },
  {
    key: "export_reports",
    name: "Export Reports",
    description: "Export reports to CSV/Excel",
    type: "boolean",
    category: "analytics",
    defaultValue: false,
  },

  // ============================================
  // ORDERS & FULFILLMENT
  // ============================================
  {
    key: "order_management",
    name: "Order Management",
    description: "Full order management system",
    type: "boolean",
    category: "orders",
    defaultValue: true,
  },
  {
    key: "order_tracking",
    name: "Order Tracking",
    description: "Customer order tracking",
    type: "boolean",
    category: "orders",
    defaultValue: false,
  },
  {
    key: "order_notifications",
    name: "Order Notifications",
    description: "Email/SMS notifications for orders",
    type: "boolean",
    category: "orders",
    defaultValue: false,
  },
  {
    key: "order_analytics",
    name: "Order Analytics",
    description: "Category statistics and order analytics",
    type: "boolean",
    category: "orders",
    defaultValue: false,
  },
  {
    key: "bulk_order_actions",
    name: "Bulk Order Actions",
    description: "Bulk update and manage orders",
    type: "boolean",
    category: "orders",
    defaultValue: false,
  },

  // ============================================
  // PAGES & CONTENT
  // ============================================
  {
    key: "custom_pages",
    name: "Custom Pages",
    description: "Create custom footer pages (About, Terms, etc.)",
    type: "boolean",
    category: "content",
    defaultValue: false,
  },
  {
    key: "max_custom_pages",
    name: "Maximum Custom Pages",
    description: "Maximum number of custom pages",
    type: "number",
    category: "content",
    defaultValue: 0,
    unit: "pages",
    min: 0,
  },
  {
    key: "page_builder",
    name: "Page Builder",
    description: "Visual page builder for custom pages",
    type: "boolean",
    category: "content",
    defaultValue: false,
  },
  {
    key: "blog",
    name: "Blog",
    description: "Blog functionality for content marketing",
    type: "boolean",
    category: "content",
    defaultValue: false,
  },
  {
    key: "max_blog_posts",
    name: "Maximum Blog Posts",
    description: "Maximum number of blog posts",
    type: "number",
    category: "content",
    defaultValue: 0,
    unit: "posts",
    min: 0,
  },

  // ============================================
  // AUTHENTICATION & USERS
  // ============================================
  {
    key: "oauth_login",
    name: "OAuth Login",
    description: "Social login (Google, Facebook, etc.)",
    type: "boolean",
    category: "auth",
    defaultValue: false,
  },
  {
    key: "oauth_providers",
    name: "OAuth Providers",
    description: "Available OAuth providers",
    type: "array",
    category: "auth",
    defaultValue: [],
    options: ["google", "facebook", "github", "apple", "twitter"],
  },
  {
    key: "customer_accounts",
    name: "Customer Accounts",
    description: "Customer account management",
    type: "boolean",
    category: "auth",
    defaultValue: true,
  },
  {
    key: "guest_checkout",
    name: "Guest Checkout",
    description: "Allow checkout without account",
    type: "boolean",
    category: "auth",
    defaultValue: true,
  },

  // ============================================
  // TEAM & ACCESS
  // ============================================
  {
    key: "team_members",
    name: "Team Members",
    description: "Maximum number of team members",
    type: "number",
    category: "team",
    defaultValue: 1,
    unit: "members",
    min: 1,
  },
  {
    key: "api_access",
    name: "API Access",
    description: "API access level",
    type: "string",
    category: "team",
    defaultValue: "none",
    options: ["none", "limited", "full"],
  },
  {
    key: "role_permissions",
    name: "Role Permissions",
    description: "Custom role and permission management",
    type: "boolean",
    category: "team",
    defaultValue: false,
  },
  {
    key: "api_rate_limit",
    name: "API Rate Limit",
    description: "API requests per hour (for limited access)",
    type: "number",
    category: "team",
    defaultValue: 100,
    unit: "requests/hour",
    min: 0,
  },

  // ============================================
  // SUPPORT
  // ============================================
  {
    key: "support_level",
    name: "Support Level",
    description: "Level of customer support",
    type: "string",
    category: "support",
    defaultValue: "email",
    options: ["email", "priority", "24/7"],
  },
  {
    key: "support_tickets",
    name: "Support Tickets",
    description: "Support ticket system",
    type: "boolean",
    category: "support",
    defaultValue: false,
  },
  {
    key: "live_chat",
    name: "Live Chat",
    description: "Live chat support",
    type: "boolean",
    category: "support",
    defaultValue: false,
  },
  {
    key: "phone_support",
    name: "Phone Support",
    description: "Phone support availability",
    type: "boolean",
    category: "support",
    defaultValue: false,
  },

  // ============================================
  // DATA & EXPORT
  // ============================================
  {
    key: "export_data",
    name: "Data Export",
    description: "Allow exporting store data",
    type: "boolean",
    category: "data",
    defaultValue: false,
  },
  {
    key: "data_backup",
    name: "Data Backup",
    description: "Automatic data backup",
    type: "boolean",
    category: "data",
    defaultValue: false,
  },
  {
    key: "data_import",
    name: "Data Import",
    description: "Import products/orders from CSV",
    type: "boolean",
    category: "data",
    defaultValue: false,
  },
  {
    key: "export_formats",
    name: "Export Formats",
    description: "Available export formats",
    type: "array",
    category: "data",
    defaultValue: [],
    options: ["csv", "excel", "json", "pdf"],
  },
];

/**
 * Get feature definition by key
 */
export function getFeatureDefinition(key: string): FeatureDefinition | undefined {
  return FEATURE_DEFINITIONS.find((f) => f.key === key);
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: string): FeatureDefinition[] {
  return FEATURE_DEFINITIONS.filter((f) => f.category === category);
}

/**
 * Get all categories
 */
export function getFeatureCategories(): string[] {
  return Array.from(new Set(FEATURE_DEFINITIONS.map((f) => f.category)));
}

/**
 * Validate feature value against definition
 */
export function validateFeatureValue(
  definition: FeatureDefinition,
  value: any
): boolean {
  switch (definition.type) {
    case "boolean":
      return typeof value === "boolean";
    case "number":
      if (typeof value !== "number") return false;
      if (definition.min !== undefined && value < definition.min) return false;
      if (definition.max !== undefined && value > definition.max) return false;
      return true;
    case "unlimited":
      return value === "unlimited" || typeof value === "number";
    case "string":
      if (typeof value !== "string") return false;
      if (definition.options && !definition.options.includes(value)) return false;
      return true;
    case "array":
      if (!Array.isArray(value)) return false;
      if (definition.options) {
        return value.every((item) => definition.options?.includes(item));
      }
      return true;
    default:
      return false;
  }
}
