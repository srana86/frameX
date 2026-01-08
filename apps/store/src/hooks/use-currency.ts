"use client";

import { useEffect, useState } from "react";
import { getCurrencySymbol, formatPrice as formatPriceUtil } from "@/lib/currency";
import type { BrandConfig } from "@/lib/brand-config";
import { defaultBrandConfig } from "@/lib/brand-config";

const DEFAULT_ISO = defaultBrandConfig.currency.iso;
const DEFAULT_SYMBOL = getCurrencySymbol(DEFAULT_ISO);

let cachedCurrencyIso = DEFAULT_ISO;
let cachedCurrencySymbol: string | null = null;
let inflightCurrencyPromise: Promise<{ iso: string; symbol: string }> | null = null;

async function loadCurrencyConfig(): Promise<{ iso: string; symbol: string }> {
  if (cachedCurrencySymbol) {
    return { iso: cachedCurrencyIso, symbol: cachedCurrencySymbol };
  }

  if (inflightCurrencyPromise) {
    return inflightCurrencyPromise;
  }

  inflightCurrencyPromise = (async () => {
    try {
      const res = await fetch("/api/brand-config", {
        cache: "force-cache",
        next: { revalidate: 300 },
      });
      const config: BrandConfig = await res.json();
      const iso = config?.currency?.iso || DEFAULT_ISO;
      const symbol = getCurrencySymbol(iso);
      cachedCurrencyIso = iso;
      cachedCurrencySymbol = symbol;
      return { iso, symbol };
    } catch {
      cachedCurrencyIso = DEFAULT_ISO;
      cachedCurrencySymbol = DEFAULT_SYMBOL;
      return { iso: DEFAULT_ISO, symbol: DEFAULT_SYMBOL };
    } finally {
      inflightCurrencyPromise = null;
    }
  })();

  return inflightCurrencyPromise;
}

/**
 * Hook to get currency symbol from brand config
 * Cached at module level to avoid duplicate client fetches
 */
export function useCurrencySymbol(): string {
  const [symbol, setSymbol] = useState<string>(cachedCurrencySymbol ?? DEFAULT_SYMBOL);

  useEffect(() => {
    let isActive = true;

    loadCurrencyConfig()
      .then(({ symbol }) => {
        if (isActive) setSymbol(symbol);
      })
      .catch(() => {
        if (isActive) setSymbol(DEFAULT_SYMBOL);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return symbol;
}

/**
 * Hook to format price with currency symbol from brand config
 * Uses shared cached currency state to avoid repeated fetches
 */
export function useFormatPrice() {
  const [currencyIso, setCurrencyIso] = useState<string>(cachedCurrencyIso ?? DEFAULT_ISO);

  useEffect(() => {
    let isActive = true;

    loadCurrencyConfig()
      .then(({ iso }) => {
        if (isActive) setCurrencyIso(iso);
      })
      .catch(() => {
        if (isActive) setCurrencyIso(DEFAULT_ISO);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (price: number, decimals: number = 2) => formatPriceUtil(price, currencyIso, decimals);
}
