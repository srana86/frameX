export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  buyPrice?: number; // Cost price for profit calculations
  images: string[];
  sizes?: string[];
  colors?: string[]; // Product color options
  materials?: string[]; // Material options (e.g., "Cotton", "Leather", "Plastic")
  weight?: string; // Product weight (e.g., "500g", "1.2kg")
  dimensions?: string; // Product dimensions (e.g., "10x5x3 cm")
  sku?: string; // Stock Keeping Unit
  condition?: string; // Product condition (e.g., "New", "Refurbished", "Used")
  warranty?: string; // Warranty information
  tags?: string[]; // Additional tags for filtering/search
  discountPercentage?: number; // Discount percentage (0-100)
  featured?: boolean;
  stock?: number;
  order?: number; // Display order within category
};

export type CartLineItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  category?: string; // Product category for tracking
};

export type OrderStatus =
  | "pending"
  | "waiting_for_confirmation"
  | "confirmed"
  | "processing"
  | "restocking"
  | "packed"
  | "sent_to_logistics"
  | "shipped"
  | "delivered"
  | "cancelled";

export type CustomerInfo = {
  fullName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  notes?: string;
};

export type PaymentMethod = "cod" | "online";
export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled" | "refunded";
export type OrderType = "online" | "offline";

export type CourierServiceId = "pathao" | "steadfast" | "redx" | "paperfly" | (string & {});

export type OrderCourierInfo = {
  serviceId: CourierServiceId;
  serviceName?: string;
  consignmentId: string; // Courier's tracking ID (e.g., Pathao consignment_id)
  merchantOrderId?: string; // Your custom order ID sent to courier (e.g., "SHO-3K9M2P7")
  deliveryStatus?: string;
  lastSyncedAt?: string;
  rawStatus?: any;
};

export type FraudCheckData = {
  phone: string;
  total_parcels: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  fraud_risk: "low" | "medium" | "high" | "unknown";
  last_delivery?: string;
  courier_history?: Array<{
    courier: string;
    total: number;
    successful: number;
    failed: number;
    success_rate?: number;
    logo?: string;
  }>;
  checkedAt?: string;
};

export type SourceTrackingData = {
  // Facebook Click ID
  fbclid?: string;

  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;

  // Other tracking parameters
  gclid?: string; // Google Click ID
  ref?: string; // Referrer

  // Timestamp when first captured
  firstSeenAt?: string;

  // Landing page URL
  landingPage?: string;
};

export type IpGeolocationData = {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  capturedAt: string;
};

export type OrderTimelineEvent = {
  status: OrderStatus;
  timestamp: string;
  note?: string; // Optional note about the status change
};

export type Order = {
  id: string;
  customOrderId?: string; // Custom order ID for display (format: BRD-XXXXXXX, e.g., "NIK-2A4B7X9")
  createdAt: string;
  status: OrderStatus;
  orderType?: OrderType; // Order type: online or offline
  items: CartLineItem[];
  subtotal: number;
  discountPercentage?: number; // Discount percentage (0-100)
  discountAmount?: number; // Discount amount in currency
  vatTaxPercentage?: number; // VAT/TAX percentage (0-100)
  vatTaxAmount?: number; // VAT/TAX amount in currency
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paidAmount?: number; // Amount actually paid (for partial payments)
  paymentTransactionId?: string; // SSLCommerz transaction ID
  paymentValId?: string; // SSLCommerz validation ID
  customer: CustomerInfo;
  courier?: OrderCourierInfo;
  fraudCheck?: FraudCheckData; // Fraud risk data checked at order creation
  couponCode?: string; // Coupon code applied to this order
  couponId?: string; // Coupon ID applied to this order
  affiliateCode?: string; // Affiliate promo code used
  affiliateId?: string; // Affiliate ID who referred this order
  affiliateCommission?: number; // Commission amount for this order
  sourceTracking?: SourceTrackingData; // Source tracking data (fbclid, UTM parameters, etc.)
  ipAddress?: string; // IP address of the customer
  ipGeolocation?: IpGeolocationData; // Geolocation data from IP address
  timeline?: OrderTimelineEvent[]; // Order status timeline history
};

export type UserRole = "customer" | "merchant" | "admin";

export interface ProductCategory {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
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
  order: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FooterPage {
  id: string;
  slug: string;
  title: string;
  content: string; // Tiptap HTML content
  category: string; // Category name
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FooterCategory {
  id: string;
  name: string;
  order: number; // Display order
  createdAt: string;
  updatedAt: string;
}

export interface PromotionalBanner {
  id: string;
  enabled: boolean;
  text?: string;
  link?: string;
  linkText?: string;
  backgroundColor?: string;
  textColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type InventoryTransactionType =
  | "order"
  | "restock"
  | "adjustment"
  | "return";

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

