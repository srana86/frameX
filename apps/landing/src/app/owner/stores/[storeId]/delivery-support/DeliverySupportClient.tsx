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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  Loader2,
  Save,
  Package,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface DeliveryProvider {
  id: string;
  name: string;
  type: string;
  isEnabled: boolean;
  apiKey?: string;
}

interface DeliveryConfig {
  providers: DeliveryProvider[];
  defaultProvider: string;
  freeShippingThreshold: number;
  flatRate: number;
}

interface DeliverySupportClientProps {
  initialConfig: DeliveryConfig;
  storeId: string;
  permission: StaffPermission | null;
}

const AVAILABLE_PROVIDERS = [
  { id: "flat_rate", name: "Flat Rate Shipping", type: "FLAT_RATE" },
  { id: "free_shipping", name: "Free Shipping", type: "FREE" },
  { id: "local_pickup", name: "Local Pickup", type: "PICKUP" },
  { id: "pathao", name: "Pathao Courier", type: "PATHAO" },
  { id: "steadfast", name: "Steadfast Courier", type: "STEADFAST" },
  { id: "redx", name: "RedX Courier", type: "REDX" },
];

/**
 * Delivery Support Client Component
 */
export function DeliverySupportClient({
  initialConfig,
  storeId,
  permission,
}: DeliverySupportClientProps) {
  const [config, setConfig] = useState<DeliveryConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Toggle provider
  const toggleProvider = (providerId: string) => {
    const existingProvider = config.providers.find((p) => p.id === providerId);
    
    if (existingProvider) {
      setConfig((prev) => ({
        ...prev,
        providers: prev.providers.map((p) =>
          p.id === providerId ? { ...p, isEnabled: !p.isEnabled } : p
        ),
      }));
    } else {
      const providerInfo = AVAILABLE_PROVIDERS.find((p) => p.id === providerId);
      if (providerInfo) {
        setConfig((prev) => ({
          ...prev,
          providers: [
            ...prev.providers,
            {
              id: providerId,
              name: providerInfo.name,
              type: providerInfo.type,
              isEnabled: true,
            },
          ],
        }));
      }
    }
  };

  // Update provider API key
  const updateProviderApiKey = (providerId: string, apiKey: string) => {
    setConfig((prev) => ({
      ...prev,
      providers: prev.providers.map((p) =>
        p.id === providerId ? { ...p, apiKey } : p
      ),
    }));
  };

  // Save configuration
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify delivery settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("delivery-support", config);
      toast.success("Delivery settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Check if provider is enabled
  const isProviderEnabled = (providerId: string) => {
    return config.providers.find((p) => p.id === providerId)?.isEnabled ?? false;
  };

  // Get provider
  const getProvider = (providerId: string) => {
    return config.providers.find((p) => p.id === providerId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Support</h1>
          <p className="text-muted-foreground">
            Configure shipping and delivery options
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canEdit}>
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

      {/* Shipping Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Shipping Options
          </CardTitle>
          <CardDescription>
            Configure basic shipping rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="flatRate">Flat Rate Shipping ($)</Label>
              <Input
                id="flatRate"
                type="number"
                step="0.01"
                min="0"
                value={config.flatRate || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    flatRate: parseFloat(e.target.value) || 0,
                  }))
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">
                Free Shipping Threshold ($)
              </Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                step="0.01"
                min="0"
                value={config.freeShippingThreshold || ""}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    freeShippingThreshold: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0 = Disabled"
                disabled={!canEdit}
              />
              <p className="text-xs text-muted-foreground">
                Orders above this amount get free shipping
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Providers
          </CardTitle>
          <CardDescription>
            Enable and configure delivery services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {AVAILABLE_PROVIDERS.map((provider) => {
            const isEnabled = isProviderEnabled(provider.id);
            const providerData = getProvider(provider.id);
            const needsApiKey = ["PATHAO", "STEADFAST", "REDX"].includes(provider.type);

            return (
              <div
                key={provider.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  isEnabled ? "border-primary/50 bg-primary/5" : ""
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isEnabled ? "bg-primary/10" : "bg-muted"
                      )}
                    >
                      <Truck
                        className={cn(
                          "h-5 w-5",
                          isEnabled ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {provider.type}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleProvider(provider.id)}
                    disabled={!canEdit}
                  />
                </div>

                {isEnabled && needsApiKey && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`api-${provider.id}`}>API Key</Label>
                    <Input
                      id={`api-${provider.id}`}
                      type="password"
                      value={providerData?.apiKey || ""}
                      onChange={(e) =>
                        updateProviderApiKey(provider.id, e.target.value)
                      }
                      placeholder="Enter API key"
                      disabled={!canEdit}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Default Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Default Provider</CardTitle>
          <CardDescription>
            Select the default shipping method for orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={config.defaultProvider}
            onValueChange={(value) =>
              setConfig((prev) => ({ ...prev, defaultProvider: value }))
            }
            disabled={!canEdit}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select default provider" />
            </SelectTrigger>
            <SelectContent>
              {config.providers
                .filter((p) => p.isEnabled)
                .map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
