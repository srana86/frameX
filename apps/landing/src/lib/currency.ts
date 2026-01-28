// Currency configuration and formatting utilities

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  position: "before" | "after";
}

// Supported currencies
export const CURRENCIES: Record<string, CurrencyConfig> = {
  BDT: {
    code: "BDT",
    symbol: "৳",
    name: "Bangladeshi Taka",
    locale: "bn-BD",
    position: "before",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US",
    position: "before",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "de-DE",
    position: "before",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    locale: "en-GB",
    position: "before",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    locale: "en-IN",
    position: "before",
  },
};

// Default currency
export const DEFAULT_CURRENCY = "BDT";

/**
 * Get currency config by code
 */
export function getCurrencyConfig(code: string): CurrencyConfig {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options?: {
    showCode?: boolean;
    compact?: boolean;
    decimals?: number;
  }
): string {
  const config = getCurrencyConfig(currencyCode);
  const { showCode = false, compact = false, decimals = 2 } = options || {};

  let formattedAmount: string;

  if (compact && amount >= 1000) {
    if (amount >= 1000000) {
      formattedAmount = (amount / 1000000).toFixed(1) + "M";
    } else if (amount >= 1000) {
      formattedAmount = (amount / 1000).toFixed(1) + "K";
    } else {
      formattedAmount = amount.toLocaleString(config.locale);
    }
  } else {
    formattedAmount = amount.toLocaleString(config.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  const formatted = config.position === "before" ? `${config.symbol}${formattedAmount}` : `${formattedAmount}${config.symbol}`;

  if (showCode) {
    return `${formatted} ${config.code}`;
  }

  return formatted;
}

/**
 * Get just the currency symbol
 */
export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
  return getCurrencyConfig(currencyCode).symbol;
}

/**
 * Parse amount from formatted string
 */
export function parseCurrencyAmount(value: string): number {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}
/**
 * Alias for formatCurrency with adaptation for use-currency hook
 */
export function formatPrice(price: number, currencyIso: string, decimals: number = 2): string {
  return formatCurrency(price, currencyIso, { decimals });
}
