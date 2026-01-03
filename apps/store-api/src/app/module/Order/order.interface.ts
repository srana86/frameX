export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "online";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export type OrderType = "online" | "offline";

export interface CustomerInfo {
  fullName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  notes?: string;
}

export interface CartLineItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  category?: string;
}

export interface OrderCourierInfo {
  serviceId: string;
  consignmentId?: string;
  trackingNumber?: string;
  status?: string;
}

export interface FraudCheckData {
  riskScore?: number;
  flagged?: boolean;
  reason?: string;
}

export interface SourceTrackingData {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}

export interface TOrder {
  id: string;
  createdAt?: Date;
  status: OrderStatus;
  orderType?: OrderType;
  items: CartLineItem[];
  subtotal: number;
  discountPercentage?: number;
  discountAmount?: number;
  vatTaxPercentage?: number;
  vatTaxAmount?: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  paymentTransactionId?: string;
  paymentValId?: string;
  customer: CustomerInfo;
  courier?: OrderCourierInfo;
  fraudCheck?: FraudCheckData;
  couponCode?: string;
  couponId?: string;
  affiliateCode?: string;
  affiliateId?: string;
  affiliateCommission?: number;
  sourceTracking?: SourceTrackingData;
  isDeleted?: boolean;
  updatedAt?: Date;
}
