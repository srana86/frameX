"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Save,
  Settings,
  Globe,
  ShoppingBag,
  Shield,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import type { StaffPermission } from "@/contexts/StoreContext";

interface StoreSettings {
  name: string;
  slug: string;
  status: string;
  customDomain: string;
  email: string;
  timezone: string;
  language: string;
  orderPrefix: string;
  lowStockThreshold: number;
  features: {
    enableReviews: boolean;
    enableWishlist: boolean;
    enableGuestCheckout: boolean;
    requireEmailVerification: boolean;
  };
}

interface SettingsClientProps {
  initialSettings: StoreSettings;
  storeId: string;
  permission: StaffPermission | null;
}

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London (UK)" },
  { value: "Europe/Paris", label: "Paris (France)" },
  { value: "Asia/Tokyo", label: "Tokyo (Japan)" },
  { value: "Asia/Dubai", label: "Dubai (UAE)" },
  { value: "Asia/Dhaka", label: "Dhaka (Bangladesh)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ar", label: "Arabic" },
  { value: "bn", label: "Bengali" },
];

/**
 * Settings Client Component
 * Configure store settings and preferences
 */
export function SettingsClient({
  initialSettings,
  storeId,
  permission,
}: SettingsClientProps) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  // Permission check
  const canEdit = permission === null || permission === "FULL";

  // Update simple field
  const updateField = (field: keyof StoreSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // Update feature toggle
  const updateFeature = (feature: keyof StoreSettings["features"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      features: { ...prev.features, [feature]: value },
    }));
  };

  // Save settings
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("settings", settings);
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground">
            Configure your store settings and preferences
          </p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You need FULL permission to modify store settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground">
            Configure your store settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic store information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="My Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Store Slug</Label>
                  <Input
                    id="slug"
                    value={settings.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="my-store"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: {settings.slug}.framextech.com
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Store Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="store@example.com"
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => updateField("timezone", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => updateField("language", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Settings
              </CardTitle>
              <CardDescription>
                Configure your custom domain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customDomain">Custom Domain</Label>
                <Input
                  id="customDomain"
                  value={settings.customDomain}
                  onChange={(e) => updateField("customDomain", e.target.value)}
                  placeholder="shop.yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  Point your domain's CNAME record to: stores.framextech.com
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Settings
              </CardTitle>
              <CardDescription>
                Configure order-related settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orderPrefix">Order Number Prefix</Label>
                  <Input
                    id="orderPrefix"
                    value={settings.orderPrefix}
                    onChange={(e) =>
                      updateField("orderPrefix", e.target.value.toUpperCase())
                    }
                    placeholder="ORD"
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: {settings.orderPrefix || "ORD"}-1001
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="1"
                    value={settings.lowStockThreshold}
                    onChange={(e) =>
                      updateField("lowStockThreshold", parseInt(e.target.value, 10))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when stock falls below this number
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Store Features
              </CardTitle>
              <CardDescription>
                Enable or disable store features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Product Reviews</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to leave product reviews
                  </p>
                </div>
                <Switch
                  checked={settings.features.enableReviews}
                  onCheckedChange={(checked) =>
                    updateFeature("enableReviews", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Wishlist</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to save products to wishlist
                  </p>
                </div>
                <Switch
                  checked={settings.features.enableWishlist}
                  onCheckedChange={(checked) =>
                    updateFeature("enableWishlist", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Guest Checkout</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to checkout without an account
                  </p>
                </div>
                <Switch
                  checked={settings.features.enableGuestCheckout}
                  onCheckedChange={(checked) =>
                    updateFeature("enableGuestCheckout", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new accounts
                  </p>
                </div>
                <Switch
                  checked={settings.features.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    updateFeature("requireEmailVerification", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
