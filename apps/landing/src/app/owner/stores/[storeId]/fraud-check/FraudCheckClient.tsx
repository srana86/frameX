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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Loader2,
  Save,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface FlaggedOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  riskScore: number;
  reasons: string[];
  status: string;
  createdAt: string;
}

interface FraudData {
  settings: {
    enabled: boolean;
    autoBlock: boolean;
    riskThreshold: number;
  };
  flaggedOrders: FlaggedOrder[];
  blockedIps: string[];
}

interface FraudCheckClientProps {
  initialData: FraudData;
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Fraud Check Client Component
 */
export function FraudCheckClient({
  initialData,
  storeId,
  permission,
}: FraudCheckClientProps) {
  const [data, setData] = useState<FraudData>(initialData);
  const [saving, setSaving] = useState(false);
  const [newIp, setNewIp] = useState("");

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Save settings
  const handleSaveSettings = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify fraud settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("fraud-check/settings", data.settings);
      toast.success("Fraud settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Resolve flagged order
  const resolveOrder = async (orderId: string, action: "approve" | "block") => {
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.post(`fraud-check/orders/${orderId}/${action}`);
      setData((prev) => ({
        ...prev,
        flaggedOrders: prev.flaggedOrders.map((o) =>
          o.id === orderId
            ? { ...o, status: action === "approve" ? "APPROVED" : "BLOCKED" }
            : o
        ),
      }));
      toast.success(`Order ${action === "approve" ? "approved" : "blocked"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    }
  };

  // Add blocked IP
  const addBlockedIp = async () => {
    if (!newIp.trim()) return;

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.post("fraud-check/blocked-ips", { ip: newIp });
      setData((prev) => ({
        ...prev,
        blockedIps: [...prev.blockedIps, newIp],
      }));
      setNewIp("");
      toast.success("IP blocked");
    } catch (error: any) {
      toast.error(error.message || "Failed to block IP");
    }
  };

  // Remove blocked IP
  const removeBlockedIp = async (ip: string) => {
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.delete(`fraud-check/blocked-ips/${encodeURIComponent(ip)}`);
      setData((prev) => ({
        ...prev,
        blockedIps: prev.blockedIps.filter((i) => i !== ip),
      }));
      toast.success("IP unblocked");
    } catch (error: any) {
      toast.error(error.message || "Failed to unblock IP");
    }
  };

  // Get risk color
  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600 bg-red-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fraud Check</h1>
        <p className="text-muted-foreground">
          Monitor and manage fraud detection
        </p>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">
            Flagged Orders ({data.flaggedOrders.filter((o) => o.status === "PENDING").length})
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs ({data.blockedIps.length})</TabsTrigger>
        </TabsList>

        {/* Flagged Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {data.flaggedOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">All Clear</h3>
                <p className="text-muted-foreground text-center">
                  No suspicious orders detected
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Flagged Orders
                </CardTitle>
                <CardDescription>
                  Review orders flagged for potential fraud
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Reasons</TableHead>
                      <TableHead>Status</TableHead>
                      {canEdit && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.flaggedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>{order.customerEmail}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-sm font-medium",
                              getRiskColor(order.riskScore)
                            )}
                          >
                            {order.riskScore}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <ul className="text-sm text-muted-foreground">
                            {order.reasons.slice(0, 2).map((reason, idx) => (
                              <li key={idx}>• {reason}</li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-xs font-medium",
                              order.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : order.status === "BLOCKED"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            )}
                          >
                            {order.status}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            {order.status === "PENDING" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600"
                                  onClick={() => resolveOrder(order.id, "approve")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => resolveOrder(order.id, "block")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Block
                                </Button>
                              </div>
                            )}
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
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Settings</CardTitle>
              <CardDescription>
                Configure how fraud detection works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Fraud Detection</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically analyze orders for fraud indicators
                  </p>
                </div>
                <Switch
                  checked={data.settings.enabled}
                  onCheckedChange={(checked) =>
                    setData((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, enabled: checked },
                    }))
                  }
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Block High Risk Orders</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically cancel orders above the risk threshold
                  </p>
                </div>
                <Switch
                  checked={data.settings.autoBlock}
                  onCheckedChange={(checked) =>
                    setData((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, autoBlock: checked },
                    }))
                  }
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Risk Threshold (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  max="100"
                  value={data.settings.riskThreshold}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        riskThreshold: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  disabled={!canEdit}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Orders with risk scores above this threshold will be flagged
                </p>
              </div>

              {canEdit && (
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Blocked IP Addresses
              </CardTitle>
              <CardDescription>
                Prevent orders from specific IP addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter IP address"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                  />
                  <Button onClick={addBlockedIp}>Block IP</Button>
                </div>
              )}

              {data.blockedIps.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No blocked IP addresses
                </p>
              ) : (
                <div className="space-y-2">
                  {data.blockedIps.map((ip) => (
                    <div
                      key={ip}
                      className="flex items-center justify-between rounded-lg border px-4 py-2"
                    >
                      <code className="text-sm">{ip}</code>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => removeBlockedIp(ip)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
