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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Save,
  Store,
  Palette,
  Mail,
  Globe,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import type { StaffPermission } from "@/contexts/StoreContext";

interface BrandConfig {
  brandName: string;
  tagline: string;
  logo: { light: string; dark: string };
  favicon: { url: string };
  meta: { title: string; description: string; keywords: string };
  contact: { email: string; phone: string; address: string };
  social: Record<string, string>;
  footer: { copyright: string };
  theme: { primaryColor: string; secondaryColor: string };
  currency: { code: string; symbol: string; position: string };
}

interface BrandConfigClientProps {
  initialConfig: BrandConfig;
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Brand Configuration Client Component
 * Configure store branding (affects store-front only)
 * Admin UI always uses static theme
 */
export function BrandConfigClient({
  initialConfig,
  storeId,
  permission,
}: BrandConfigClientProps) {
  const [config, setConfig] = useState<BrandConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");

  // Permission check
  const canEdit = permission === null || permission === "FULL";

  // Update config field
  const updateField = (section: keyof BrandConfig, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [section]: typeof prev[section] === "object"
        ? { ...(prev[section] as any), [field]: value }
        : value,
    }));
  };

  // Save configuration
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify brand settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("brand-config", config);
      toast.success("Brand configuration saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Configuration</h1>
          <p className="text-muted-foreground">
            Configure your store branding and identity
          </p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You need FULL permission to modify brand settings.
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
          <h1 className="text-3xl font-bold tracking-tight">Brand Configuration</h1>
          <p className="text-muted-foreground">
            Configure your store branding and identity
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

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 pt-6">
          <Store className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">
              These settings affect your customer-facing store only
            </p>
            <p className="text-sm text-blue-700">
              The admin interface uses a static theme and will not be affected by these changes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Identity
              </CardTitle>
              <CardDescription>
                Basic information about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={config.brandName}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, brandName: e.target.value }))
                    }
                    placeholder="Your Store Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={config.tagline}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, tagline: e.target.value }))
                    }
                    placeholder="Your store tagline"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoLight">Logo (Light Mode)</Label>
                  <Input
                    id="logoLight"
                    value={config.logo.light}
                    onChange={(e) => updateField("logo", "light", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoDark">Logo (Dark Mode)</Label>
                  <Input
                    id="logoDark"
                    value={config.logo.dark}
                    onChange={(e) => updateField("logo", "dark", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input
                  id="favicon"
                  value={config.favicon.url}
                  onChange={(e) => updateField("favicon", "url", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency Code</Label>
                  <Input
                    id="currencyCode"
                    value={config.currency.code}
                    onChange={(e) =>
                      updateField("currency", "code", e.target.value.toUpperCase())
                    }
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    value={config.currency.symbol}
                    onChange={(e) => updateField("currency", "symbol", e.target.value)}
                    placeholder="$"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencyPosition">Symbol Position</Label>
                  <select
                    id="currencyPosition"
                    value={config.currency.position}
                    onChange={(e) =>
                      updateField("currency", "position", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="before">Before ($100)</option>
                    <option value="after">After (100$)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Colors
              </CardTitle>
              <CardDescription>
                Customize your store colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={config.theme.primaryColor}
                      onChange={(e) =>
                        updateField("theme", "primaryColor", e.target.value)
                      }
                      className="h-10 w-16 rounded border"
                    />
                    <Input
                      value={config.theme.primaryColor}
                      onChange={(e) =>
                        updateField("theme", "primaryColor", e.target.value)
                      }
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={config.theme.secondaryColor}
                      onChange={(e) =>
                        updateField("theme", "secondaryColor", e.target.value)
                      }
                      className="h-10 w-16 rounded border"
                    />
                    <Input
                      value={config.theme.secondaryColor}
                      onChange={(e) =>
                        updateField("theme", "secondaryColor", e.target.value)
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                How customers can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={config.contact.email}
                    onChange={(e) => updateField("contact", "email", e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={config.contact.phone}
                    onChange={(e) => updateField("contact", "phone", e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactAddress">Address</Label>
                <Input
                  id="contactAddress"
                  value={config.contact.address}
                  onChange={(e) => updateField("contact", "address", e.target.value)}
                  placeholder="123 Main St, City, Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copyright">Footer Copyright</Label>
                <Input
                  id="copyright"
                  value={config.footer.copyright}
                  onChange={(e) => updateField("footer", "copyright", e.target.value)}
                  placeholder="© 2024 Your Store. All rights reserved."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>
                Optimize your store for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={config.meta.title}
                  onChange={(e) => updateField("meta", "title", e.target.value)}
                  placeholder="Your Store - Best Products Online"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Input
                  id="metaDescription"
                  value={config.meta.description}
                  onChange={(e) => updateField("meta", "description", e.target.value)}
                  placeholder="Shop the best products at great prices..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={config.meta.keywords}
                  onChange={(e) => updateField("meta", "keywords", e.target.value)}
                  placeholder="online store, shopping, products"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Connect your social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={config.social.facebook || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        social: { ...prev.social, facebook: e.target.value },
                      }))
                    }
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={config.social.instagram || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        social: { ...prev.social, instagram: e.target.value },
                      }))
                    }
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={config.social.twitter || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        social: { ...prev.social, twitter: e.target.value },
                      }))
                    }
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={config.social.youtube || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        social: { ...prev.social, youtube: e.target.value },
                      }))
                    }
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
