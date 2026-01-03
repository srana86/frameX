"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { BrandConfig } from "@/lib/brand-config";
import { defaultBrandConfig } from "@/lib/brand-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Palette,
  DollarSign,
  Check,
  ChevronsUpDown,
  Building2,
  Image as ImageIcon,
  Search,
  Phone,
  Share2,
  Upload,
  ImageOff,
  Apple,
  Globe,
  X,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageUpload } from "@/components/admin/ImageUpload";
import CloudImage from "@/components/site/CloudImage";
import { Logo } from "@/components/site/Logo";
import { hexToOklch, cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";
import { getAllISOCodes } from "iso-country-currency";

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

  // Get all currencies from the package
  const availableCurrencies = useMemo(() => {
    try {
      const allCountries = getAllISOCodes();
      const currencyMap = new Map<string, { code: string; name: string; symbol: string }>();

      // Add common currencies manually for better naming
      const commonCurrencies: Record<string, string> = {
        USD: "United States Dollar",
        EUR: "Euro",
        GBP: "British Pound",
        JPY: "Japanese Yen",
        CNY: "Chinese Yuan",
        INR: "Indian Rupee",
        AUD: "Australian Dollar",
        CAD: "Canadian Dollar",
        CHF: "Swiss Franc",
        SEK: "Swedish Krona",
        NOK: "Norwegian Krone",
        DKK: "Danish Krone",
        PLN: "Polish Zloty",
        RUB: "Russian Ruble",
        BRL: "Brazilian Real",
        MXN: "Mexican Peso",
        ZAR: "South African Rand",
        KRW: "South Korean Won",
        SGD: "Singapore Dollar",
        HKD: "Hong Kong Dollar",
        NZD: "New Zealand Dollar",
        TRY: "Turkish Lira",
        AED: "UAE Dirham",
        SAR: "Saudi Riyal",
        ILS: "Israeli Shekel",
        THB: "Thai Baht",
        MYR: "Malaysian Ringgit",
        PHP: "Philippine Peso",
        IDR: "Indonesian Rupiah",
        VND: "Vietnamese Dong",
        BDT: "Bangladeshi Taka",
      };

      // Build currency list from package
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

      // Ensure common currencies are included
      Object.entries(commonCurrencies).forEach(([code, name]) => {
        if (!currencyMap.has(code)) {
          currencyMap.set(code, {
            code,
            name,
            symbol: getCurrencySymbol(code),
          });
        }
      });

      return Array.from(currencyMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      console.error("Error loading currencies:", error);
      // Fallback to hardcoded list
      return [
        { code: "USD", name: "United States Dollar", symbol: "$" },
        { code: "EUR", name: "Euro", symbol: "€" },
        { code: "GBP", name: "British Pound", symbol: "£" },
        { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
      ];
    }
  }, []);

  // Get active tab from query params, fallback to provided initial tab
  const tabValues: BrandTab[] = ["identity", "logo", "seo", "contact", "social", "theme", "payment"];
  const tabFromQuery = searchParams.get("tab");
  const activeTab = (tabValues.includes(tabFromQuery as BrandTab) ? (tabFromQuery as BrandTab) : initialTab) as BrandTab;

  // Apply theme color immediately when component mounts with initial config
  useEffect(() => {
    if (initialConfig?.theme?.primaryColor) {
      applyThemeColor(initialConfig.theme.primaryColor);
    }
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brand-config", {
        cache: "force-cache",
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      // If no config exists in database, use default
      const newConfig = data || defaultBrandConfig;
      const normalizedConfig = {
        ...newConfig,
        currency: newConfig.currency || { iso: "USD" },
      };
      setConfig(normalizedConfig);
      setSavedConfig(normalizedConfig);
      // Apply theme color when config is reloaded
      if (newConfig?.theme?.primaryColor) {
        applyThemeColor(newConfig.theme.primaryColor);
      }
    } catch (error) {
      toast.error("Failed to load brand config");
      // Use default config on error
      const defaultConfig = {
        ...defaultBrandConfig,
        currency: defaultBrandConfig.currency || { iso: "USD" },
      };
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
      const res = await fetch("/api/brand-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save config");
      toast.success("Brand settings saved successfully!");
      // Apply theme color immediately
      applyThemeColor(config.theme.primaryColor);
      // Clear cache by reloading
      await loadConfig();
    } catch (error) {
      toast.error("Failed to save brand settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setConfig({
      ...savedConfig,
      currency: savedConfig.currency || { iso: "USD" },
    });
    // Reset image errors
    setImageErrors({});
    // Apply theme color from saved config
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

  // Apply theme color when config loads
  useEffect(() => {
    if (config?.theme?.primaryColor) {
      applyThemeColor(config.theme.primaryColor);
    }
  }, [config?.theme?.primaryColor]);

  // Reset image errors when image paths change
  useEffect(() => {
    setImageErrors({});
  }, [config.favicon.path, config.favicon.appleTouchIcon, config.favicon.manifestIcon, config.logo.imagePath]);

  const updateConfig = (path: string[], value: any) => {
    if (!config) return;
    const newConfig = JSON.parse(JSON.stringify(config)); // Deep clone
    let current: any = newConfig;

    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;

    setConfig(newConfig);
  };

  // Check if there are any changes from saved config
  const hasChanges = useMemo(() => {
    if (!config || !savedConfig) return false;
    try {
      // Deep comparison by stringifying both configs
      // Normalize currency to ensure consistent comparison
      const normalizedConfig = {
        ...config,
        currency: config.currency || { iso: "USD" },
      };
      const normalizedSaved = {
        ...savedConfig,
        currency: savedConfig.currency || { iso: "USD" },
      };
      return JSON.stringify(normalizedConfig) !== JSON.stringify(normalizedSaved);
    } catch (error) {
      console.error("Error comparing configs:", error);
      return false;
    }
  }, [config, savedConfig]);

  // Show loader only when reloading after save (not on initial load)
  if (loading && !config) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Spinner className='mr-2' /> Loading brand settings...
      </div>
    );
  }
  // test

  if (!config) {
    return <div className='rounded-xl border p-8 text-center text-sm text-muted-foreground'>Failed to load brand configuration.</div>;
  }

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

  return (
    <div className='w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
      {/* Header Section - Fully Responsive */}
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
                  <Button
                    onClick={handleCancel}
                    disabled={saving || !hasChanges}
                    variant='outline'
                    size='default'
                    className='shrink-0 min-w-[80px] sm:min-w-[100px]'
                  >
                    <X className='mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4' />
                    <span className='hidden md:inline'>Cancel</span>
                    <span className='sm:hidden'>Cancel</span>
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    size='default'
                    className='shrink-0 shadow-md hover:shadow-lg transition-shadow min-w-[100px] sm:min-w-[140px]'
                  >
                    {saving ? (
                      <>
                        <Loader2 className='mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin' />
                        <span className='hidden sm:inline'>Saving...</span>
                        <span className='sm:hidden'>Save</span>
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

      {/* Main Content - Responsive Padding */}
      <div className='w-full mx-auto py-4'>
        {loading && (
          <div className='flex items-center justify-center p-4 sm:p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg sm:rounded-xl border border-border/50 backdrop-blur-sm mb-4 sm:mb-6'>
            <Spinner className='mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5' />
            <span className='text-xs sm:text-sm font-medium text-muted-foreground'>Reloading brand settings...</span>
          </div>
        )}

        <Tabs value={activeTab} className='w-full space-y-4 sm:space-y-6'>
          {/* Brand Identity */}
          <TabsContent value='identity' className='space-y-4 sm:space-y-6'>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-lg sm:text-xl md:text-2xl font-bold'>Brand Identity</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1 sm:mt-2'>
                  Configure your brand name and tagline to establish your unique identity
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='brandName' className='text-xs sm:text-sm font-semibold'>
                    Brand Name *
                  </Label>
                  <Input
                    id='brandName'
                    value={config.brandName}
                    onChange={(e) => updateConfig(["brandName"], e.target.value)}
                    placeholder='Your Brand Name'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>This will be displayed throughout your store</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='brandTagline' className='text-xs sm:text-sm font-semibold'>
                    Brand Tagline
                  </Label>
                  <Input
                    id='brandTagline'
                    value={config.brandTagline || ""}
                    onChange={(e) => updateConfig(["brandTagline"], e.target.value)}
                    placeholder='Your Brand Tagline'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>A short, memorable phrase that describes your brand</p>
                </div>
                {(config.brandName || config.brandTagline) && (
                  <div className='rounded-lg sm:rounded-xl border  bg-gradient-to-br from-muted/50 to-muted/30 p-4 sm:p-6 md:p-8 space-y-2 sm:space-y-3 shadow-inner'>
                    <Label className='text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Preview</Label>
                    <div className='space-y-1 sm:space-y-2'>
                      <h3 className='text-xl sm:text-2xl md:text-3xl font-bold'>{config.brandName || "Brand Name"}</h3>
                      {config.brandTagline && (
                        <p className='text-sm sm:text-base md:text-lg text-muted-foreground'>{config.brandTagline}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logo & Favicon */}
          <TabsContent value='logo' className='space-y-4 sm:space-y-6'>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-2 sm:pb-3 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg font-bold'>Logo & Favicon</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>Upload and preview your brand images</CardDescription>
              </CardHeader>
              <CardContent className='px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4'>
                  {/* Logo Preview */}
                  <div className='space-y-2'>
                    <Label className='text-xs sm:text-sm font-semibold'>Logo</Label>
                    {config.logo.type === "image" && config.logo.imagePath ? (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm mb-2'>
                        <CloudImage src={config.logo.imagePath} alt={config.logo.altText || "Logo"} fill className='object-contain p-2' />
                      </div>
                    ) : config.logo.type === "text" && (config.logo.text?.primary || config.logo.text?.secondary) ? (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm flex items-center justify-center p-2 mb-2'>
                        <Logo brandConfig={config} className='pointer-events-none scale-110' />
                      </div>
                    ) : (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg border-2  bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm flex flex-col items-center justify-center gap-1 p-3 mb-2'>
                        <ImageIcon className='h-5 w-5 text-muted-foreground' />
                        <p className='text-[10px] text-muted-foreground text-center font-medium'>No Logo</p>
                      </div>
                    )}
                    <ImageUpload
                      value={config.logo.type === "image" ? config.logo.imagePath || "" : ""}
                      onChange={(url) => {
                        if (config.logo.type !== "image") {
                          updateConfig(["logo", "type"], "image");
                        }
                        updateConfig(["logo", "imagePath"], url);
                        if (!config.logo.altText) {
                          updateConfig(["logo", "altText"], "Logo");
                        }
                      }}
                      label=''
                      folder='brand'
                      placeholder='/logo.png'
                    />
                  </div>

                  {/* Favicon Preview */}
                  <div className='space-y-2'>
                    <Label className='text-xs sm:text-sm font-semibold'>Favicon</Label>
                    {config.favicon.path && !imageErrors["favicon"] ? (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm mb-2'>
                        <img
                          src={config.favicon.path}
                          alt='Favicon'
                          className='absolute inset-0 w-full h-full object-contain p-2'
                          onError={() => setImageErrors((prev) => ({ ...prev, favicon: true }))}
                          onLoad={() => setImageErrors((prev) => ({ ...prev, favicon: false }))}
                        />
                      </div>
                    ) : (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg border-2  bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm flex flex-col items-center justify-center gap-1 p-3 mb-2'>
                        <Globe className='h-5 w-5 text-muted-foreground' />
                        <p className='text-[10px] text-muted-foreground text-center font-medium'>No Favicon</p>
                      </div>
                    )}
                    <ImageUpload
                      value={config.favicon.path || ""}
                      onChange={(url) => updateConfig(["favicon", "path"], url)}
                      label=''
                      folder='brand'
                      placeholder='/favicon.ico'
                    />
                    <p className='text-[10px] text-muted-foreground'>32x32px or 16x16px</p>
                  </div>

                  {/* Apple Touch Icon Preview */}
                  <div className='space-y-2'>
                    <Label className='text-xs sm:text-sm font-semibold'>Apple Touch Icon</Label>
                    {config.favicon.appleTouchIcon && !imageErrors["appleTouchIcon"] ? (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm mb-2'>
                        <img
                          src={config.favicon.appleTouchIcon}
                          alt='Apple Touch Icon'
                          className='absolute inset-0 w-full h-full object-contain p-2'
                          onError={() => setImageErrors((prev) => ({ ...prev, appleTouchIcon: true }))}
                          onLoad={() => setImageErrors((prev) => ({ ...prev, appleTouchIcon: false }))}
                        />
                      </div>
                    ) : (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg border-2  bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm flex flex-col items-center justify-center gap-1 p-3 mb-2'>
                        <Apple className='h-5 w-5 text-muted-foreground' />
                        <p className='text-[10px] text-muted-foreground text-center font-medium'>No Apple Icon</p>
                      </div>
                    )}
                    <ImageUpload
                      value={config.favicon.appleTouchIcon || ""}
                      onChange={(url) => updateConfig(["favicon", "appleTouchIcon"], url)}
                      label=''
                      folder='brand'
                      placeholder='/apple-touch-icon.png'
                    />
                    <p className='text-[10px] text-muted-foreground'>180x180px PNG</p>
                  </div>

                  {/* Manifest Icon Preview */}
                  <div className='space-y-2'>
                    <Label className='text-xs sm:text-sm font-semibold'>Manifest Icon</Label>
                    {config.favicon.manifestIcon && !imageErrors["manifestIcon"] ? (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-muted to-muted/50 shadow-sm mb-2'>
                        <img
                          src={config.favicon.manifestIcon}
                          alt='Manifest Icon'
                          className='absolute inset-0 w-full h-full object-contain p-2'
                          onError={() => setImageErrors((prev) => ({ ...prev, manifestIcon: true }))}
                          onLoad={() => setImageErrors((prev) => ({ ...prev, manifestIcon: false }))}
                        />
                      </div>
                    ) : (
                      <div className='relative h-20 sm:h-24 w-full rounded-lg border-2  bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm flex flex-col items-center justify-center gap-1 p-3 mb-2'>
                        <Upload className='h-5 w-5 text-muted-foreground' />
                        <p className='text-[10px] text-muted-foreground text-center font-medium'>No Manifest Icon</p>
                      </div>
                    )}
                    <ImageUpload
                      value={config.favicon.manifestIcon || ""}
                      onChange={(url) => updateConfig(["favicon", "manifestIcon"], url)}
                      label=''
                      folder='brand'
                      placeholder='/manifest-icon.png'
                    />
                    <p className='text-[10px] text-muted-foreground'>192x192px or 512x512px</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Logo Configuration</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  Design your brand logo with customizable styles and options
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                {/* Logo Type Selection - Prominent at top */}
                <div className='space-y-2 sm:space-y-3'>
                  <Label className='text-xs sm:text-sm font-semibold'>Logo Type</Label>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3'>
                    <button
                      type='button'
                      onClick={() => {
                        if (!config.logo.text) {
                          updateConfig(["logo", "text"], { primary: "", secondary: "" });
                        }
                        updateConfig(["logo", "type"], "text");
                      }}
                      className={cn(
                        "relative rounded-md sm:rounded-lg border-2 p-3 sm:p-4 text-left transition-all hover:border-primary hover:shadow-md",
                        config.logo.type === "text" ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-muted/30"
                      )}
                    >
                      <div className='font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1'>Text Logo</div>
                      <div className='text-[10px] sm:text-xs text-muted-foreground leading-tight'>
                        Customizable text-based logo with multiple styles
                      </div>
                      {config.logo.type === "text" && (
                        <div className='absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary' />
                      )}
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        if (!config.logo.imagePath) {
                          updateConfig(["logo", "imagePath"], "");
                        }
                        updateConfig(["logo", "type"], "image");
                      }}
                      className={cn(
                        "relative rounded-md sm:rounded-lg border-2 p-3 sm:p-4 text-left transition-all hover:border-primary hover:shadow-md",
                        config.logo.type === "image" ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-muted/30"
                      )}
                    >
                      <div className='font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1'>Image Logo</div>
                      <div className='text-[10px] sm:text-xs text-muted-foreground leading-tight'>Upload a custom logo image file</div>
                      {config.logo.type === "image" && (
                        <div className='absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary' />
                      )}
                    </button>
                  </div>
                </div>

                {config.logo.type === "text" ? (
                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
                    {/* Left Column - Configuration */}
                    <div className='lg:col-span-2 space-y-4 sm:space-y-6'>
                      {/* Logo Style Selection - Visual Grid */}
                      <div className='space-y-2 sm:space-y-3'>
                        <div className='flex items-center justify-between'>
                          <Label className='text-xs sm:text-sm font-semibold'>Choose Logo Style</Label>
                          <span className='text-[10px] sm:text-xs text-muted-foreground capitalize'>{config.logo.style || "default"}</span>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3'>
                          {/* Default Preview */}
                          <button
                            type='button'
                            onClick={() => updateConfig(["logo", "style"], "default")}
                            className={cn(
                              "relative rounded-lg border-2 p-4 transition-all hover:scale-105 hover:shadow-md",
                              (config.logo.style || "default") === "default"
                                ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
                                : "border-muted bg-background hover:border-primary/50"
                            )}
                          >
                            <div className='text-base font-bold mb-1'>Sample</div>
                            <p className='text-[10px] text-muted-foreground'>Default</p>
                            {(config.logo.style || "default") === "default" && (
                              <div className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary' />
                            )}
                          </button>

                          {/* Icon-Text Preview */}
                          <button
                            type='button'
                            onClick={() => {
                              updateConfig(["logo", "style"], "icon-text");
                              if (!config.logo.icon) {
                                updateConfig(["logo", "icon"], {
                                  symbol: config.logo.text?.primary?.charAt(0) || "X",
                                  backgroundColor: "#1e3a8a",
                                  iconColor: "#ffffff",
                                  size: "md",
                                  borderRadius: "md",
                                });
                              }
                            }}
                            className={cn(
                              "relative rounded-lg border-2 p-3 transition-all hover:scale-105 hover:shadow-md",
                              config.logo.style === "icon-text"
                                ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
                                : "border-muted bg-background hover:border-primary/50"
                            )}
                          >
                            <div className='flex items-center gap-1.5 mb-1'>
                              <div className='h-5 w-5 rounded bg-[#1e3a8a] flex items-center justify-center text-white text-[10px] font-bold'>
                                X
                              </div>
                              <div className='text-xs font-bold'>Sample</div>
                            </div>
                            <p className='text-[10px] text-muted-foreground'>Icon-Text</p>
                            {config.logo.style === "icon-text" && (
                              <div className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary' />
                            )}
                          </button>

                          {/* Gradient Preview */}
                          <button
                            type='button'
                            onClick={() => updateConfig(["logo", "style"], "gradient")}
                            className={cn(
                              "relative rounded-lg border-2 p-4 transition-all hover:scale-105 hover:shadow-md",
                              config.logo.style === "gradient"
                                ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
                                : "border-muted bg-background hover:border-primary/50"
                            )}
                          >
                            <div className='text-base font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-1'>
                              Sample
                            </div>
                            <p className='text-[10px] text-muted-foreground'>Gradient</p>
                            {config.logo.style === "gradient" && (
                              <div className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary' />
                            )}
                          </button>

                          {/* Minimal Preview */}
                          <button
                            type='button'
                            onClick={() => updateConfig(["logo", "style"], "minimal")}
                            className={cn(
                              "relative rounded-lg border-2 p-4 transition-all hover:scale-105 hover:shadow-md",
                              config.logo.style === "minimal"
                                ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
                                : "border-muted bg-background hover:border-primary/50"
                            )}
                          >
                            <div className='text-sm font-light mb-1'>Sample</div>
                            <p className='text-[10px] text-muted-foreground'>Minimal</p>
                            {config.logo.style === "minimal" && (
                              <div className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary' />
                            )}
                          </button>

                          {/* Badge Preview */}
                          <button
                            type='button'
                            onClick={() => updateConfig(["logo", "style"], "badge")}
                            className={cn(
                              "relative rounded-lg border-2 p-4 transition-all hover:scale-105 hover:shadow-md",
                              config.logo.style === "badge"
                                ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
                                : "border-muted bg-background hover:border-primary/50"
                            )}
                          >
                            <div className='rounded px-2 py-0.5 bg-primary text-white text-[10px] font-bold uppercase w-fit mb-1'>
                              Sample
                            </div>
                            <p className='text-[10px] text-muted-foreground'>Badge</p>
                            {config.logo.style === "badge" && (
                              <div className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary' />
                            )}
                          </button>

                          {/* Monogram Preview */}
                          <button
                            type='button'
                            onClick={() => updateConfig(["logo", "style"], "monogram")}
                            className={cn(
                              "relative rounded-lg border-2 p-3 transition-all hover:scale-105 hover:shadow-md",
                              config.logo.style === "monogram"
                                ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20"
                                : "border-muted bg-background hover:border-primary/50"
                            )}
                          >
                            <div className='flex items-center gap-1.5 mb-1'>
                              <div className='h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center'>
                                SM
                              </div>
                              <div className='text-xs font-semibold'>Sample</div>
                            </div>
                            <p className='text-[10px] text-muted-foreground'>Monogram</p>
                            {config.logo.style === "monogram" && (
                              <div className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary' />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Text Inputs Section */}
                      <div className='space-y-4 rounded-lg border bg-muted/30 p-4'>
                        <Label className='text-sm font-semibold mb-4 block'>Logo Text Content</Label>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='logoPrimary' className='text-sm font-medium'>
                              Brand Name (Primary) *
                            </Label>
                            <Input
                              id='logoPrimary'
                              value={config.logo.text?.primary || ""}
                              onChange={(e) => updateConfig(["logo", "text", "primary"], e.target.value)}
                              placeholder='e.g., Shoe'
                              className='h-11 text-base'
                            />
                            <p className='text-xs text-muted-foreground'>Main brand name or primary text</p>
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='logoSecondary' className='text-sm font-medium'>
                              Secondary Text
                            </Label>
                            <Input
                              id='logoSecondary'
                              value={config.logo.text?.secondary || ""}
                              onChange={(e) => updateConfig(["logo", "text", "secondary"], e.target.value)}
                              placeholder='e.g., Store'
                              className='h-11 text-base'
                            />
                            <p className='text-xs text-muted-foreground'>Optional secondary text or tagline</p>
                          </div>
                        </div>

                        {/* Tagline Field */}
                        <div className='space-y-2 pt-2 border-t border-border/50'>
                          <Label htmlFor='brandTagline' className='text-sm font-medium'>
                            Tagline / Description
                          </Label>
                          <Input
                            id='brandTagline'
                            value={config.brandTagline || ""}
                            onChange={(e) => updateConfig(["brandTagline"], e.target.value)}
                            placeholder='e.g., Modern Ecommerce Store'
                            className='h-11 text-base'
                          />
                          <p className='text-xs text-muted-foreground'>
                            Appears below logo in icon-text style (e.g., "DASHBOARD", "MODERN ECOMMERCE STORE")
                          </p>
                        </div>
                      </div>

                      {/* Icon-Text Style Configuration */}
                      {config.logo.style === "icon-text" && (
                        <div className='space-y-4 rounded-lg border bg-muted/30 p-4'>
                          <Label className='text-sm font-semibold mb-3 block'>Icon Settings</Label>

                          {/* Image Upload for Icon */}
                          <div className='space-y-2'>
                            <Label className='text-sm font-medium'>Icon Image (Recommended)</Label>
                            <ImageUpload
                              value={config.logo.icon?.imagePath || ""}
                              onChange={(url) => {
                                // Ensure icon object exists and preserve existing properties
                                const currentIcon = config.logo.icon || {
                                  symbol: config.logo.text?.primary?.charAt(0) || "X",
                                  backgroundColor: "#1e3a8a",
                                  iconColor: "#ffffff",
                                  size: "md",
                                  borderRadius: "md",
                                };
                                updateConfig(["logo", "icon"], {
                                  ...currentIcon,
                                  imagePath: url,
                                });
                              }}
                              label=''
                              folder='brand/icon'
                              placeholder='/icon.png or https://example.com/icon.png'
                            />
                            <p className='text-xs text-muted-foreground'>
                              Upload an icon image (PNG, SVG recommended). This will replace the symbol below.
                            </p>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50'>
                            <div className='space-y-2'>
                              <Label htmlFor='iconSymbol' className='text-sm font-medium'>
                                Icon Symbol (Fallback)
                              </Label>
                              <Input
                                id='iconSymbol'
                                value={config.logo.icon?.symbol || config.logo.text?.primary?.charAt(0) || "X"}
                                onChange={(e) =>
                                  updateConfig(["logo", "icon", "symbol"], e.target.value || config.logo.text?.primary?.charAt(0) || "X")
                                }
                                placeholder='X'
                                className='h-10 text-base font-bold text-center'
                                maxLength={2}
                                disabled={!!config.logo.icon?.imagePath}
                              />
                              <p className='text-xs text-muted-foreground'>Used if no image is provided</p>
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor='iconSize' className='text-sm font-medium'>
                                Icon Size
                              </Label>
                              <Select
                                value={config.logo.icon?.size || "md"}
                                onValueChange={(value: "sm" | "md" | "lg") => updateConfig(["logo", "icon", "size"], value)}
                              >
                                <SelectTrigger className='h-10'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='sm'>Small</SelectItem>
                                  <SelectItem value='md'>Medium</SelectItem>
                                  <SelectItem value='lg'>Large</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor='iconBorderRadius' className='text-sm font-medium'>
                                Corner Roundness
                              </Label>
                              <Select
                                value={config.logo.icon?.borderRadius || "md"}
                                onValueChange={(value: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "full") =>
                                  updateConfig(["logo", "icon", "borderRadius"], value)
                                }
                              >
                                <SelectTrigger className='h-10'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='none'>None (Square)</SelectItem>
                                  <SelectItem value='xs'>Extra Small</SelectItem>
                                  <SelectItem value='sm'>Small</SelectItem>
                                  <SelectItem value='md'>Medium</SelectItem>
                                  <SelectItem value='lg'>Large</SelectItem>
                                  <SelectItem value='xl'>Extra Large</SelectItem>
                                  <SelectItem value='full'>Full (Circle)</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className='text-xs text-muted-foreground'>Controls how rounded the icon corners are</p>
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor='iconBgColor' className='text-sm font-medium'>
                                Background Color
                              </Label>
                              <div className='flex gap-2'>
                                <Input
                                  id='iconBgColor'
                                  type='color'
                                  value={config.logo.icon?.backgroundColor || "#1e3a8a"}
                                  onChange={(e) => updateConfig(["logo", "icon", "backgroundColor"], e.target.value)}
                                  className='h-10 w-20 cursor-pointer'
                                />
                                <Input
                                  value={config.logo.icon?.backgroundColor || "#1e3a8a"}
                                  onChange={(e) => updateConfig(["logo", "icon", "backgroundColor"], e.target.value)}
                                  placeholder='#1e3a8a'
                                  className='h-10 flex-1 font-mono text-sm'
                                />
                              </div>
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor='iconColor' className='text-sm font-medium'>
                                Symbol Color (Image not used)
                              </Label>
                              <div className='flex gap-2'>
                                <Input
                                  id='iconColor'
                                  type='color'
                                  value={config.logo.icon?.iconColor || "#ffffff"}
                                  onChange={(e) => updateConfig(["logo", "icon", "iconColor"], e.target.value)}
                                  className='h-10 w-20 cursor-pointer'
                                  disabled={!!config.logo.icon?.imagePath}
                                />
                                <Input
                                  value={config.logo.icon?.iconColor || "#ffffff"}
                                  onChange={(e) => updateConfig(["logo", "icon", "iconColor"], e.target.value)}
                                  placeholder='#ffffff'
                                  className='h-10 flex-1 font-mono text-sm'
                                  disabled={!!config.logo.icon?.imagePath}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gradient Style Configuration */}
                      {config.logo.style === "gradient" && (
                        <div className='space-y-4 rounded-lg border bg-muted/30 p-4'>
                          <Label className='text-sm font-semibold mb-3 block'>Gradient Colors</Label>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                              <Label htmlFor='gradientFrom' className='text-sm font-medium'>
                                Start Color
                              </Label>
                              <div className='flex gap-2'>
                                <Input
                                  id='gradientFrom'
                                  type='color'
                                  value={config.logo.colors?.gradientFrom || "#3b82f6"}
                                  onChange={(e) => updateConfig(["logo", "colors", "gradientFrom"], e.target.value)}
                                  className='h-10 w-20 cursor-pointer'
                                />
                                <Input
                                  value={config.logo.colors?.gradientFrom || "#3b82f6"}
                                  onChange={(e) => updateConfig(["logo", "colors", "gradientFrom"], e.target.value)}
                                  placeholder='#3b82f6'
                                  className='h-10 flex-1 font-mono text-sm'
                                />
                              </div>
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor='gradientTo' className='text-sm font-medium'>
                                End Color
                              </Label>
                              <div className='flex gap-2'>
                                <Input
                                  id='gradientTo'
                                  type='color'
                                  value={config.logo.colors?.gradientTo || "#8b5cf6"}
                                  onChange={(e) => updateConfig(["logo", "colors", "gradientTo"], e.target.value)}
                                  className='h-10 w-20 cursor-pointer'
                                />
                                <Input
                                  value={config.logo.colors?.gradientTo || "#8b5cf6"}
                                  onChange={(e) => updateConfig(["logo", "colors", "gradientTo"], e.target.value)}
                                  placeholder='#8b5cf6'
                                  className='h-10 flex-1 font-mono text-sm'
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Badge & Monogram Style Configuration */}
                      {(config.logo.style === "badge" || config.logo.style === "monogram") && (
                        <div className='space-y-4 rounded-lg border bg-muted/30 p-4'>
                          <Label className='text-sm font-semibold mb-3 block'>Style Color</Label>
                          <div className='space-y-2'>
                            <Label htmlFor='primaryColor' className='text-sm font-medium'>
                              Primary Color
                            </Label>
                            <div className='flex gap-2'>
                              <Input
                                id='primaryColor'
                                type='color'
                                value={config.logo.colors?.primary || config.theme.primaryColor || "#000000"}
                                onChange={(e) => updateConfig(["logo", "colors", "primary"], e.target.value)}
                                className='h-10 w-20 cursor-pointer'
                              />
                              <Input
                                value={config.logo.colors?.primary || config.theme.primaryColor || "#000000"}
                                onChange={(e) => updateConfig(["logo", "colors", "primary"], e.target.value)}
                                placeholder='#000000'
                                className='h-10 flex-1 font-mono text-sm'
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Live Preview */}
                    <div className='lg:col-span-1'>
                      <div className='sticky top-20 space-y-3 sm:space-y-4'>
                        <div className='rounded-lg sm:rounded-xl border border-primary/20 bg-gradient-to-br from-background to-muted/20 p-4 sm:p-5 shadow-md'>
                          <div className='flex items-center justify-between mb-3 sm:mb-4'>
                            <Label className='text-xs sm:text-sm font-semibold'>Live Preview</Label>
                            <div className='h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse' />
                          </div>
                          <div className='flex items-center justify-center min-h-[100px] sm:min-h-[120px] bg-gradient-to-br from-muted/40 to-muted/10 rounded-lg p-4 sm:p-6 border border-border/50 mb-2 sm:mb-3'>
                            {config.logo.text?.primary || config.logo.text?.secondary || config.logo.style === "icon-text" ? (
                              <Logo brandConfig={config} className='pointer-events-none' />
                            ) : (
                              <div className='text-center text-muted-foreground'>
                                <p className='text-sm mb-1'>Enter your logo text</p>
                                <p className='text-xs'>Preview will appear here</p>
                              </div>
                            )}
                          </div>
                          <div className='space-y-2 rounded-lg bg-muted/50 p-3 text-xs'>
                            <div className='flex items-center justify-between'>
                              <span className='text-muted-foreground'>Style:</span>
                              <span className='font-medium capitalize'>{config.logo.style || "default"}</span>
                            </div>
                            {(config.logo.text?.primary || config.logo.text?.secondary) && (
                              <>
                                <div className='flex items-center justify-between'>
                                  <span className='text-muted-foreground'>Primary:</span>
                                  <span className='font-medium'>{config.logo.text?.primary || "—"}</span>
                                </div>
                                {config.logo.text?.secondary && (
                                  <div className='flex items-center justify-between'>
                                    <span className='text-muted-foreground'>Secondary:</span>
                                    <span className='font-medium'>{config.logo.text.secondary}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {config.brandTagline && (
                              <div className='flex items-center justify-between pt-2 border-t border-border/50'>
                                <span className='text-muted-foreground'>Tagline:</span>
                                <span className='font-medium text-[10px]'>{config.brandTagline}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-6'>
                    <ImageUpload
                      value={config.logo.imagePath || ""}
                      onChange={(url) => updateConfig(["logo", "imagePath"], url)}
                      label='Logo Image'
                      folder='brand'
                      required
                      placeholder='/logo.png or https://example.com/logo.png'
                    />
                    <p className='text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg'>
                      Upload an image or enter a URL/path. For local files, use paths like /logo.png
                    </p>
                    <div className='space-y-3'>
                      <Label htmlFor='logoAltText' className='text-sm font-semibold'>
                        Alt Text
                      </Label>
                      <Input
                        id='logoAltText'
                        value={config.logo.altText || ""}
                        onChange={(e) => updateConfig(["logo", "altText"], e.target.value)}
                        placeholder='Brand Logo'
                        className='h-11 text-base'
                      />
                      <p className='text-xs text-muted-foreground'>Used for accessibility and SEO</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO & Meta Tags */}
          <TabsContent value='seo' className='space-y-4 sm:space-y-6'>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>SEO & Meta Tags</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  Configure your site's SEO settings for better search engine visibility
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='metaTitleDefault' className='text-xs sm:text-sm font-semibold'>
                    Default Title *
                  </Label>
                  <Input
                    id='metaTitleDefault'
                    value={config.meta.title.default}
                    onChange={(e) => updateConfig(["meta", "title", "default"], e.target.value)}
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>The default page title for your site</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='metaTitleTemplate' className='text-xs sm:text-sm font-semibold'>
                    Title Template *
                  </Label>
                  <Input
                    id='metaTitleTemplate'
                    value={config.meta.title.template}
                    onChange={(e) => updateConfig(["meta", "title", "template"], e.target.value)}
                    placeholder='%s – Your Brand'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>Use %s as a placeholder for page-specific titles</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='metaDescription' className='text-xs sm:text-sm font-semibold'>
                    Description *
                  </Label>
                  <Textarea
                    id='metaDescription'
                    value={config.meta.description}
                    onChange={(e) => updateConfig(["meta", "description"], e.target.value)}
                    rows={3}
                    className='text-sm sm:text-base min-h-[80px]'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>
                    Meta description shown in search results (recommended: 150-160 characters)
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='metaKeywords' className='text-xs sm:text-sm font-semibold'>
                    Keywords (comma-separated)
                  </Label>
                  <Input
                    id='metaKeywords'
                    value={config.meta.keywords.join(", ")}
                    onChange={(e) =>
                      updateConfig(
                        ["meta", "keywords"],
                        e.target.value
                          .split(",")
                          .map((k) => k.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder='shoes, sneakers, footwear'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>Relevant keywords for your site (separated by commas)</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='metadataBase' className='text-xs sm:text-sm font-semibold'>
                    Metadata Base URL *
                  </Label>
                  <Input
                    id='metadataBase'
                    value={config.meta.metadataBase}
                    onChange={(e) => updateConfig(["meta", "metadataBase"], e.target.value)}
                    placeholder='https://yourdomain.com'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>The base URL for all metadata links</p>
                </div>
              </CardContent>
            </Card>

            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Social Share Image</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  Image used when sharing your site on social media (Open Graph & Twitter)
                </CardDescription>
              </CardHeader>
              <CardContent className='px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6'>
                <ImageUpload
                  value={config.meta?.socialShareImage || ""}
                  onChange={(url) => {
                    if (!config) return;
                    // Update all three fields in a single state update to avoid race conditions
                    const newConfig = JSON.parse(JSON.stringify(config)); // Deep clone
                    newConfig.meta = {
                      ...newConfig.meta,
                      socialShareImage: url,
                      openGraph: {
                        ...newConfig.meta.openGraph,
                        image: url,
                      },
                      twitter: {
                        ...newConfig.meta.twitter,
                        image: url,
                      },
                    };
                    setConfig(newConfig);
                  }}
                  label='Social Share Image'
                  folder='brand'
                  placeholder='https://example.com/social-share.png'
                />
                <div className='rounded-lg border bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground'>
                    <strong>Recommended:</strong> 1200x630px (1.91:1 aspect ratio) for optimal display on social platforms
                  </p>
                </div>
                {config.meta.socialShareImage && (
                  <div className='rounded-xl border-2 bg-gradient-to-br from-muted/50 to-muted/30 p-6'>
                    <Label className='text-sm font-semibold mb-4 block'>Preview</Label>
                    <div className='relative w-full aspect-[1.91/1] max-w-2xl rounded-xl overflow-hidden border-2 shadow-lg bg-background'>
                      <CloudImage src={config.meta.socialShareImage} alt='Social Share Image' fill className='object-cover' />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Open Graph Settings */}
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Open Graph Settings</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  Configure how your site appears when shared on Facebook, LinkedIn, and other platforms
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='ogTitle' className='text-xs sm:text-sm font-semibold'>
                    OG Title
                  </Label>
                  <Input
                    id='ogTitle'
                    value={config.meta.openGraph?.title || ""}
                    onChange={(e) => updateConfig(["meta", "openGraph", "title"], e.target.value)}
                    placeholder='Your Brand – Tagline'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>Title shown when shared on social media</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='ogDescription' className='text-xs sm:text-sm font-semibold'>
                    OG Description
                  </Label>
                  <Textarea
                    id='ogDescription'
                    value={config.meta.openGraph?.description || ""}
                    onChange={(e) => updateConfig(["meta", "openGraph", "description"], e.target.value)}
                    placeholder='A brief description of your site for social sharing'
                    rows={3}
                    className='text-sm sm:text-base min-h-[80px]'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>Description shown when shared on social media</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='ogSiteName' className='text-xs sm:text-sm font-semibold'>
                    Site Name
                  </Label>
                  <Input
                    id='ogSiteName'
                    value={config.meta.openGraph?.siteName || ""}
                    onChange={(e) => updateConfig(["meta", "openGraph", "siteName"], e.target.value)}
                    placeholder='Your Brand Name'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>The name of your website</p>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='ogType' className='text-xs sm:text-sm font-semibold'>
                      Type
                    </Label>
                    <Select
                      value={config.meta.openGraph?.type || "website"}
                      onValueChange={(value) => updateConfig(["meta", "openGraph", "type"], value)}
                    >
                      <SelectTrigger className='h-9 sm:h-10 md:h-11'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='website'>Website</SelectItem>
                        <SelectItem value='article'>Article</SelectItem>
                        <SelectItem value='product'>Product</SelectItem>
                        <SelectItem value='profile'>Profile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='ogLocale' className='text-xs sm:text-sm font-semibold'>
                      Locale
                    </Label>
                    <Input
                      id='ogLocale'
                      value={config.meta.openGraph?.locale || "en_US"}
                      onChange={(e) => updateConfig(["meta", "openGraph", "locale"], e.target.value)}
                      placeholder='en_US'
                      className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Twitter Card Settings */}
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Twitter Card Settings</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  Configure how your site appears when shared on Twitter/X
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='twitterCard' className='text-xs sm:text-sm font-semibold'>
                    Card Type
                  </Label>
                  <Select
                    value={config.meta.twitter?.card || "summary_large_image"}
                    onValueChange={(value) => updateConfig(["meta", "twitter", "card"], value)}
                  >
                    <SelectTrigger className='h-9 sm:h-10 md:h-11'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='summary'>Summary</SelectItem>
                      <SelectItem value='summary_large_image'>Summary Large Image</SelectItem>
                      <SelectItem value='app'>App</SelectItem>
                      <SelectItem value='player'>Player</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>
                    "Summary Large Image" is recommended for best visual impact
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='twitterTitle' className='text-xs sm:text-sm font-semibold'>
                    Twitter Title
                  </Label>
                  <Input
                    id='twitterTitle'
                    value={config.meta.twitter?.title || ""}
                    onChange={(e) => updateConfig(["meta", "twitter", "title"], e.target.value)}
                    placeholder='Your Brand – Tagline'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>Title shown when shared on Twitter</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='twitterDescription' className='text-xs sm:text-sm font-semibold'>
                    Twitter Description
                  </Label>
                  <Textarea
                    id='twitterDescription'
                    value={config.meta.twitter?.description || ""}
                    onChange={(e) => updateConfig(["meta", "twitter", "description"], e.target.value)}
                    placeholder='A brief description of your site for Twitter sharing'
                    rows={3}
                    className='text-sm sm:text-base min-h-[80px]'
                  />
                  <p className='text-[10px] sm:text-xs text-muted-foreground'>Description shown when shared on Twitter</p>
                </div>

                {/* Quick Sync Button */}
                <div className='rounded-lg border bg-muted/30 p-4 space-y-3'>
                  <p className='text-xs font-medium'>Quick Actions</p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      if (!config) return;
                      const newConfig = JSON.parse(JSON.stringify(config));
                      newConfig.meta.openGraph = {
                        ...newConfig.meta.openGraph,
                        title: `${config.brandName}${config.brandTagline ? ` – ${config.brandTagline}` : ""}`,
                        description: config.meta.description,
                        siteName: config.brandName,
                      };
                      newConfig.meta.twitter = {
                        ...newConfig.meta.twitter,
                        title: `${config.brandName}${config.brandTagline ? ` – ${config.brandTagline}` : ""}`,
                        description: config.meta.description,
                      };
                      setConfig(newConfig);
                    }}
                  >
                    Sync from Brand Name & Meta Description
                  </Button>
                  <p className='text-[10px] text-muted-foreground'>
                    This will update OG and Twitter titles/descriptions based on your brand name, tagline, and meta description
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Info */}
          <TabsContent value='contact' className='space-y-4 sm:space-y-6'>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Contact Information</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>Configure your contact details for customer inquiries</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='contactEmail' className='text-xs sm:text-sm font-semibold'>
                    Email *
                  </Label>
                  <Input
                    id='contactEmail'
                    type='email'
                    value={config.contact.email}
                    onChange={(e) => updateConfig(["contact", "email"], e.target.value)}
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contactPhone' className='text-xs sm:text-sm font-semibold'>
                    Phone *
                  </Label>
                  <Input
                    id='contactPhone'
                    value={config.contact.phone}
                    onChange={(e) => updateConfig(["contact", "phone"], e.target.value)}
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contactAddress' className='text-xs sm:text-sm font-semibold'>
                    Address *
                  </Label>
                  <Textarea
                    id='contactAddress'
                    value={config.contact.address}
                    onChange={(e) => updateConfig(["contact", "address"], e.target.value)}
                    rows={3}
                    className='text-sm sm:text-base min-h-[80px]'
                  />
                </div>
              </CardContent>
            </Card>

            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Footer Content</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  Configure footer description and copyright information
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='footerDescription' className='text-xs sm:text-sm font-semibold'>
                    Footer Description *
                  </Label>
                  <Textarea
                    id='footerDescription'
                    value={config.footer.description}
                    onChange={(e) => updateConfig(["footer", "description"], e.target.value)}
                    rows={3}
                    className='text-sm sm:text-base min-h-[100px]'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='copyrightText' className='text-xs sm:text-sm font-semibold'>
                    Copyright Text
                  </Label>
                  <Input
                    id='copyrightText'
                    value={config.footer.copyrightText || ""}
                    onChange={(e) => updateConfig(["footer", "copyrightText"], e.target.value)}
                    placeholder='All rights reserved.'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media */}
          <TabsContent value='social' className='space-y-4 sm:space-y-6'>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Social Media Links</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  Add your social media profiles to connect with customers
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='socialFacebook' className='text-xs sm:text-sm font-semibold'>
                    Facebook URL
                  </Label>
                  <Input
                    id='socialFacebook'
                    type='url'
                    value={config.social.facebook || ""}
                    onChange={(e) => updateConfig(["social", "facebook"], e.target.value)}
                    placeholder='https://facebook.com/yourbrand'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='socialTwitter' className='text-xs sm:text-sm font-semibold'>
                    Twitter URL
                  </Label>
                  <Input
                    id='socialTwitter'
                    type='url'
                    value={config.social.twitter || ""}
                    onChange={(e) => updateConfig(["social", "twitter"], e.target.value)}
                    placeholder='https://twitter.com/yourbrand'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='socialInstagram' className='text-xs sm:text-sm font-semibold'>
                    Instagram URL
                  </Label>
                  <Input
                    id='socialInstagram'
                    type='url'
                    value={config.social.instagram || ""}
                    onChange={(e) => updateConfig(["social", "instagram"], e.target.value)}
                    placeholder='https://instagram.com/yourbrand'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='socialYoutube' className='text-xs sm:text-sm font-semibold'>
                    YouTube URL
                  </Label>
                  <Input
                    id='socialYoutube'
                    type='url'
                    value={config.social.youtube || ""}
                    onChange={(e) => updateConfig(["social", "youtube"], e.target.value)}
                    placeholder='https://youtube.com/yourbrand'
                    className='h-9 sm:h-10 md:h-11 text-sm sm:text-base'
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme */}
          <TabsContent value='theme' className='space-y-4 sm:space-y-6'>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Theme Color</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>
                  Customize your website's primary theme color. Changes apply to buttons, links, and other primary UI elements.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6 sm:space-y-8 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-6'>
                  <div className='space-y-4'>
                    <Label htmlFor='primaryColor' className='text-sm font-semibold'>
                      Primary Color
                    </Label>
                    <div className='flex items-start gap-4'>
                      <div className='relative group'>
                        <Input
                          id='primaryColor'
                          type='color'
                          value={config.theme.primaryColor}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            updateConfig(["theme", "primaryColor"], newColor);
                            applyThemeColor(newColor);
                          }}
                          className='h-12 w-32 cursor-pointer rounded-xl border-2 border-border shadow-lg transition-all hover:scale-105 hover:shadow-xl'
                        />
                        <div className='absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border rounded-md text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap'>
                          {config.theme.primaryColor}
                        </div>
                      </div>
                      <div className='flex-1 space-y-2'>
                        <Input
                          type='text'
                          value={config.theme.primaryColor}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
                              updateConfig(["theme", "primaryColor"], newColor);
                              applyThemeColor(newColor);
                            } else {
                              updateConfig(["theme", "primaryColor"], newColor);
                            }
                          }}
                          placeholder='#000000'
                          className='font-mono h-11 text-base'
                        />
                        <p className='text-xs text-muted-foreground'>Enter a hex color code (e.g., #f97316)</p>
                      </div>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className='space-y-3 sm:space-y-4'>
                    <Label className='text-xs sm:text-sm font-semibold'>Live Preview</Label>
                    <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 rounded-lg sm:rounded-xl border bg-gradient-to-br from-muted/50 to-muted/30'>
                      <div className='space-y-3'>
                        <div
                          className='h-24 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg transition-all hover:scale-105'
                          style={{ backgroundColor: config.theme.primaryColor }}
                        >
                          Button
                        </div>
                        <p className='text-xs text-center font-medium text-muted-foreground'>Primary Button</p>
                      </div>
                      <div className='space-y-3'>
                        <div
                          className='h-24 rounded-xl border-2 flex items-center justify-center font-semibold bg-background transition-all hover:scale-105'
                          style={{ borderColor: config.theme.primaryColor, color: config.theme.primaryColor }}
                        >
                          Outline
                        </div>
                        <p className='text-xs text-center font-medium text-muted-foreground'>Outline Button</p>
                      </div>
                      <div className='space-y-3'>
                        <div className='h-24 rounded-xl flex items-center justify-center bg-background border'>
                          <a
                            href='#'
                            className='font-semibold underline transition-all hover:opacity-80'
                            style={{ color: config.theme.primaryColor }}
                          >
                            Link Text
                          </a>
                        </div>
                        <p className='text-xs text-center font-medium text-muted-foreground'>Link</p>
                      </div>
                      <div className='space-y-3'>
                        <div className='h-24 rounded-xl flex items-center justify-center bg-background border'>
                          <div className='h-4 w-4 rounded-full shadow-md' style={{ backgroundColor: config.theme.primaryColor }}></div>
                        </div>
                        <p className='text-xs text-center font-medium text-muted-foreground'>Badge</p>
                      </div>
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div className='space-y-3 sm:space-y-4'>
                    <Label className='text-xs sm:text-sm font-semibold'>Quick Select Presets</Label>
                    <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3'>
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          type='button'
                          onClick={() => {
                            updateConfig(["theme", "primaryColor"], preset.value);
                            applyThemeColor(preset.value);
                          }}
                          className='group relative h-14 w-full rounded-xl border-2 transition-all hover:scale-110 hover:shadow-lg hover:z-10'
                          style={{
                            backgroundColor: preset.value,
                            borderColor: config.theme.primaryColor === preset.value ? preset.value : "transparent",
                            boxShadow: config.theme.primaryColor === preset.value ? `0 0 0 2px ${preset.value}40` : "none",
                          }}
                          title={preset.name}
                        >
                          {config.theme.primaryColor === preset.value && (
                            <div className='absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl'>
                              <svg
                                className='h-6 w-6 text-white drop-shadow-lg'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                                strokeWidth={3}
                              >
                                <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                              </svg>
                            </div>
                          )}
                          <span className='sr-only'>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className='text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg'>
                      Click a preset color to apply it instantly to your theme
                    </p>
                  </div>

                  {/* Info */}
                  <div className='rounded-xl border-2 bg-gradient-to-br from-muted/50 to-muted/30 p-6 space-y-3'>
                    <div className='flex items-start gap-4'>
                      <div
                        className='h-8 w-8 rounded-full shrink-0 shadow-md border-2 border-background'
                        style={{ backgroundColor: config.theme.primaryColor }}
                      ></div>
                      <div className='flex-1 space-y-2'>
                        <p className='text-sm font-semibold'>Current Theme Color</p>
                        <p className='text-xs text-muted-foreground leading-relaxed'>
                          This color will be applied to{" "}
                          <code className='px-2 py-1 rounded-md bg-background text-xs font-mono border'>--primary</code> and{" "}
                          <code className='px-2 py-1 rounded-md bg-background text-xs font-mono border'>--sidebar-primary</code> CSS
                          variables throughout your site.
                        </p>
                        <div className='flex items-center gap-2 mt-3'>
                          <span className='text-xs font-medium text-muted-foreground'>OKLCH:</span>
                          <code className='px-2 py-1 rounded-md bg-background text-xs font-mono border'>
                            {hexToOklch(config.theme.primaryColor)}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment & Currency Settings */}
          <TabsContent value='payment' className='space-y-4 sm:space-y-6'>
            <Card className='border shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all pt-0 gap-3'>
              <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 gap-0'>
                <CardTitle className='text-base sm:text-lg md:text-xl font-bold'>Payment & Currency</CardTitle>
                <CardDescription className='text-xs sm:text-sm mt-1'>Configure how prices and payments are presented</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6'>
                <div className='space-y-2'>
                  <Label htmlFor='currencyIso' className='text-xs sm:text-sm font-semibold'>
                    Currency
                  </Label>
                  <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id='currencyIso'
                        variant='outline'
                        role='combobox'
                        aria-expanded={currencyOpen}
                        className='w-full justify-between'
                      >
                        {config.currency?.iso
                          ? `${availableCurrencies.find((c) => c.code === config.currency?.iso)?.code || config.currency.iso} - ${
                              availableCurrencies.find((c) => c.code === config.currency?.iso)?.name || "Currency"
                            } (${availableCurrencies.find((c) => c.code === config.currency?.iso)?.symbol || "$"})`
                          : "Select currency..."}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-full p-0' align='start'>
                      <Command
                        filter={(value, search) => {
                          if (!search || search.trim() === "") return 1;
                          const searchLower = search.toLowerCase();
                          // value format: "CODE - Name (Symbol)"
                          const parts = value.split(" - ");
                          const codeAndName = parts[0]?.toLowerCase() || "";
                          const nameAndSymbol = parts[1]?.toLowerCase() || "";
                          return codeAndName.includes(searchLower) || nameAndSymbol.includes(searchLower) ? 1 : 0;
                        }}
                      >
                        <CommandInput placeholder='Search currency...' />
                        <CommandList className='max-h-[300px] overflow-y-auto'>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {availableCurrencies.map((currency) => (
                              <CommandItem
                                key={currency.code}
                                value={`${currency.code} - ${currency.name} (${currency.symbol})`}
                                onSelect={() => {
                                  updateConfig(["currency", "iso"], currency.code);
                                  setCurrencyOpen(false);
                                }}
                                className='cursor-pointer'
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", config.currency?.iso === currency.code ? "opacity-100" : "opacity-0")}
                                />
                                <span className='mr-2 font-medium'>{currency.code}</span>
                                <span className='mr-2 flex-1'>{currency.name}</span>
                                <span className='text-muted-foreground'>({currency.symbol})</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className='text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg'>
                    The selected currency symbol will be displayed throughout your store for all prices.
                  </p>
                </div>

                {/* Preview */}
                <div className='space-y-4'>
                  <Label className='text-sm font-semibold'>Price Display Preview</Label>
                  <div className='rounded-xl border-2 bg-gradient-to-br from-muted/50 to-muted/30 p-6 space-y-4'>
                    <div className='text-sm font-medium text-muted-foreground'>Price display examples:</div>
                    <div className='space-y-3'>
                      <div className='text-3xl font-bold'>{config.currency?.iso ? getCurrencySymbol(config.currency.iso) : "$"}100.00</div>
                      <div className='text-xl text-muted-foreground line-through'>
                        {config.currency?.iso ? getCurrencySymbol(config.currency.iso) : "$"}120.00
                      </div>
                      <div className='text-base'>{config.currency?.iso ? getCurrencySymbol(config.currency.iso) : "$"}50.99</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
