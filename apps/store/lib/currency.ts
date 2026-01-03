import { getAllISOCodes, getAllInfoByISO, getParamByISO } from "iso-country-currency";

// Cache for currency to country mapping
let currencyToCountryCache: Map<string, string> | null = null;

/**
 * Build a mapping from currency code to country code using the package
 */
function buildCurrencyToCountryMap(): Map<string, string> {
  if (currencyToCountryCache) {
    return currencyToCountryCache;
  }

  const map = new Map<string, string>();
  try {
    const allCountries = getAllISOCodes();
    for (const country of allCountries) {
      if (country.currency && country.iso) {
        // Store the first country we find for each currency
        if (!map.has(country.currency)) {
          map.set(country.currency, country.iso);
        }
      }
    }
    currencyToCountryCache = map;
  } catch (error) {
    console.error("Error building currency map:", error);
  }

  return map;
}

/**
 * Get currency symbol from ISO currency code using the iso-country-currency package
 * @param iso - ISO 4217 currency code (e.g., "USD", "EUR", "GBP")
 * @returns Currency symbol (e.g., "$", "€", "£")
 */
export function getCurrencySymbol(iso: string): string {
  try {
    const currencyCode = iso.toUpperCase();

    // Override symbols for currencies where package returns incorrect/abbreviated symbols
    const symbolOverrides: Record<string, string> = {
      BDT: "৳", // Bangladeshi Taka - package returns "Tk" but we want the actual symbol
    };

    // Check overrides first
    if (symbolOverrides[currencyCode]) {
      return symbolOverrides[currencyCode];
    }

    const currencyMap = buildCurrencyToCountryMap();
    const countryCode = currencyMap.get(currencyCode);

    if (countryCode) {
      const symbol = getParamByISO(countryCode, "symbol");
      if (symbol) {
        return symbol;
      }
    }

    // Fallback: try to find any country with this currency
    try {
      const allCountries = getAllISOCodes();
      for (const country of allCountries) {
        if (country.currency === currencyCode && country.iso) {
          const symbol = getParamByISO(country.iso, "symbol");
          if (symbol) {
            return symbol;
          }
        }
      }
    } catch (error) {
      // Continue to hardcoded fallback
    }

    // Final fallback for currencies not in the package
    return "$";
  } catch (error) {
    console.error("Error getting currency symbol:", error);
    return "$"; // Fallback to dollar sign
  }
}

/**
 * Format price with currency symbol
 * @param price - Price value
 * @param currencyIso - ISO 4217 currency code
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string (e.g., "$100.00", "€100.00")
 */
export function formatPrice(price: number, currencyIso: string, decimals: number = 2): string {
  const symbol = getCurrencySymbol(currencyIso);
  return `${symbol}${price.toFixed(decimals)}`;
}

/**
 * Get currency symbol from brand config (server-side)
 * @param brandConfig - Brand config object
 * @returns Currency symbol string
 */
export function getCurrencySymbolFromConfig(brandConfig: { currency?: { iso?: string } }): string {
  const currencyIso = brandConfig?.currency?.iso || "USD";
  return getCurrencySymbol(currencyIso);
}

/**
 * Format price with currency from brand config (server-side)
 * @param price - Price value
 * @param brandConfig - Brand config object
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export function formatPriceFromConfig(price: number, brandConfig: { currency?: { iso?: string } }, decimals: number = 2): string {
  const currencyIso = brandConfig?.currency?.iso || "USD";
  return formatPrice(price, currencyIso, decimals);
}
