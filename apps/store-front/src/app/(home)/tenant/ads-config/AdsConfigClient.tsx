"use client";

import { useEffect, useState } from "react";
import type { AdsConfig } from "@/lib/ads-config-types";
import { defaultAdsConfig } from "@/lib/ads-config-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, BarChart3, Facebook, Music, Tag, TrendingUp, Image as ImageIcon, Camera, Linkedin, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AdsConfigClientProps {
  initialConfig: AdsConfig;
}

export function AdsConfigClient({ initialConfig }: AdsConfigClientProps) {
  const [config, setConfig] = useState<AdsConfig>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { apiRequest } = await import("@/lib/api-client");
      // Backend route is /ads-config based on routes/index.ts
      const data = await apiRequest<AdsConfig>("GET", "/ads-config");
      const newConfig = data || defaultAdsConfig;
      setConfig(newConfig);
    } catch (error) {
      toast.error("Failed to load ads config");
      setConfig(defaultAdsConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { apiRequest } = await import("@/lib/api-client");
      await apiRequest("PUT", "/ads-config", config);

      toast.success("Ads configuration saved successfully!");
      await loadConfig();
    } catch (error: any) {
      toast.error(error.message || "Failed to save ads configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path: string[], value: any) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      let current: any = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Spinner className='h-8 w-8' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Meta Pixel (Facebook Pixel) */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Facebook className='h-5 w-5' />
            <CardTitle>Meta Pixel (Facebook Pixel)</CardTitle>
          </div>
          <CardDescription>Track conversions and optimize your Facebook and Instagram ads</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Enable Meta Pixel</Label>
              <p className='text-sm text-muted-foreground'>Track events and conversions for Facebook ads</p>
            </div>
            <Switch checked={config.metaPixel.enabled} onCheckedChange={(checked) => updateConfig(["metaPixel", "enabled"], checked)} />
          </div>
          {config.metaPixel.enabled && (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='meta-pixel-id'>Pixel ID</Label>
                <Input
                  id='meta-pixel-id'
                  type='text'
                  placeholder='Enter your Meta Pixel ID (e.g., 1234567890123456)'
                  value={config.metaPixel.pixelId || ""}
                  onChange={(e) => updateConfig(["metaPixel", "pixelId"], e.target.value)}
                />
                <p className='text-sm text-muted-foreground'>
                  Find your Pixel ID in{" "}
                  <a
                    href='https://business.facebook.com/events_manager'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline'
                  >
                    Meta Events Manager
                  </a>
                </p>
              </div>

              {/* Server-Side Tracking */}
              <div className='space-y-4 border-t pt-4'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label>Enable Server-Side Tracking</Label>
                    <p className='text-sm text-muted-foreground'>
                      Use Meta Conversions API for improved tracking accuracy and privacy compliance
                    </p>
                  </div>
                  <Switch
                    checked={config.metaPixel.serverSideTracking?.enabled || false}
                    onCheckedChange={(checked) => {
                      if (!config.metaPixel.serverSideTracking) {
                        updateConfig(["metaPixel", "serverSideTracking"], {
                          enabled: checked,
                          accessToken: "",
                          testEventCode: "",
                        });
                      } else {
                        updateConfig(["metaPixel", "serverSideTracking", "enabled"], checked);
                      }
                    }}
                  />
                </div>
                {config.metaPixel.serverSideTracking?.enabled && (
                  <div className='space-y-4 pl-4 border-l-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='meta-access-token'>Access Token</Label>
                      <Input
                        id='meta-access-token'
                        type='password'
                        placeholder='Enter your Meta Pixel Access Token'
                        value={config.metaPixel.serverSideTracking?.accessToken || ""}
                        onChange={(e) => updateConfig(["metaPixel", "serverSideTracking", "accessToken"], e.target.value)}
                      />
                      <p className='text-sm text-muted-foreground'>
                        Generate an access token in{" "}
                        <a
                          href='https://business.facebook.com/settings/system-users'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary hover:underline'
                        >
                          Meta Business Settings
                        </a>{" "}
                        with Conversions API permissions
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='meta-test-event-code'>Test Event Code (Optional)</Label>
                      <Input
                        id='meta-test-event-code'
                        type='text'
                        placeholder='Enter test event code for testing'
                        value={config.metaPixel.serverSideTracking?.testEventCode || ""}
                        onChange={(e) => updateConfig(["metaPixel", "serverSideTracking", "testEventCode"], e.target.value)}
                      />
                      <p className='text-sm text-muted-foreground'>
                        Use this to test server-side events in Meta Events Manager. Leave empty for production.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Tag Manager */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Tag className='h-5 w-5' />
            <CardTitle>Google Tag Manager</CardTitle>
          </div>
          <CardDescription>Manage all your tracking tags from one place</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Enable Google Tag Manager</Label>
              <p className='text-sm text-muted-foreground'>Centralized tag management for all tracking codes</p>
            </div>
            <Switch
              checked={config.googleTagManager.enabled}
              onCheckedChange={(checked) => updateConfig(["googleTagManager", "enabled"], checked)}
            />
          </div>
          {config.googleTagManager.enabled && (
            <div className='space-y-2'>
              <Label htmlFor='gtm-container-id'>Container ID</Label>
              <Input
                id='gtm-container-id'
                type='text'
                placeholder='Enter your GTM Container ID (e.g., GTM-XXXXXXX)'
                value={config.googleTagManager.containerId || ""}
                onChange={(e) => updateConfig(["googleTagManager", "containerId"], e.target.value)}
              />
              <p className='text-sm text-muted-foreground'>
                Find your Container ID in{" "}
                <a href='https://tagmanager.google.com' target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
                  Google Tag Manager
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button onClick={handleSave} disabled={saving} size='lg'>
          {saving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='mr-2 h-4 w-4' />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
