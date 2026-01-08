"use client";

import { useEffect, useState } from "react";
import type { OAuthConfig } from "@/lib/oauth-config-types";
import { defaultOAuthConfig } from "@/lib/oauth-config-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Shield, Eye, EyeOff } from "lucide-react";

interface OAuthConfigClientProps {
  initialConfig: OAuthConfig;
}

export function OAuthConfigClient({ initialConfig }: OAuthConfigClientProps) {
  const [config, setConfig] = useState<OAuthConfig>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/oauth-config");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      const newConfig = data || defaultOAuthConfig;
      setConfig(newConfig);
    } catch (error) {
      toast.error("Failed to load OAuth config");
      setConfig(defaultOAuthConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/oauth-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save config");
      }
      toast.success("OAuth configuration saved successfully!");
      await loadConfig();
    } catch (error: any) {
      toast.error(error.message || "Failed to save OAuth configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateGoogleConfig = (field: string, value: any) => {
    setConfig({
      ...config,
      google: {
        ...config.google,
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google OAuth Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Google OAuth</CardTitle>
          </div>
          <CardDescription>Configure Google OAuth for user authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="google-enabled">Enable Google OAuth</Label>
              <p className="text-sm text-muted-foreground">Allow users to sign in with their Google account</p>
            </div>
            <Switch
              id="google-enabled"
              checked={config.google.enabled}
              onCheckedChange={(checked) => updateGoogleConfig("enabled", checked)}
            />
          </div>

          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="google-client-id">Google Client ID</Label>
            <Input
              id="google-client-id"
              type="text"
              placeholder="Enter your Google OAuth Client ID"
              value={config.google.clientId || ""}
              onChange={(e) => updateGoogleConfig("clientId", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Get your Client ID from the{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="google-client-secret">Google Client Secret</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowClientSecret(!showClientSecret)}
                className="h-8"
              >
                {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Input
              id="google-client-secret"
              type={showClientSecret ? "text" : "password"}
              placeholder="Enter your Google OAuth Client Secret"
              value={config.google.clientSecret || ""}
              onChange={(e) => updateGoogleConfig("clientSecret", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Keep this secret secure. Never expose it in client-side code.
            </p>
          </div>

          {/* Redirect URI Info */}
          <div className="rounded-lg bg-muted p-4">
            <Label className="text-sm font-semibold">Redirect URI</Label>
            <p className="text-sm text-muted-foreground mt-1 font-mono break-all">
              {typeof window !== "undefined" ? `${window.location.origin}/api/auth/google` : "Your domain/api/auth/google"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Add this URL to your Google OAuth 2.0 Client ID authorized redirect URIs in the{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

