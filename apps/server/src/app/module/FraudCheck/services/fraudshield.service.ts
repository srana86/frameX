// FraudShield API Service
import config from "../../../../config/index";

const FRAUDSHIELD_API_BASE =
  config.fraudshield_api_base_url || "https://fraudshieldbd.site";
const DEFAULT_TIMEOUT = 30000;

// Bangladesh phone number regex
const BD_PHONE_REGEX = /^(\+?880|0)?1[3-9]\d{8}$/;

// Normalize BD phone to standard format
function normalizeBDPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+880")) {
    return "0" + cleaned.slice(4);
  }
  if (cleaned.startsWith("880")) {
    return "0" + cleaned.slice(3);
  }

  if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    return "0" + cleaned;
  }

  return cleaned;
}

// Fetch with timeout utility
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (
      error?.cause?.code === "ECONNREFUSED" ||
      error?.code === "ECONNREFUSED"
    ) {
      return new Response(
        JSON.stringify({
          error: "Connection refused",
          message:
            "Unable to connect to the API. Please check if the service is running.",
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    throw error;
  }
}

// Safe JSON parse utility
async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export class FraudShieldAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = FRAUDSHIELD_API_BASE) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
  }

  async checkCustomer(phone: string) {
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
      `${this.baseUrl}/api/customer/check`,
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

    return data;
  }

  async listCustomers(params?: {
    page?: number;
    limit?: number;
    risk_level?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.risk_level) queryParams.append("risk_level", params.risk_level);

    const url = `${this.baseUrl}/api/customer/list${queryParams.toString() ? `?${queryParams}` : ""}`;

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

    return data;
  }

  async getUsageStats() {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/api/usage/stats`,
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

    return data;
  }
}

export function createFraudShieldClient(apiKey: string): FraudShieldAPI {
  return new FraudShieldAPI(apiKey);
}
