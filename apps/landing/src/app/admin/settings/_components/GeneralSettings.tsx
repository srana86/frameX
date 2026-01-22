"use client";

import { useState, useEffect } from "react";
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
import { Save, Globe, Clock, Palette, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { CURRENCIES, formatCurrency } from "@/lib/currency";

export function GeneralSettings() {
  const { settings: currentSettings, updateSettings, loading: contextLoading } = useSettings();
  const [settings, setSettings] = useState({
    siteName: "FrameX Super Admin",
    defaultCurrency: "BDT",
    timezone: "Asia/Dhaka",
    dateFormat: "DD/MM/YYYY",
    darkMode: false,
    autoRefresh: true,
    refreshInterval: 30,
  });
  const [saving, setSaving] = useState(false);

  // Sync with context settings
  useEffect(() => {
    if (!contextLoading) {
      setSettings(currentSettings);
    }
  }, [currentSettings, contextLoading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Preview amount for currency display
  const previewAmount = 1234.56;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Settings
          </CardTitle>
          <CardDescription>
            Configure general site settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={settings.defaultCurrency}
                onValueChange={(value) =>
                  setSettings({ ...settings, defaultCurrency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{config.symbol}</span>
                        <span>{code} - {config.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Currency Preview */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">Currency Preview</Label>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Standard</p>
                <p className="text-lg font-semibold">{formatCurrency(previewAmount, settings.defaultCurrency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Large Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(123456.78, settings.defaultCurrency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compact</p>
                <p className="text-lg font-semibold">{formatCurrency(1500000, settings.defaultCurrency, { compact: true })}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) =>
                  setSettings({ ...settings, timezone: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) =>
                  setSettings({ ...settings, dateFormat: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Display Preferences
          </CardTitle>
          <CardDescription>
            Customize your dashboard experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable dark theme for the dashboard
              </p>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, darkMode: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Auto Refresh
          </CardTitle>
          <CardDescription>
            Configure automatic data refresh settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Auto Refresh</Label>
              <p className="text-sm text-muted-foreground">
                Automatically refresh dashboard data
              </p>
            </div>
            <Switch
              checked={settings.autoRefresh}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoRefresh: checked })
              }
            />
          </div>

          {settings.autoRefresh && (
            <div className="space-y-2">
              <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
              <Input
                id="refreshInterval"
                type="number"
                min={10}
                max={300}
                value={settings.refreshInterval}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    refreshInterval: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || contextLoading}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

