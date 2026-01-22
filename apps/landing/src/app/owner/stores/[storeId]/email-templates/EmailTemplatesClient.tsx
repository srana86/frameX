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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Loader2,
  Save,
  Pencil,
  Eye,
  ShoppingCart,
  Truck,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  isActive: boolean;
}

interface EmailTemplatesClientProps {
  initialTemplates: EmailTemplate[];
  storeId: string;
  permission: StaffPermission | null;
}

const TEMPLATE_ICONS: Record<string, any> = {
  ORDER_CONFIRMATION: ShoppingCart,
  ORDER_SHIPPED: Truck,
  ORDER_DELIVERED: Truck,
  WELCOME: UserPlus,
  PASSWORD_RESET: Mail,
};

const DEFAULT_TEMPLATES = [
  { type: "ORDER_CONFIRMATION", name: "Order Confirmation", description: "Sent when an order is placed" },
  { type: "ORDER_SHIPPED", name: "Order Shipped", description: "Sent when an order is shipped" },
  { type: "ORDER_DELIVERED", name: "Order Delivered", description: "Sent when an order is delivered" },
  { type: "WELCOME", name: "Welcome Email", description: "Sent when a customer registers" },
  { type: "PASSWORD_RESET", name: "Password Reset", description: "Sent for password reset requests" },
];

/**
 * Email Templates Client Component
 */
export function EmailTemplatesClient({
  initialTemplates,
  storeId,
  permission,
}: EmailTemplatesClientProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    isActive: true,
  });

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Get template by type
  const getTemplate = (type: string) => templates.find((t) => t.type === type);

  // Open edit dialog
  const openEditDialog = (templateType: string) => {
    const template = getTemplate(templateType);
    if (template) {
      setEditingTemplate(template);
      setFormData({
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
      });
    } else {
      // Create new template
      setEditingTemplate({
        id: "",
        name: DEFAULT_TEMPLATES.find((t) => t.type === templateType)?.name || "",
        type: templateType,
        subject: "",
        body: "",
        isActive: true,
      });
      setFormData({
        subject: "",
        body: "",
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  // Save template
  const handleSave = async () => {
    if (!formData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);

      if (editingTemplate?.id) {
        // Update existing
        const result: any = await storeApi.put(
          `email-templates/${editingTemplate.id}`,
          formData
        );
        setTemplates(
          templates.map((t) =>
            t.id === editingTemplate.id ? { ...t, ...result } : t
          )
        );
      } else {
        // Create new
        const result = await storeApi.post("email-templates", {
          ...formData,
          type: editingTemplate?.type,
        });
        setTemplates([...templates, result as EmailTemplate]);
      }

      toast.success("Template saved");
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground">
          Customize the emails sent to your customers
        </p>
      </div>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 pt-6">
          <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Template Variables</p>
            <p className="text-sm text-blue-700">
              Use variables like {`{{customer_name}}`}, {`{{order_number}}`}, {`{{tracking_number}}`} in your templates.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {DEFAULT_TEMPLATES.map((templateInfo) => {
          const template = getTemplate(templateInfo.type);
          const Icon = TEMPLATE_ICONS[templateInfo.type] || Mail;

          return (
            <Card key={templateInfo.type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        template?.isActive ? "bg-primary/10" : "bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          template?.isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{templateInfo.name}</CardTitle>
                      <CardDescription>{templateInfo.description}</CardDescription>
                    </div>
                  </div>
                  {template?.isActive ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {template ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Subject:</span>{" "}
                      {template.subject}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No custom template. Default system template will be used.
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(templateInfo.type)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {template ? "Edit" : "Customize"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              {editingTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Your order #{{order_number}} has been confirmed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Email Body (HTML supported)</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, body: e.target.value }))
                }
                rows={12}
                placeholder="<p>Hi {{customer_name}},</p>&#10;<p>Thank you for your order!</p>"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Enable this template
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
