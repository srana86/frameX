import { createFraudShieldClient } from "./services/fraudshield.service";
import config from "../../../config/index";

const BD_PHONE_REGEX = /^(\+?880|0)?1[3-9]\d{8}$/;

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

const getFraudCheckStats = async (apiKey?: string) => {
  const key = apiKey || config.fraudshield_api_key;

  if (!key) {
    throw new Error("API key not configured");
  }

  const client = createFraudShieldClient(key);
  const stats = await client.getUsageStats();

  return stats;
};

const checkCustomerFraud = async (
  phone: string,
  action?: string,
  page?: number,
  limit?: number,
  risk_level?: string,
  apiKey?: string
) => {
  const key = apiKey || config.fraudshield_api_key;

  if (!key) {
    throw new Error("API key not configured");
  }

  if (!phone) {
    throw new Error("Phone number required");
  }

  const normalizedPhone = normalizeBDPhone(phone);

  if (!BD_PHONE_REGEX.test(normalizedPhone)) {
    throw new Error(
      "Invalid phone number. Please provide a valid Bangladeshi phone number (e.g., 01712345678)"
    );
  }

  const client = createFraudShieldClient(key);

  if (action === "list") {
    const result = await client.listCustomers({ page, limit, risk_level });
    return result;
  }

  const result = await client.checkCustomer(normalizedPhone);
  return result;
};

export const FraudCheckServices = {
  getFraudCheckStats,
  checkCustomerFraud,
};
