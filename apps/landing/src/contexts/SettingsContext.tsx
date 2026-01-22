"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  formatCurrency,
  getCurrencySymbol,
  DEFAULT_CURRENCY,
  type CurrencyConfig,
  CURRENCIES,
} from "@/lib/currency";
import { api } from "@/lib/api-client";

export interface GeneralSettings {
  siteName: string;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

interface SettingsContextType {
  settings: GeneralSettings;
  loading: boolean;
  error: string | null;
  // Currency helpers
  formatAmount: (
    amount: number,
    options?: { showCode?: boolean; compact?: boolean }
  ) => string;
  currencySymbol: string;
  currencyCode: string;
  // Settings management
  updateSettings: (newSettings: Partial<GeneralSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  siteName: "FrameX Super Admin",
  defaultCurrency: DEFAULT_CURRENCY,
  timezone: "Asia/Dhaka",
  dateFormat: "DD/MM/YYYY",
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 30,
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.get<GeneralSettings>("settings/general");
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (newSettings: Partial<GeneralSettings>) => {
      try {
        const data = await api.put<GeneralSettings>(
          "settings/general",
          newSettings
        );
        setSettings((prev) => ({ ...prev, ...data }));
      } catch (err: any) {
        console.error("Failed to update settings:", err);
        throw err;
      }
    },
    []
  );

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    await fetchSettings();
  }, [fetchSettings]);

  // Currency formatting helper using current settings
  const formatAmount = useCallback(
    (amount: number, options?: { showCode?: boolean; compact?: boolean }) => {
      return formatCurrency(amount, settings.defaultCurrency, options);
    },
    [settings.defaultCurrency]
  );

  const currencySymbol = getCurrencySymbol(settings.defaultCurrency);
  const currencyCode = settings.defaultCurrency;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        formatAmount,
        currencySymbol,
        currencyCode,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Standalone hook for just currency (for simpler usage)
export function useCurrency() {
  const { formatAmount, currencySymbol, currencyCode } = useSettings();
  return { formatAmount, currencySymbol, currencyCode };
}
