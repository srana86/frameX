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
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Loader2,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import type { StaffPermission } from "@/contexts/StoreContext";

interface PaymentConfig {
  gateways: {
    stripe: { enabled: boolean; publicKey: string; secretKey: string };
    paypal: { enabled: boolean; clientId: string; clientSecret: string };
    cod: { enabled: boolean };
  };
  currency: string;
  testMode: boolean;
}

interface PaymentConfigClientProps {
  initialConfig: PaymentConfig;
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Payment Configuration Client Component
 * Configure payment gateways
 */
export function PaymentConfigClient({
  initialConfig,
  storeId,
  permission,
}: PaymentConfigClientProps) {
  const [config, setConfig] = useState<PaymentConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Permission check
  const canEdit = permission === null || permission === "FULL";

  // Toggle secret visibility
  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Update gateway setting
  const updateGateway = (
    gateway: keyof PaymentConfig["gateways"],
    field: string,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      gateways: {
        ...prev.gateways,
        [gateway]: { ...prev.gateways[gateway], [field]: value },
      },
    }));
  };

  // Save configuration
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify payment settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("payment-config", config);
      toast.success("Payment configuration saved");
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
          <h1 className="text-3xl font-bold tracking-tight">Payment Configuration</h1>
          <p className="text-muted-foreground">
            Configure payment gateways and settings
          </p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You need FULL permission to modify payment settings.
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
          <h1 className="text-3xl font-bold tracking-tight">Payment Configuration</h1>
          <p className="text-muted-foreground">
            Configure payment gateways and settings
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

      {/* Test Mode Banner */}
      <Card className={config.testMode ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
        <CardContent className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className={config.testMode ? "h-5 w-5 text-yellow-600" : "h-5 w-5 text-green-600"} />
            <div>
              <p className={config.testMode ? "font-medium text-yellow-800" : "font-medium text-green-800"}>
                {config.testMode ? "Test Mode Active" : "Live Mode Active"}
              </p>
              <p className={config.testMode ? "text-sm text-yellow-700" : "text-sm text-green-700"}>
                {config.testMode
                  ? "Payments will be processed in test/sandbox mode"
                  : "Payments will be processed for real"}
              </p>
            </div>
          </div>
          <Switch
            checked={!config.testMode}
            onCheckedChange={(checked) =>
              setConfig((prev) => ({ ...prev, testMode: !checked }))
            }
          />
        </CardContent>
      </Card>

      {/* Stripe */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe
              </CardTitle>
              <CardDescription>
                Accept credit card payments via Stripe
              </CardDescription>
            </div>
            <Switch
              checked={config.gateways.stripe.enabled}
              onCheckedChange={(checked) =>
                updateGateway("stripe", "enabled", checked)
              }
            />
          </div>
        </CardHeader>
        {config.gateways.stripe.enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripePublicKey">Publishable Key</Label>
              <Input
                id="stripePublicKey"
                value={config.gateways.stripe.publicKey}
                onChange={(e) =>
                  updateGateway("stripe", "publicKey", e.target.value)
                }
                placeholder="pk_test_..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripeSecretKey">Secret Key</Label>
              <div className="relative">
                <Input
                  id="stripeSecretKey"
                  type={showSecrets.stripe ? "text" : "password"}
                  value={config.gateways.stripe.secretKey}
                  onChange={(e) =>
                    updateGateway("stripe", "secretKey", e.target.value)
                  }
                  placeholder="sk_test_..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => toggleSecret("stripe")}
                >
                  {showSecrets.stripe ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* PayPal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                PayPal
              </CardTitle>
              <CardDescription>
                Accept PayPal payments
              </CardDescription>
            </div>
            <Switch
              checked={config.gateways.paypal.enabled}
              onCheckedChange={(checked) =>
                updateGateway("paypal", "enabled", checked)
              }
            />
          </div>
        </CardHeader>
        {config.gateways.paypal.enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paypalClientId">Client ID</Label>
              <Input
                id="paypalClientId"
                value={config.gateways.paypal.clientId}
                onChange={(e) =>
                  updateGateway("paypal", "clientId", e.target.value)
                }
                placeholder="Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypalClientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="paypalClientSecret"
                  type={showSecrets.paypal ? "text" : "password"}
                  value={config.gateways.paypal.clientSecret}
                  onChange={(e) =>
                    updateGateway("paypal", "clientSecret", e.target.value)
                  }
                  placeholder="Client Secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => toggleSecret("paypal")}
                >
                  {showSecrets.paypal ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Cash on Delivery */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cash on Delivery
              </CardTitle>
              <CardDescription>
                Accept payment on delivery
              </CardDescription>
            </div>
            <Switch
              checked={config.gateways.cod.enabled}
              onCheckedChange={(checked) =>
                updateGateway("cod", "enabled", checked)
              }
            />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
