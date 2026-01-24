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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  referrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  status: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  status: string;
  requestedAt: string;
}

interface AffiliatesClientProps {
  initialData: {
    affiliates: Affiliate[];
    pendingWithdrawals: Withdrawal[];
    stats: {
      totalAffiliates: number;
      totalEarnings: number;
      pendingPayouts: number;
    };
    settings: any;
  };
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Affiliates Client Component
 * Manage affiliate program
 */
export function AffiliatesClient({
  initialData,
  storeId,
  permission,
}: AffiliatesClientProps) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>(initialData.affiliates);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(initialData.pendingWithdrawals);
  const [stats, setStats] = useState(initialData.stats);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [settings, setSettings] = useState(initialData.settings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Process withdrawal
  const processWithdrawal = async (withdrawalId: string, action: "approve" | "reject") => {
    if (!canEdit) {
      toast.error("You don't have permission to process withdrawals");
      return;
    }

    setProcessingId(withdrawalId);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.post(`affiliates/withdrawals`, {
        action: "update",
        withdrawalId,
        status: action === "approve" ? "COMPLETED" : "REJECTED"
      });

      setWithdrawals(withdrawals.filter((w) => w.id !== withdrawalId));

      if (action === "approve") {
        setStats((prev) => ({
          ...prev,
          pendingPayouts: prev.pendingPayouts - (withdrawals.find((w) => w.id === withdrawalId)?.amount || 0),
        }));
      }

      toast.success(`Withdrawal ${action === "approve" ? "approved" : "rejected"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to process withdrawal");
    } finally {
      setProcessingId(null);
    }
  };

  // Toggle affiliate status
  const toggleAffiliateStatus = async (affiliateId: string, currentStatus: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to modify affiliates");
      return;
    }

    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.patch(`affiliates/${affiliateId}`, { status: newStatus });

      setAffiliates(
        affiliates.map((a) =>
          a.id === affiliateId ? { ...a, status: newStatus } : a
        )
      );

      toast.success(`Affiliate ${newStatus === "SUSPENDED" ? "suspended" : "activated"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update affiliate");
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!canEdit) return;
    setSavingSettings(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.patch(`affiliate/settings`, settings);
      toast.success("Affiliate settings updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
        <p className="text-muted-foreground">
          Manage your affiliate program and commissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Total Affiliates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
          </CardContent>
        </Card>
        <Card className={stats.pendingPayouts > 0 ? "border-yellow-200" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingPayouts)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="affiliates">
        <TabsList>
          <TabsTrigger value="affiliates">
            Affiliates ({affiliates.length})
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            Pending Withdrawals ({withdrawals.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates">
          {affiliates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No affiliates yet</h3>
                <p className="text-muted-foreground text-center">
                  Affiliates will appear here when they join your program
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Affiliates</CardTitle>
                <CardDescription>Manage your affiliate partners</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-center">Referrals</TableHead>
                      <TableHead className="text-right">Total Earned</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      {canEdit && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((affiliate) => (
                      <TableRow key={affiliate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{affiliate.name}</p>
                            <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{affiliate.code}</TableCell>
                        <TableCell className="text-center">{affiliate.referrals}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(affiliate.totalEarnings)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(affiliate.pendingEarnings)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-xs font-medium",
                              affiliate.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {affiliate.status}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.status)}
                            >
                              {affiliate.status === "ACTIVE" ? "Suspend" : "Activate"}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          {withdrawals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending withdrawals</h3>
                <p className="text-muted-foreground text-center">
                  Withdrawal requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawals</CardTitle>
                <CardDescription>Review and process withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Affiliate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Requested</TableHead>
                      {canEdit && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-medium">
                          {withdrawal.affiliateName}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(withdrawal.requestedAt)}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => processWithdrawal(withdrawal.id, "approve")}
                                disabled={processingId === withdrawal.id}
                              >
                                {processingId === withdrawal.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => processWithdrawal(withdrawal.id, "reject")}
                                disabled={processingId === withdrawal.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Program Settings</CardTitle>
              <CardDescription>Configure how your affiliate program works</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Enable Affiliate Program</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to sign up and earn commissions
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                  disabled={!canEdit}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minWithdrawal">Minimum Withdrawal Amount</Label>
                <Input
                  id="minWithdrawal"
                  type="number"
                  value={settings.minWithdrawalAmount}
                  onChange={(e) => setSettings({ ...settings, minWithdrawalAmount: parseFloat(e.target.value) })}
                  disabled={!canEdit}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cookieExpiry">Cookie Expiry (Days)</Label>
                <Input
                  id="cookieExpiry"
                  type="number"
                  value={settings.cookieExpiryDays}
                  onChange={(e) => setSettings({ ...settings, cookieExpiryDays: parseInt(e.target.value) })}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Commission Levels</h3>
                {Object.entries(settings.commissionLevels || {}).map(([level, data]: [string, any]) => (
                  <div key={level} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label>Level {level} Commission (%)</Label>
                      <Input
                        type="number"
                        value={data.percentage}
                        onChange={(e) => {
                          const newLevels = { ...settings.commissionLevels };
                          newLevels[level] = { ...data, percentage: parseFloat(e.target.value) };
                          setSettings({ ...settings, commissionLevels: newLevels });
                        }}
                        disabled={!canEdit}
                      />
                    </div>
                    {level !== "1" && (
                      <div className="flex-1">
                        <Label>Orders Required</Label>
                        <Input
                          type="number"
                          value={settings.salesThresholds?.[level] || 0}
                          onChange={(e) => {
                            const newThresholds = { ...settings.salesThresholds };
                            newThresholds[level] = parseInt(e.target.value);
                            setSettings({ ...settings, salesThresholds: newThresholds });
                          }}
                          disabled={!canEdit}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
