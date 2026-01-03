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
import { Badge } from "@/components/ui/badge";
import { Save, Bell, Mail, MessageSquare, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    newMerchantAlert: true,
    paymentAlert: true,
    subscriptionExpiryAlert: true,
    systemAlert: true,
    webhookUrl: "",
    slackWebhook: "",
    alertEmail: "",
  });

  const handleSave = () => {
    toast.success("Notification settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure which events trigger email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alertEmail">Notification Email</Label>
            <Input
              id="alertEmail"
              type="email"
              value={settings.alertEmail}
              onChange={(e) =>
                setSettings({ ...settings, alertEmail: e.target.value })
              }
              placeholder="admin@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Primary email for receiving notifications
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-2">
                  <Mail className="h-4 w-4 text-green-500" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-base">New Merchant Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new merchant signs up
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.newMerchantAlert}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, newMerchantAlert: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-base">Payment Received</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified for successful payments
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.paymentAlert}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, paymentAlert: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-500/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-base">Subscription Expiry Warning</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when subscriptions are about to expire
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.subscriptionExpiryAlert}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, subscriptionExpiryAlert: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-500/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-base">System Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Critical system and deployment alerts
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.systemAlert}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, systemAlert: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Integrations
            <Badge variant="secondary">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Connect with external services for notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
            <Input
              id="slackWebhook"
              value={settings.slackWebhook}
              onChange={(e) =>
                setSettings({ ...settings, slackWebhook: e.target.value })
              }
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="text-xs text-muted-foreground">
              Send notifications to a Slack channel
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Custom Webhook URL</Label>
            <Input
              id="webhookUrl"
              value={settings.webhookUrl}
              onChange={(e) =>
                setSettings({ ...settings, webhookUrl: e.target.value })
              }
              placeholder="https://your-service.com/webhook"
            />
            <p className="text-xs text-muted-foreground">
              Send events to your own webhook endpoint
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
}

