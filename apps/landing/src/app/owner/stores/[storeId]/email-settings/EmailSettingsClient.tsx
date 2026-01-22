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
  Mail,
  Loader2,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import type { StaffPermission } from "@/contexts/StoreContext";

interface EmailSettings {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
  enabled: boolean;
}

interface EmailSettingsClientProps {
  initialSettings: EmailSettings;
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Email Settings Client Component
 * Configure SMTP settings
 */
export function EmailSettingsClient({
  initialSettings,
  storeId,
  permission,
}: EmailSettingsClientProps) {
  const [settings, setSettings] = useState<EmailSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Permission check
  const canEdit = permission === null || permission === "FULL";

  // Update SMTP field
  const updateSmtp = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      smtp: { ...prev.smtp, [field]: value },
    }));
  };

  // Save settings
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify email settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("email-settings", settings);
      toast.success("Email settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    setTesting(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.post("email-settings/test");
      toast.success("Test email sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Settings</h1>
          <p className="text-muted-foreground">
            Configure email settings for your store
          </p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You need FULL permission to modify email settings.
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
          <h1 className="text-3xl font-bold tracking-tight">Email Settings</h1>
          <p className="text-muted-foreground">
            Configure email settings for your store
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sendTestEmail} disabled={testing || !settings.enabled}>
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Test
          </Button>
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
      </div>

      {/* Enable Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Email Configuration</CardTitle>
              <CardDescription>
                Use your own SMTP server to send emails
              </CardDescription>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>
        </CardHeader>
      </Card>

      {/* Sender Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sender Information
          </CardTitle>
          <CardDescription>
            Configure the "From" address for your emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={settings.fromName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, fromName: e.target.value }))
                }
                placeholder="My Store"
                disabled={!settings.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={settings.fromEmail}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, fromEmail: e.target.value }))
                }
                placeholder="orders@mystore.com"
                disabled={!settings.enabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="replyTo">Reply-To Email</Label>
            <Input
              id="replyTo"
              type="email"
              value={settings.replyTo}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, replyTo: e.target.value }))
              }
              placeholder="support@mystore.com"
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMTP Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>
            Configure your SMTP server settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={settings.smtp.host}
                onChange={(e) => updateSmtp("host", e.target.value)}
                placeholder="smtp.example.com"
                disabled={!settings.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={settings.smtp.port}
                onChange={(e) => updateSmtp("port", parseInt(e.target.value, 10))}
                placeholder="587"
                disabled={!settings.enabled}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpUsername">Username</Label>
              <Input
                id="smtpUsername"
                value={settings.smtp.username}
                onChange={(e) => updateSmtp("username", e.target.value)}
                placeholder="username"
                disabled={!settings.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Password</Label>
              <div className="relative">
                <Input
                  id="smtpPassword"
                  type={showPassword ? "text" : "password"}
                  value={settings.smtp.password}
                  onChange={(e) => updateSmtp("password", e.target.value)}
                  placeholder="••••••••"
                  disabled={!settings.enabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!settings.enabled}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="smtpSecure"
              checked={settings.smtp.secure}
              onCheckedChange={(checked) => updateSmtp("secure", checked)}
              disabled={!settings.enabled}
            />
            <Label htmlFor="smtpSecure" className="cursor-pointer">
              Use SSL/TLS encryption
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
