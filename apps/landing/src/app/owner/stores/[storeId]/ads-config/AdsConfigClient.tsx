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
import {
  Zap,
  Loader2,
  Save,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface AdsConfig {
  googleAnalytics: { enabled: boolean; trackingId: string };
  facebookPixel: { enabled: boolean; pixelId: string };
  tiktokPixel: { enabled: boolean; pixelId: string };
  googleAds: { enabled: boolean; conversionId: string };
}

interface AdsConfigClientProps {
  initialConfig: AdsConfig;
  storeId: string;
  permission: StaffPermission | null;
}

const PLATFORMS = [
  {
    key: "googleAnalytics" as const,
    name: "Google Analytics",
    description: "Track website traffic and user behavior",
    color: "bg-orange-500",
    fieldName: "trackingId",
    placeholder: "G-XXXXXXXXXX",
  },
  {
    key: "facebookPixel" as const,
    name: "Facebook Pixel",
    description: "Track conversions from Facebook ads",
    color: "bg-blue-600",
    fieldName: "pixelId",
    placeholder: "1234567890123456",
  },
  {
    key: "tiktokPixel" as const,
    name: "TikTok Pixel",
    description: "Track conversions from TikTok ads",
    color: "bg-black",
    fieldName: "pixelId",
    placeholder: "XXXXXXXXXXXXXXXXX",
  },
  {
    key: "googleAds" as const,
    name: "Google Ads",
    description: "Track conversions from Google Ads campaigns",
    color: "bg-green-500",
    fieldName: "conversionId",
    placeholder: "AW-XXXXXXXXX",
  },
];

/**
 * Ads Config Client Component
 */
export function AdsConfigClient({
  initialConfig,
  storeId,
  permission,
}: AdsConfigClientProps) {
  const [config, setConfig] = useState<AdsConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  // Permission check
  const canEdit = permission === null || permission === "FULL";

  // Update platform config
  const updatePlatform = (
    platform: keyof AdsConfig,
    field: string,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));
  };

  // Save configuration
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify ads settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("ads-config", config);
      toast.success("Ads configuration saved");
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
          <h1 className="text-3xl font-bold tracking-tight">Ads Configuration</h1>
          <p className="text-muted-foreground">
            Configure advertising and tracking pixels
          </p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You need FULL permission to modify ads settings.
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
          <h1 className="text-3xl font-bold tracking-tight">Ads Configuration</h1>
          <p className="text-muted-foreground">
            Configure advertising and tracking pixels
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

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 pt-6">
          <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Tracking Pixels</p>
            <p className="text-sm text-blue-700">
              Add tracking codes to measure your advertising performance.
              These pixels will be automatically added to your storefront.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Platform Cards */}
      <div className="space-y-4">
        {PLATFORMS.map((platform) => {
          const platformConfig = config[platform.key];

          return (
            <Card key={platform.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-white",
                        platform.color
                      )}
                    >
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={platformConfig.enabled}
                    onCheckedChange={(checked) =>
                      updatePlatform(platform.key, "enabled", checked)
                    }
                  />
                </div>
              </CardHeader>
              {platformConfig.enabled && (
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor={`${platform.key}-id`}>
                      {platform.fieldName === "trackingId"
                        ? "Tracking ID"
                        : platform.fieldName === "pixelId"
                        ? "Pixel ID"
                        : "Conversion ID"}
                    </Label>
                    <Input
                      id={`${platform.key}-id`}
                      value={(platformConfig as any)[platform.fieldName] || ""}
                      onChange={(e) =>
                        updatePlatform(
                          platform.key,
                          platform.fieldName,
                          e.target.value
                        )
                      }
                      placeholder={platform.placeholder}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
