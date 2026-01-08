"use client";

import { useEffect, useState } from "react";
import type { SSLCommerzConfig } from "@/lib/sslcommerz-config-types";
import { defaultSSLCommerzConfig } from "@/lib/sslcommerz-config-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, CreditCard, Eye, EyeOff } from "lucide-react";

interface PaymentConfigClientProps {
  initialConfig: SSLCommerzConfig;
}

export function PaymentConfigClient({ initialConfig }: PaymentConfigClientProps) {
  const [config, setConfig] = useState<SSLCommerzConfig>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showStorePassword, setShowStorePassword] = useState(false);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sslcommerz-config");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      const newConfig = data || defaultSSLCommerzConfig;
      setConfig(newConfig);
    } catch (error) {
      toast.error("Failed to load payment config");
      setConfig(defaultSSLCommerzConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sslcommerz-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save config");
      }
      toast.success("Payment configuration saved successfully!");
      await loadConfig();
    } catch (error: any) {
      toast.error(error.message || "Failed to save payment configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: string, value: any) => {
    setConfig({
      ...config,
      [field]: value,
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
      {/* SSLCommerz Configuration */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            <CardTitle>SSLCommerz Payment Gateway</CardTitle>
          </div>
          <CardDescription>Configure SSLCommerz for online payment processing</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Enable/Disable Toggle */}
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='sslcommerz-enabled'>Enable Online Payments</Label>
              <p className='text-sm text-muted-foreground'>Allow customers to pay online using SSLCommerz</p>
            </div>
            <Switch id='sslcommerz-enabled' checked={config.enabled} onCheckedChange={(checked) => updateConfig("enabled", checked)} />
          </div>

          {/* Store ID */}
          <div className='space-y-2'>
            <Label htmlFor='store-id'>Store ID</Label>
            <Input
              id='store-id'
              type='text'
              placeholder='Enter your SSLCommerz Store ID'
              value={config.storeId || ""}
              onChange={(e) => updateConfig("storeId", e.target.value)}
            />
            <p className='text-sm text-muted-foreground'>
              Get your Store ID from the{" "}
              <a href='https://developer.sslcommerz.com' target='_blank' rel='noopener noreferrer' className='text-primary hover:underline'>
                SSLCommerz Developer Portal
              </a>
            </p>
          </div>

          {/* Store Password */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='store-password'>Store Password</Label>
              <Button type='button' variant='ghost' size='sm' onClick={() => setShowStorePassword(!showStorePassword)} className='h-8'>
                {showStorePassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
              </Button>
            </div>
            <Input
              id='store-password'
              type={showStorePassword ? "text" : "password"}
              placeholder='Enter your SSLCommerz Store Password'
              value={config.storePassword || ""}
              onChange={(e) => updateConfig("storePassword", e.target.value)}
            />
            <p className='text-sm text-muted-foreground'>Keep this password secure. Never expose it in client-side code.</p>
          </div>

          {/* Live/Sandbox Mode */}
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label htmlFor='is-live'>Live Mode</Label>
              <p className='text-sm text-muted-foreground'>Enable for production, disable for testing (sandbox mode)</p>
            </div>
            <Switch id='is-live' checked={config.isLive} onCheckedChange={(checked) => updateConfig("isLive", checked)} />
          </div>

          {/* Info Box */}
          <div className='rounded-lg bg-muted p-4'>
            <Label className='text-sm font-semibold'>Important Notes</Label>
            <ul className='text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside'>
              <li>Test your payment gateway in sandbox mode before going live</li>
              <li>Ensure your SSLCommerz account is properly configured</li>
              <li>Keep your Store Password secure and never share it</li>
              <li>Contact SSLCommerz support for any technical issues</li>
            </ul>
          </div>
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
