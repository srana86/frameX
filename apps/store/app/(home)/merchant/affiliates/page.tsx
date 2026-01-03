"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Gift, Settings, Users, DollarSign, CheckCircle, Clock, XCircle, Eye, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { AffiliateSettings, CommissionLevel } from "@/lib/affiliate-types";
import AffiliatesListClient from "./AffiliatesListClient";
import WithdrawalsClient from "./WithdrawalsClient";

export default function AffiliatesPage() {
  const currencySymbol = useCurrencySymbol();
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/affiliate/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load affiliate settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/affiliate/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateCommissionLevel = (level: CommissionLevel, field: "percentage" | "enabled" | "requiredSales", value: number | boolean) => {
    if (!settings) return;

    setSettings({
      ...settings,
      commissionLevels: {
        ...settings.commissionLevels,
        [level]: {
          ...settings.commissionLevels[level],
          percentage: settings.commissionLevels[level]?.percentage || 0,
          enabled: settings.commissionLevels[level]?.enabled || false,
          requiredSales: settings.commissionLevels[level]?.requiredSales || 0,
          [field]: value,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className='space-y-6 mt-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <Gift className='w-8 h-8 text-primary' />
          Affiliate Management
        </h1>
        <p className='text-muted-foreground mt-2'>Manage your affiliate program settings and affiliates</p>
      </div>

      <Tabs defaultValue='settings' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='settings'>
            <Settings className='w-4 h-4 mr-2' />
            Settings
          </TabsTrigger>
          <TabsTrigger value='affiliates'>
            <Users className='w-4 h-4 mr-2' />
            Affiliates
          </TabsTrigger>
          <TabsTrigger value='withdrawals'>
            <DollarSign className='w-4 h-4 mr-2' />
            Withdrawals
          </TabsTrigger>
        </TabsList>

        <TabsContent value='settings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Settings</CardTitle>
              <CardDescription>Configure your affiliate program</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='enabled'>Enable Affiliate System</Label>
                  <p className='text-sm text-muted-foreground'>Allow users to become affiliates and earn commissions</p>
                </div>
                <Switch
                  id='enabled'
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
              </div>

              <Separator />

              <div className='space-y-2'>
                <Label htmlFor='minWithdrawal'>Minimum Withdrawal Amount</Label>
                <Input
                  id='minWithdrawal'
                  type='number'
                  value={settings.minWithdrawalAmount}
                  onChange={(e) => setSettings({ ...settings, minWithdrawalAmount: parseFloat(e.target.value) || 0 })}
                  min='0'
                  step='0.01'
                />
                <p className='text-sm text-muted-foreground'>Minimum amount affiliates must have before requesting withdrawal</p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='cookieExpiry'>Cookie Expiry (Days)</Label>
                <Input
                  id='cookieExpiry'
                  type='number'
                  value={settings.cookieExpiryDays}
                  onChange={(e) => setSettings({ ...settings, cookieExpiryDays: parseInt(e.target.value) || 30 })}
                  min='1'
                  max='365'
                />
                <p className='text-sm text-muted-foreground'>How long affiliate referral cookies remain valid</p>
              </div>

              <Separator />

              <div className='space-y-4'>
                <Label>Commission Levels</Label>
                <p className='text-sm text-muted-foreground'>
                  Set commission percentages and required delivered sales for each level. Affiliates progress through levels based on
                  successfully delivered orders.
                </p>

                {([1, 2, 3, 4, 5] as CommissionLevel[]).map((level) => {
                  const levelConfig = settings.commissionLevels[level] || {
                    percentage: 0,
                    enabled: false,
                    requiredSales: 0,
                  };

                  return (
                    <div key={level} className='p-4 border rounded-lg space-y-3'>
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <Label>Level {level}</Label>
                          <p className='text-sm text-muted-foreground'>
                            {level === 1 ? "Starting level" : `Requires ${levelConfig.requiredSales || 0} delivered sales`}
                          </p>
                        </div>
                        <Switch
                          checked={levelConfig.enabled}
                          onCheckedChange={(checked) => updateCommissionLevel(level, "enabled", checked)}
                        />
                      </div>
                      {levelConfig.enabled && (
                        <div className='grid grid-cols-2 gap-3 pt-2 border-t'>
                          <div>
                            <Label className='text-xs'>Commission %</Label>
                            <div className='flex items-center gap-2 mt-1'>
                              <Input
                                type='number'
                                value={levelConfig.percentage || 0}
                                onChange={(e) => updateCommissionLevel(level, "percentage", parseFloat(e.target.value) || 0)}
                                min='0'
                                max='100'
                                step='0.1'
                                className='w-full'
                              />
                              <span className='text-sm'>%</span>
                            </div>
                          </div>
                          <div>
                            <Label className='text-xs'>Required Sales</Label>
                            <Input
                              type='number'
                              value={levelConfig.requiredSales || 0}
                              onChange={(e) => updateCommissionLevel(level, "requiredSales", parseInt(e.target.value) || 0)}
                              min='0'
                              step='1'
                              className='w-full mt-1'
                              placeholder={level === 1 ? "0 (default)" : "e.g., 10, 20"}
                            />
                            <p className='text-xs text-muted-foreground mt-1'>Delivered orders needed</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button onClick={saveSettings} disabled={saving} className='w-full'>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='affiliates'>
          <AffiliatesListClient />
        </TabsContent>

        <TabsContent value='withdrawals'>
          <WithdrawalsClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
