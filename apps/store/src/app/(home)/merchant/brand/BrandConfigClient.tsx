"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { BrandConfig } from "@/lib/brand-config";
import { defaultBrandConfig } from "@/lib/brand-config";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Save, Loader2, X } from "lucide-react";
import { hexToOklch } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import { getAllISOCodes } from "iso-country-currency";

import {
  BrandConfigProvider,
  IdentityTab,
  LogoTab,
  SeoTab,
  ContactTab,
  SocialTab,
  ThemeTab,
  PaymentTab,
} from "./components";

type BrandTab = "identity" | "logo" | "seo" | "contact" | "social" | "theme" | "payment";

interface BrandConfigClientProps {
  initialConfig: BrandConfig;
  initialTab?: BrandTab;
  hideHeader?: boolean;
  showActions?: boolean;
}

export function BrandConfigClient({
  initialConfig,
  initialTab = "identity",
  hideHeader = false,
  showActions = true,
}: BrandConfigClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [config, setConfig] = useState<BrandConfig>({
    ...initialConfig,
    currency: initialConfig.currency || { iso: "USD" },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [savedConfig, setSavedConfig] = useState<BrandConfig>({
    ...initialConfig,
    currency: initialConfig.currency || { iso: "USD" },
  });

  // Color presets for quick selection
  const colorPresets = [
    { name: "Orange", value: "#f97316", oklch: "oklch(0.646 0.222 41.116)" },
    { name: "Blue", value: "#3b82f6", oklch: "oklch(0.553 0.195 240.402)" },
    { name: "Green", value: "#10b981", oklch: "oklch(0.647 0.195 160.116)" },
    { name: "Purple", value: "#8b5cf6", oklch: "oklch(0.553 0.195 280.402)" },
    { name: "Red", value: "#ef4444", oklch: "oklch(0.577 0.245 27.325)" },
    { name: "Pink", value: "#ec4899", oklch: "oklch(0.647 0.195 340.116)" },
    { name: "Teal", value: "#14b8a6", oklch: "oklch(0.647 0.195 180.116)" },
    { name: "Indigo", value: "#6366f1", oklch: "oklch(0.553 0.195 260.402)" },
  ];

  // Get all currencies from the package
  const availableCurrencies = useMemo(() => {
    try {
      const allCountries = getAllISOCodes();
      const currencyMap = new Map<string, { code: string; name: string; symbol: string }>();

      const commonCurrencies: Record<string, string> = {
        USD: "United States Dollar",
        EUR: "Euro",
        GBP: "British Pound",
        JPY: "Japanese Yen",
        BDT: "Bangladeshi Taka",
      };

      for (const country of allCountries) {
        if (country.currency && !currencyMap.has(country.currency)) {
          const currencyCode = country.currency;
          const symbol = getCurrencySymbol(currencyCode);
          currencyMap.set(currencyCode, {
            code: currencyCode,
            name: commonCurrencies[currencyCode] || `${currencyCode} Currency`,
            symbol,
          });
        }
      }

      Object.entries(commonCurrencies).forEach(([code, name]) => {
        if (!currencyMap.has(code)) {
          currencyMap.set(code, { code, name, symbol: getCurrencySymbol(code) });
        }
      });

      return Array.from(currencyMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      return [
        { code: "USD", name: "United States Dollar", symbol: "$" },
        { code: "EUR", name: "Euro", symbol: "€" },
        { code: "GBP", name: "British Pound", symbol: "£" },
        { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
      ];
    }
  }, []);

  // Get active tab from query params
  const tabValues: BrandTab[] = ["identity", "logo", "seo", "contact", "social", "theme", "payment"];
  const tabFromQuery = searchParams.get("tab");
  const activeTab = (tabValues.includes(tabFromQuery as BrandTab) ? (tabFromQuery as BrandTab) : initialTab) as BrandTab;

  // Apply theme color
  useEffect(() => {
    if (initialConfig?.theme?.primaryColor) {
      applyThemeColor(initialConfig.theme.primaryColor);
    }
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { apiRequest } = await import("@/lib/api-client");
      const data = await apiRequest<BrandConfig>("GET", "/brand-config");
      const newConfig = data || defaultBrandConfig;
      const normalizedConfig = {
        ...newConfig,
        currency: newConfig.currency || { iso: "USD" },
      };
      setConfig(normalizedConfig);
      setSavedConfig(normalizedConfig);
      if (newConfig?.theme?.primaryColor) {
        applyThemeColor(newConfig.theme.primaryColor);
      }
    } catch (error) {
      toast.error("Failed to load brand config");
      const defaultConfig = { ...defaultBrandConfig, currency: defaultBrandConfig.currency || { iso: "USD" } };
      setConfig(defaultConfig);
      setSavedConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { apiRequest } = await import("@/lib/api-client");
      await apiRequest("PUT", "/brand-config", config);
      toast.success("Brand settings saved successfully!");
      applyThemeColor(config.theme.primaryColor);
      await loadConfig();
    } catch (error) {
      toast.error("Failed to save brand settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setConfig({ ...savedConfig, currency: savedConfig.currency || { iso: "USD" } });
    setImageErrors({});
    if (savedConfig?.theme?.primaryColor) {
      applyThemeColor(savedConfig.theme.primaryColor);
    }
    toast.info("Changes discarded");
  };

  const applyThemeColor = (hexColor: string) => {
    try {
      const oklchColor = hexToOklch(hexColor);
      const root = document.documentElement;
      root.style.setProperty("--primary", oklchColor);
      root.style.setProperty("--sidebar-primary", oklchColor);
    } catch (error) {
      console.error("Failed to apply theme color:", error);
    }
  };

  useEffect(() => {
    if (config?.theme?.primaryColor) {
      applyThemeColor(config.theme.primaryColor);
    }
  }, [config?.theme?.primaryColor]);

  useEffect(() => {
    setImageErrors({});
  }, [config.favicon.path, config.favicon.appleTouchIcon, config.favicon.manifestIcon, config.logo.imagePath]);

  const updateConfig = (path: string[], value: any) => {
    if (!config) return;
    setConfig(prevConfig => {
      if (!prevConfig) return prevConfig;
      if (path.length === 1) {
        return { ...prevConfig, [path[0]]: value };
      }
      const newConfig = { ...prevConfig };
      let current: any = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        current[key] = current[key] ? { ...current[key] } : {};
        current = current[key];
      }
      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  // Debounced hasChanges check
  const [hasChanges, setHasChanges] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (!config || !savedConfig) {
        setHasChanges(false);
        return;
      }
      try {
        const normalizedConfig = { ...config, currency: config.currency || { iso: "USD" } };
        const normalizedSaved = { ...savedConfig, currency: savedConfig.currency || { iso: "USD" } };
        setHasChanges(JSON.stringify(normalizedConfig) !== JSON.stringify(normalizedSaved));
      } catch (error) {
        setHasChanges(false);
      }
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [config, savedConfig]);

  if (loading && !config) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Spinner className='mr-2' /> Loading brand settings...
      </div>
    );
  }

  if (!config) {
    return <div className='rounded-xl border p-8 text-center text-sm text-muted-foreground'>Failed to load brand configuration.</div>;
  }

  // Context value for child components
  const contextValue = {
    config,
    savedConfig,
    updateConfig,
    setConfig,
    applyThemeColor,
    currencyOpen,
    setCurrencyOpen,
    imageErrors,
    setImageErrors,
    availableCurrencies,
    colorPresets,
  };

  return (
    <BrandConfigProvider value={contextValue}>
      <div className='w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
        {/* Header Section */}
        {(showActions || !hideHeader) && (
          <div className='w-full border-b bg-background/95 backdrop-blur-md z-50'>
            <div className='w-full mx-auto pb-4'>
              <div className='flex items-center justify-between gap-3'>
                {!hideHeader && (
                  <div className='flex-1 min-w-0'>
                    <h1 className='text-xl sm:text-2xl font-bold truncate'>Brand Configuration</h1>
                    <p className='text-xs sm:text-sm text-muted-foreground hidden sm:block'>Customize your brand identity</p>
                  </div>
                )}
                {showActions && (
                  <div className='flex items-center gap-2 sm:gap-3 ml-auto'>
                    <Button onClick={handleCancel} disabled={saving || !hasChanges} variant='outline' size='default' className='shrink-0 min-w-[80px] sm:min-w-[100px]'>
                      <X className='mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4' />
                      <span>Cancel</span>
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !hasChanges} size='default' className='shrink-0 shadow-md hover:shadow-lg transition-shadow min-w-[100px] sm:min-w-[140px]'>
                      {saving ? (
                        <>
                          <Loader2 className='mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin' />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className='mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4' />
                          <span className='hidden sm:inline'>Save Changes</span>
                          <span className='sm:hidden'>Save</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className='w-full mx-auto py-4'>
          {loading && (
            <div className='flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg sm:rounded-xl border border-border/50 backdrop-blur-sm mb-4 sm:mb-6'>
              <Spinner className='mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5' />
              <span className='text-xs sm:text-sm font-medium text-muted-foreground'>Reloading brand settings...</span>
            </div>
          )}

          <Tabs value={activeTab} className='w-full space-y-4 sm:space-y-6'>
            <TabsContent value='identity' className='space-y-4 sm:space-y-6'>
              <IdentityTab />
            </TabsContent>

            <TabsContent value='logo' className='space-y-4 sm:space-y-6'>
              <LogoTab />
            </TabsContent>

            <TabsContent value='seo' className='space-y-4 sm:space-y-6'>
              <SeoTab />
            </TabsContent>

            <TabsContent value='contact' className='space-y-4 sm:space-y-6'>
              <ContactTab />
            </TabsContent>

            <TabsContent value='social' className='space-y-4 sm:space-y-6'>
              <SocialTab />
            </TabsContent>

            <TabsContent value='theme' className='space-y-4 sm:space-y-6'>
              <ThemeTab />
            </TabsContent>

            <TabsContent value='payment' className='space-y-4 sm:space-y-6'>
              <PaymentTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </BrandConfigProvider>
  );
}
