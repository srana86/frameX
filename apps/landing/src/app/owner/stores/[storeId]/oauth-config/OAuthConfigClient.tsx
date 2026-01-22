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
  Shield,
  Loader2,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface OAuthProvider {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
}

interface OAuthConfig {
  google: OAuthProvider;
  facebook: OAuthProvider;
  github: OAuthProvider;
}

interface OAuthConfigClientProps {
  initialConfig: OAuthConfig;
  storeId: string;
  permission: StaffPermission | null;
}

const PROVIDERS = [
  {
    key: "google" as const,
    name: "Google",
    color: "bg-red-500",
    docsUrl: "https://console.developers.google.com/",
  },
  {
    key: "facebook" as const,
    name: "Facebook",
    color: "bg-blue-600",
    docsUrl: "https://developers.facebook.com/apps/",
  },
  {
    key: "github" as const,
    name: "GitHub",
    color: "bg-gray-800",
    docsUrl: "https://github.com/settings/developers",
  },
];

/**
 * OAuth Config Client Component
 */
export function OAuthConfigClient({
  initialConfig,
  storeId,
  permission,
}: OAuthConfigClientProps) {
  const [config, setConfig] = useState<OAuthConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Permission check
  const canEdit = permission === null || permission === "FULL";

  // Toggle secret visibility
  const toggleSecret = (provider: string) => {
    setShowSecrets((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  // Update provider
  const updateProvider = (
    provider: keyof OAuthConfig,
    field: keyof OAuthProvider,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value },
    }));
  };

  // Save configuration
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify OAuth settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("oauth-config", config);
      toast.success("OAuth configuration saved");
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
          <h1 className="text-3xl font-bold tracking-tight">OAuth Configuration</h1>
          <p className="text-muted-foreground">
            Configure social login for your customers
          </p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You need FULL permission to modify OAuth settings.
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
          <h1 className="text-3xl font-bold tracking-tight">OAuth Configuration</h1>
          <p className="text-muted-foreground">
            Configure social login for your customers
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
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">
              Social Login Setup
            </p>
            <p className="text-sm text-blue-700">
              Enable social login to allow customers to sign in with their existing accounts.
              You'll need to create OAuth applications with each provider.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const providerConfig = config[provider.key];

          return (
            <Card key={provider.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold",
                        provider.color
                      )}
                    >
                      {provider.name[0]}
                    </div>
                    <div>
                      <CardTitle>{provider.name}</CardTitle>
                      <CardDescription>
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Developer Console →
                        </a>
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={providerConfig.enabled}
                    onCheckedChange={(checked) =>
                      updateProvider(provider.key, "enabled", checked)
                    }
                  />
                </div>
              </CardHeader>
              {providerConfig.enabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.key}-clientId`}>Client ID</Label>
                    <Input
                      id={`${provider.key}-clientId`}
                      value={providerConfig.clientId}
                      onChange={(e) =>
                        updateProvider(provider.key, "clientId", e.target.value)
                      }
                      placeholder="Enter client ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.key}-clientSecret`}>
                      Client Secret
                    </Label>
                    <div className="relative">
                      <Input
                        id={`${provider.key}-clientSecret`}
                        type={showSecrets[provider.key] ? "text" : "password"}
                        value={providerConfig.clientSecret}
                        onChange={(e) =>
                          updateProvider(
                            provider.key,
                            "clientSecret",
                            e.target.value
                          )
                        }
                        placeholder="Enter client secret"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => toggleSecret(provider.key)}
                      >
                        {showSecrets[provider.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Callback URL:{" "}
                    <code className="rounded bg-muted px-1">
                      https://your-store.com/api/auth/callback/{provider.key}
                    </code>
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
