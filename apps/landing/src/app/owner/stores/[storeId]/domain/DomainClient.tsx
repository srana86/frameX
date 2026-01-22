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
import {
  Globe,
  Loader2,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface DomainSettings {
  subdomain: string;
  customDomain: string;
  domainStatus: string;
  sslStatus: string;
}

interface DomainClientProps {
  initialSettings: DomainSettings;
  storeId: string;
  permission: StaffPermission | null;
}

const STATUS_ICONS: Record<string, { icon: any; className: string }> = {
  VERIFIED: { icon: CheckCircle, className: "text-green-500" },
  ACTIVE: { icon: CheckCircle, className: "text-green-500" },
  PENDING: { icon: Clock, className: "text-yellow-500" },
  FAILED: { icon: XCircle, className: "text-red-500" },
  NONE: { icon: AlertCircle, className: "text-gray-400" },
};

/**
 * Domain Client Component
 * Configure custom domain settings
 */
export function DomainClient({
  initialSettings,
  storeId,
  permission,
}: DomainClientProps) {
  const [settings, setSettings] = useState<DomainSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Permission check
  const canEdit = permission === null || permission === "FULL";

  // Save domain
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify domain settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.put("domain", {
        customDomain: settings.customDomain,
      });
      setSettings({ ...settings, ...(result as any) });
      toast.success("Domain settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save domain settings");
    } finally {
      setSaving(false);
    }
  };

  // Verify domain
  const verifyDomain = async () => {
    setVerifying(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.post("domain/verify");
      setSettings({ ...settings, ...(result as any) });
      
      if ((result as any).domainStatus === "VERIFIED") {
        toast.success("Domain verified successfully!");
      } else {
        toast.info("Domain verification in progress...");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify domain");
    } finally {
      setVerifying(false);
    }
  };

  const domainStatusInfo = STATUS_ICONS[settings.domainStatus] || STATUS_ICONS.NONE;
  const sslStatusInfo = STATUS_ICONS[settings.sslStatus] || STATUS_ICONS.NONE;
  const DomainIcon = domainStatusInfo.icon;
  const SSLIcon = sslStatusInfo.icon;

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Settings</h1>
          <p className="text-muted-foreground">
            Configure custom domain for your store
          </p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You need FULL permission to modify domain settings.
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
          <h1 className="text-3xl font-bold tracking-tight">Domain Settings</h1>
          <p className="text-muted-foreground">
            Configure custom domain for your store
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

      {/* Subdomain Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Default Subdomain
          </CardTitle>
          <CardDescription>
            Your store is available at this address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-4">
            <span className="font-mono text-lg">
              {settings.subdomain || storeId}.framextech.com
            </span>
            <a
              href={`https://${settings.subdomain || storeId}.framextech.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            This subdomain is always active and cannot be changed.
          </p>
        </CardContent>
      </Card>

      {/* Custom Domain Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>
            Use your own domain for your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom Domain</Label>
            <Input
              id="customDomain"
              value={settings.customDomain}
              onChange={(e) =>
                setSettings({ ...settings, customDomain: e.target.value })
              }
              placeholder="shop.yourdomain.com"
            />
          </div>

          {settings.customDomain && (
            <>
              {/* Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Domain Status</span>
                    <div className="flex items-center gap-1">
                      <DomainIcon className={cn("h-4 w-4", domainStatusInfo.className)} />
                      <span className="text-sm">{settings.domainStatus}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SSL Certificate</span>
                    <div className="flex items-center gap-1">
                      <SSLIcon className={cn("h-4 w-4", sslStatusInfo.className)} />
                      <span className="text-sm">{settings.sslStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DNS Instructions */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">DNS Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add the following DNS record to your domain:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-medium">Type</th>
                          <th className="py-2 text-left font-medium">Name</th>
                          <th className="py-2 text-left font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 font-mono">CNAME</td>
                          <td className="py-2 font-mono">
                            {settings.customDomain.split(".")[0]}
                          </td>
                          <td className="py-2 font-mono">stores.framextech.com</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Button
                    variant="outline"
                    onClick={verifyDomain}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Verify Domain
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
