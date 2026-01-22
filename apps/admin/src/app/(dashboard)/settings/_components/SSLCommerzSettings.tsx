"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CreditCard,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  TestTube,
  Zap,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  SSLCommerzConfig,
  defaultSSLCommerzConfig,
} from "@/lib/sslcommerz-config-types";

export function SSLCommerzSettings() {
  const [config, setConfig] = useState<SSLCommerzConfig>(
    defaultSSLCommerzConfig
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>("settings/sslcommerz");
      setConfig(data || defaultSSLCommerzConfig);
    } catch (error) {
      console.error("Failed to load SSLCommerz config:", error);
      setConfig(defaultSSLCommerzConfig);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.put("settings/sslcommerz", config);
      toast.success("Configuration saved successfully!");
      await loadConfig();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.storeId || !config.storePassword) {
      toast.error("Please enter Store ID and Store Password first");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const data = await api.post<any>("settings/sslcommerz/test", {
        storeId: config.storeId,
        storePassword: config.storePassword,
        isLive: config.isLive,
      });

      // Handle response - could be { success, message } or unwrapped data
      const success = data?.success ?? false;
      const message =
        data?.message ||
        (success
          ? "Connection successful! Your credentials are valid."
          : "Connection test failed. Please check your credentials.");

      setTestResult({
        success,
        message,
      });

      if (success) {
        toast.success("Connection test passed!");
      } else {
        toast.error("Connection test failed");
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error?.message || "Failed to test connection",
      });
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/api/checkout/ipn`);
    setCopied(true);
    toast.success("IPN URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-72 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {config.enabled ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-green-600">
                        Active
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold text-yellow-600">
                        Inactive
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Environment
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {config.isLive ? (
                    <Badge className="bg-green-500">Production</Badge>
                  ) : (
                    <Badge variant="secondary">Sandbox</Badge>
                  )}
                </div>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Store ID
                </p>
                <p className="mt-1 font-mono text-sm">
                  {config.storeId || "Not configured"}
                </p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            SSLCommerz Configuration
          </CardTitle>
          <CardDescription>
            Configure your SSLCommerz payment gateway credentials. Get your
            credentials from{" "}
            <a
              href="https://developer.sslcommerz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              SSLCommerz Developer Portal
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Payment Gateway</Label>
              <p className="text-sm text-muted-foreground">
                Turn on SSLCommerz payment processing for checkout
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Live Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between sandbox (testing) and production mode
              </p>
            </div>
            <Switch
              checked={config.isLive}
              onCheckedChange={(checked) =>
                setConfig({ ...config, isLive: checked })
              }
            />
          </div>

          {config.isLive && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Production Mode Active</AlertTitle>
              <AlertDescription>
                Real payments will be processed. Make sure your credentials are
                correct.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="storeId">Store ID *</Label>
              <Input
                id="storeId"
                value={config.storeId || ""}
                onChange={(e) =>
                  setConfig({ ...config, storeId: e.target.value })
                }
                placeholder="Enter your Store ID"
              />
              <p className="text-xs text-muted-foreground">
                Your SSLCommerz tenant Store ID
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storePassword">Store Password *</Label>
              <div className="relative">
                <Input
                  id="storePassword"
                  type={showPassword ? "text" : "password"}
                  value={config.storePassword || ""}
                  onChange={(e) =>
                    setConfig({ ...config, storePassword: e.target.value })
                  }
                  placeholder="Enter your Store Password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your SSLCommerz tenant Store Password
              </p>
            </div>
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {testResult.success ? "Success" : "Failed"}
              </AlertTitle>
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testing || !config.storeId || !config.storePassword}
            >
              {testing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={loadConfig}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={saveConfig} disabled={saving}>
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Configuration
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Configure these URLs in your SSLCommerz tenant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>IPN (Instant Payment Notification) URL</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/api/checkout/ipn`}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Set this URL in your SSLCommerz tenant panel for payment
              verification
            </p>
          </div>

          <div className="rounded-lg border border-dashed p-4">
            <h4 className="font-medium mb-2">Setup Instructions</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Log in to your{" "}
                <a
                  href="https://tenant.sslcommerz.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SSLCommerz Tenant Panel
                </a>
              </li>
              <li>Navigate to Settings → API/Integration</li>
              <li>Enter the IPN URL above in the IPN URL field</li>
              <li>Save your settings and test a transaction</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History Quick Link */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href="/subscriptions"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">View Subscriptions</p>
                <p className="text-xs text-muted-foreground">
                  Manage active subscriptions
                </p>
              </div>
            </a>
            <a
              href="/payments"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Payment History</p>
                <p className="text-xs text-muted-foreground">
                  View all transactions
                </p>
              </div>
            </a>
            <a
              href="https://developer.sslcommerz.com/doc/v4/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">API Documentation</p>
                <p className="text-xs text-muted-foreground">SSLCommerz docs</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
