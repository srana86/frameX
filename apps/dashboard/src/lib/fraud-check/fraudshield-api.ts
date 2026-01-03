// Onecodesoft Fraud Checker API Service
// Documentation: https://fraudchecker.onecodesoft.com
import { fetchWithTimeout, safeJson, normalizeBDPhone, BD_PHONE_REGEX, type FraudRiskLevel } from "./common";

// API Configuration
const ONECODESOFT_API_BASE = "https://fraudchecker.onecodesoft.com";
const DEFAULT_TIMEOUT = 30000;

// Courier service response data
export interface CourierServiceData {
  success: number;
  cancel: number;
  total: number;
  deliveredPercentage: number;
  returnPercentage: number;
  rating?: string; // e.g., "excellent_customer" for Pathao
}

// Courier service response item
export interface CourierServiceResponse {
  status: boolean;
  message: string;
  data?: CourierServiceData;
}

// Main API response structure
export interface OnecodesoftFraudCheckResponse {
  phone: string;
  status: string; // e.g., "Safe", "Warning", etc.
  score: number; // 0-100
  total_parcel: number;
  success_parcel: number;
  cancel_parcel: number;
  response: {
    steadfast?: CourierServiceResponse;
    pathao?: CourierServiceResponse;
    redx?: CourierServiceResponse;
  };
  source: string; // e.g., "live", "cache"
}

// API Response wrapper
export interface FraudShieldAPIResponse {
  success: boolean;
  data?: OnecodesoftFraudCheckResponse;
  error?: string;
  message?: string;
  code?: number;
}

// Courier history item
export interface CourierHistory {
  courier: string;
  total: number;
  successful: number;
  failed: number;
  success_rate?: number;
  logo?: string;
}

// Customer fraud data structure
export interface CustomerFraudData {
  phone: string;
  total_parcels: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  fraud_risk: FraudRiskLevel;
  courier_history: CourierHistory[];
  last_delivery?: string;
  reports?: any[];
}

// Usage statistics structure
export interface UsageStats {
  today_usage: number;
  monthly_usage: number;
  daily_limit: number;
  remaining_today: number;
  subscription: {
    plan_name: string;
    expires_at: string;
    days_remaining: number;
  };
}

// FraudShield API Client
export class FraudShieldAPI {
  private apiKey: string;
  private baseUrl: string;
  private domain: string;

  constructor(apiKey: string, domain: string = "", baseUrl: string = ONECODESOFT_API_BASE) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.domain = domain;
  }

  // Get authorization headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Authorization: this.apiKey, // API key directly, not Bearer token
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Add X-Domain header if domain is provided (required for whitelisting)
    if (this.domain) {
      headers["X-Domain"] = this.domain;
    }

    return headers;
  }

  // Check customer fraud data
  async checkCustomer(phone: string, domain?: string): Promise<FraudShieldAPIResponse> {
    try {
      // Validate and normalize phone number
      const normalizedPhone = normalizeBDPhone(phone);

      if (!BD_PHONE_REGEX.test(normalizedPhone)) {
        return {
          success: false,
          error: "Invalid phone number",
          message: "Please provide a valid Bangladeshi phone number",
          code: 400,
        };
      }

      // Build API URL with phone query parameter
      const url = `${this.baseUrl}/api/fraudchecker?phone=${encodeURIComponent(normalizedPhone)}`;

      // Use provided domain or fallback to instance domain for X-Domain header
      // X-Domain should be just the domain name (e.g., "yourdomain.com"), not the full URL
      const domainToUse = domain || this.domain;
      const headers = domainToUse ? { ...this.getHeaders(), "X-Domain": domainToUse } : this.getHeaders();

      const response = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers,
        },
        DEFAULT_TIMEOUT
      );

      const data = await safeJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || "Request failed",
          message: data?.message || `HTTP ${response.status}`,
          code: response.status,
        };
      }

      // Validate response structure
      if (!data || typeof data !== "object") {
        return {
          success: false,
          error: "Invalid response",
          message: "API returned invalid response format",
          code: 500,
        };
      }

      return {
        success: true,
        data: data as OnecodesoftFraudCheckResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: "Network error",
        message: error instanceof Error ? error.message : "Failed to connect to Fraud Checker API",
        code: 500,
      };
    }
  }
}

// Factory function to create API client
export function createFraudShieldClient(apiKey: string, domain?: string): FraudShieldAPI {
  return new FraudShieldAPI(apiKey, domain);
}
