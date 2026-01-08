// Common types and utilities for fraud checking

// Bangladesh phone number regex (supports various formats)
export const BD_PHONE_REGEX = /^(\+?880|0)?1[3-9]\d{8}$/;

// Normalize BD phone to standard format
export function normalizeBDPhone(phone: string): string {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Remove country code if present
  if (cleaned.startsWith("+880")) {
    return "0" + cleaned.slice(4);
  }
  if (cleaned.startsWith("880")) {
    return "0" + cleaned.slice(3);
  }

  // Add leading 0 if not present
  if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    return "0" + cleaned;
  }

  return cleaned;
}

// Fetch with timeout utility
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 30000): Promise<Response> {
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

    // Handle connection errors gracefully without throwing unhandled errors
    if (error?.cause?.code === "ECONNREFUSED" || error?.code === "ECONNREFUSED") {
      // Create a fake response object that indicates connection failure
      // This prevents unhandled promise rejections
      return new Response(
        JSON.stringify({
          error: "Connection refused",
          message: "Unable to connect to the API. Please check if the service is running.",
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Re-throw other errors
    throw error;
  }
}

// Safe JSON parse utility
export async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Round to 2 decimal places
export function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

// Fraud data item structure
export interface FraudData {
  success: number;
  cancel: number;
  total: number;
  deliveredPercentage: number;
  returnPercentage: number;
}

// Response item structure
export interface FraudResponseItem {
  status: boolean;
  message: string;
  data?: FraudData;
}

// Response structure for multiple services
export interface FraudResponse {
  pathao?: FraudResponseItem;
  redx?: FraudResponseItem;
  steadfast?: FraudResponseItem;
  paperfly?: FraudResponseItem;
  parceldex?: FraudResponseItem;
}

// Aggregated fraud response with summary
export interface FraudAggregated {
  services: FraudResponse;
  summary?: FraudData;
}

// Helper to create failure response
export function failure(message: string): FraudResponseItem {
  return {
    status: false,
    message,
  };
}

// Helper to create success response
export function success(data: FraudData, message: string = "Success"): FraudResponseItem {
  return {
    status: true,
    message,
    data,
  };
}

// Fraud risk levels
export type FraudRiskLevel = "low" | "medium" | "high" | "unknown";

// Calculate fraud risk level based on success rate
export function calculateRiskLevel(successRate: number): FraudRiskLevel {
  if (successRate >= 90) return "low";
  if (successRate >= 70) return "medium";
  if (successRate > 0) return "high";
  return "unknown";
}

// Get risk color for UI
export function getRiskColor(risk: FraudRiskLevel): string {
  switch (risk) {
    case "low":
      return "text-green-600 bg-green-50 border-green-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "high":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

// Get risk badge color
export function getRiskBadgeColor(risk: FraudRiskLevel): string {
  switch (risk) {
    case "low":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "high":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
