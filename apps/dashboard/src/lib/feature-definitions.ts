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
    key: "payment_analytics",
    name: "Payment Analytics",
    description: "Advanced payment analytics and reports",
    type: "boolean",
    category: "payment",
    defaultValue: false,
  },

  // ============================================
  // ANALYTICS & TRACKING
  // ============================================
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
export function validateFeatureValue(definition: FeatureDefinition, value: any): boolean {
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
