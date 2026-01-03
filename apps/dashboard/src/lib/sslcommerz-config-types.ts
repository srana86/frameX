// Client-safe types and defaults for SSLCommerz configuration
// This file can be imported in client components

export interface SSLCommerzConfig {
  id: string;
  storeId?: string;
  storePassword?: string; // Note: In production, this should be encrypted
  isLive: boolean; // true for live, false for sandbox
  enabled: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export const defaultSSLCommerzConfig: SSLCommerzConfig = {
  id: "sslcommerz_config_v1",
  storeId: "",
  storePassword: "",
  isLive: false,
  enabled: false,
};

export interface CheckoutFormData {
  // Plan Info
  planId: string;
  planName: string;
  planPrice: number;
  billingCycle: "monthly" | "yearly";
  
  // Merchant Info (for simulator)
  merchantName: string;
  merchantEmail: string;
  merchantPhone: string;
  
  // Customer Info (for SSLCommerz)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPostcode: string;
  customerCountry: string;
  
  // Optional
  customSubdomain?: string;
}

export interface PaymentInitResponse {
  status: string;
  faession?: string;
  GatewayPageURL?: string;
  sessionkey?: string;
  message?: string;
}

