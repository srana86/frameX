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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Loader2,
  Save,
  Mail,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import type { StaffPermission } from "@/contexts/StoreContext";

interface NotificationSettings {
  email: {
    newOrder: boolean;
    orderStatusChange: boolean;
    lowStock: boolean;
    newCustomer: boolean;
    review: boolean;
  };
  push: {
    newOrder: boolean;
    orderStatusChange: boolean;
    lowStock: boolean;
  };
}

interface NotificationsClientProps {
  initialSettings: NotificationSettings;
  storeId: string;
  permission: StaffPermission | null;
}

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function NotificationToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <Label className="text-base">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

/**
 * Notifications Client Component
 * Configure notification preferences
 */
export function NotificationsClient({
  initialSettings,
  storeId,
  permission,
}: NotificationsClientProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Update email setting
  const updateEmail = (key: keyof NotificationSettings["email"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
  };

  // Update push setting
  const updatePush = (key: keyof NotificationSettings["push"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      push: { ...prev.push, [key]: value },
    }));
  };

  // Save settings
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to modify notification settings");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put("notifications/settings", settings);
      toast.success("Notification settings saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Configure how you receive notifications
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canEdit}>
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

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <NotificationToggle
            label="New Orders"
            description="Get notified when a new order is placed"
            checked={settings.email.newOrder}
            onCheckedChange={(checked) => updateEmail("newOrder", checked)}
            disabled={!canEdit}
          />
          <Separator />
          <NotificationToggle
            label="Order Status Changes"
            description="Get notified when order status changes"
            checked={settings.email.orderStatusChange}
            onCheckedChange={(checked) => updateEmail("orderStatusChange", checked)}
            disabled={!canEdit}
          />
          <Separator />
          <NotificationToggle
            label="Low Stock Alerts"
            description="Get notified when product stock is low"
            checked={settings.email.lowStock}
            onCheckedChange={(checked) => updateEmail("lowStock", checked)}
            disabled={!canEdit}
          />
          <Separator />
          <NotificationToggle
            label="New Customers"
            description="Get notified when a new customer registers"
            checked={settings.email.newCustomer}
            onCheckedChange={(checked) => updateEmail("newCustomer", checked)}
            disabled={!canEdit}
          />
          <Separator />
          <NotificationToggle
            label="Product Reviews"
            description="Get notified when customers leave reviews"
            checked={settings.email.review}
            onCheckedChange={(checked) => updateEmail("review", checked)}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive push notifications on your devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <NotificationToggle
            label="New Orders"
            description="Get instant push notifications for new orders"
            checked={settings.push.newOrder}
            onCheckedChange={(checked) => updatePush("newOrder", checked)}
            disabled={!canEdit}
          />
          <Separator />
          <NotificationToggle
            label="Order Status Changes"
            description="Get push notifications for order updates"
            checked={settings.push.orderStatusChange}
            onCheckedChange={(checked) => updatePush("orderStatusChange", checked)}
            disabled={!canEdit}
          />
          <Separator />
          <NotificationToggle
            label="Low Stock Alerts"
            description="Get urgent alerts for low stock items"
            checked={settings.push.lowStock}
            onCheckedChange={(checked) => updatePush("lowStock", checked)}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
