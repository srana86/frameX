// FraudShield API Service with API Key Authentication
import { fetchWithTimeout, safeJson, normalizeBDPhone, BD_PHONE_REGEX, type FraudRiskLevel } from "./common";

// API Configuration
const FRAUDSHIELD_API_BASE = process.env.FRAUDSHIELD_API_BASE_URL || "https://fraudshieldbd.site";
const DEFAULT_TIMEOUT = 30000;

// Customer fraud data response
export interface CustomerFraudData {
  phone: string;
  total_parcels: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  fraud_risk: FraudRiskLevel;
  last_delivery?: string;
  courier_history?: CourierHistory[];
}

// Courier history item
export interface CourierHistory {
  courier: string;
  total: number;
  successful: number;
  failed: number;
  success_rate?: number;
}

// API Response structure
export interface FraudShieldAPIResponse {
  success: boolean;
  data?: CustomerFraudData;
  error?: string;
  message?: string;
  code?: number;
}

// List response
export interface CustomerListResponse {
  success: boolean;
  data?: {
    items: CustomerFraudData[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  error?: string;
  message?: string;
}

// Usage statistics
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

// Usage stats response
export interface UsageStatsResponse {
  success: boolean;
  data?: UsageStats;
  error?: string;
  message?: string;
}

// FraudShield API Client
export class FraudShieldAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = FRAUDSHIELD_API_BASE) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  // Get authorization headers
  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
  }

  // Check customer fraud data
  async checkCustomer(phone: string): Promise<FraudShieldAPIResponse> {
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

      const response = await fetchWithTimeout(
        "https://fraudshieldbd.site/api/customer/check",
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ phone: normalizedPhone }),
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

      return data as FraudShieldAPIResponse;
    } catch (error) {
      return {
        success: false,
        error: "Network error",
        message: error instanceof Error ? error.message : "Failed to connect to FraudShield API",
        code: 500,
      };
    }
  }

  // Get list of customers with pagination
  async listCustomers(params?: { page?: number; limit?: number; risk_level?: FraudRiskLevel }): Promise<CustomerListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.risk_level) queryParams.append("risk_level", params.risk_level);

      const url = `https://fraudshieldbd.site/api/customer/list${queryParams.toString() ? `?${queryParams}` : ""}`;

      const response = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: this.getHeaders(),
        },
        DEFAULT_TIMEOUT
      );

      const data = await safeJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || "Request failed",
          message: data?.message || `HTTP ${response.status}`,
        };
      }

      return data as CustomerListResponse;
    } catch (error) {
      return {
        success: false,
        error: "Network error",
        message: error instanceof Error ? error.message : "Failed to connect to FraudShield API",
      };
    }
  }

  // Get usage statistics
  async getUsageStats(): Promise<UsageStatsResponse> {
    try {
      const response = await fetchWithTimeout(
        "https://fraudshieldbd.site/api/usage/stats",
        {
          method: "GET",
          headers: this.getHeaders(),
        },
        DEFAULT_TIMEOUT
      );

      const data = await safeJson(response);

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || "Request failed",
          message: data?.message || `HTTP ${response.status}`,
        };
      }

      return data as UsageStatsResponse;
    } catch (error) {
      return {
        success: false,
        error: "Network error",
        message: error instanceof Error ? error.message : "Failed to connect to FraudShield API",
      };
    }
  }
}

// Factory function to create API client
export function createFraudShieldClient(apiKey: string): FraudShieldAPI {
  return new FraudShieldAPI(apiKey);
}

// Helper function to format courier history with success rate
export function formatCourierHistory(history: CourierHistory[]): CourierHistory[] {
  return history.map((item) => ({
    ...item,
    success_rate: item.total > 0 ? Math.round((item.successful / item.total) * 100) : 0,
  }));
}
