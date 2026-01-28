// Shared types for super admin

export type TenantStatus = "active" | "suspended" | "trial" | "inactive";
export type DeploymentStatus = "pending" | "active" | "failed" | "inactive";

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: TenantStatus;
  customDomain?: string;
  deploymentUrl?: string;
  subscriptionId?: string;
  settings?: {
    brandName?: string;
    logo?: string;
    theme?: {
      primaryColor?: string;
    };
    currency?: string;
    timezone?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantDeployment {
  id: string;
  tenantId: string;
  deploymentType: "subdomain" | "custom_domain";
  deploymentStatus: DeploymentStatus;
  deploymentUrl: string;
  deploymentProvider?: string;
  createdAt?: string;
}

export interface HeroSlide {
  id?: string;
  image: string;
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  textPosition?: "left" | "center" | "right";
  textColor?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  order?: number;
  enabled?: boolean;
}

export interface PromotionalBanner {
  id: string;
  enabled: boolean;
  text: string;
  link?: string;
  linkText?: string;
  backgroundColor?: string;
  textColor?: string;
}

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  buyPrice?: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  weight?: string;
  dimensions?: string;
  sku?: string;
  condition?: string;
  warranty?: string;
  tags?: string[];
  discountPercentage?: number;
  featured?: boolean;
  stock?: number;
  order?: number;
};

export interface ProductCategory {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FooterPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FooterCategory {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryTransactionType = "order" | "restock" | "adjustment" | "return";

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName?: string;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  orderId?: string;
  notes?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryOverview {
  totalProducts: number;
  totalStock: number;
  productsWithStock: number;
  lowStockProducts: number;
  lowStockThreshold: number;
  lowStockItems: Product[];
  outOfStockProducts?: number;
  productsOutOfStock: number;
  outOfStockItems: Product[];
  totalStockValue?: number;
  recentTransactions?: InventoryTransaction[];
}

