"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  FolderSync,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Truck,
  Copy,
  Check,
  Edit2,
  Save,
  X,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Order, FraudCheckData } from "@/lib/types";
import { getRiskBadgeColor, calculateRiskLevel, type FraudRiskLevel } from "@/lib/fraud-check/common";

interface CustomerInfoCardProps {
  order: Order;
  fraudData: FraudCheckData | null;
  loadingFraud: boolean;
  savingFraud: boolean;
  fraudError: string | null;
  isCustomerBlocked: boolean;
  blockingCustomer: boolean;
  onUpdateCustomer: (updates: Partial<Order["customer"]>) => Promise<void>;
  onCheckFraud: (forceRefresh: boolean) => void;
  onToggleFraudBlock: (block: boolean) => void;
}

// Helper function to get risk badge
const getRiskBadge = (risk: FraudRiskLevel) => {
  const baseClass = getRiskBadgeColor(risk);
  const icons = {
    low: <CheckCircle2 className='size-3' />,
    medium: <AlertTriangle className='size-3' />,
    high: <XCircle className='size-3' />,
    unknown: <Info className='size-3' />,
  };

  return (
    <Badge className={`${baseClass} flex items-center gap-1`}>
      {icons[risk]}
      <span className='capitalize'>{risk} Risk</span>
    </Badge>
  );
};

// Format date helper
const formatFraudDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// Courier History Item Component
const CourierHistoryItem = ({
  courier,
}: {
  courier: { courier: string; total: number; successful: number; failed: number; success_rate?: number; logo?: string };
}) => {
  const [imageError, setImageError] = useState(false);
  const successRate = courier.success_rate ?? (courier.total > 0 ? Math.round((courier.successful / courier.total) * 100) : 0);
  const risk = calculateRiskLevel(successRate);

  const getProgressColor = () => {
    if (successRate >= 90) return "bg-green-500";
    if (successRate >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className='border rounded-lg p-3 space-y-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {courier.logo && !imageError ? (
            <img src={courier.logo} alt={courier.courier} className='w-8 h-8 object-contain' onError={() => setImageError(true)} />
          ) : (
            <Truck className='size-4 text-primary' />
          )}
          <div>
            <h4 className='font-semibold text-sm'>{courier.courier}</h4>
            <p className='text-xs text-muted-foreground'>{courier.total} parcels</p>
          </div>
        </div>
        {getRiskBadge(risk)}
      </div>
      <div className='grid grid-cols-3 gap-2 text-xs'>
        <div>
          <p className='text-muted-foreground'>Successful</p>
          <p className='font-bold text-green-600'>{courier.successful}</p>
        </div>
        <div>
          <p className='text-muted-foreground'>Failed</p>
          <p className='font-bold text-red-600'>{courier.failed}</p>
        </div>
        <div>
          <p className='text-muted-foreground'>Success Rate</p>
          <p className='font-bold text-blue-600'>{successRate}%</p>
        </div>
      </div>
      <div className='relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
        <div className={`h-full transition-all duration-500 ${getProgressColor()}`} style={{ width: `${successRate}%` }} />
      </div>
    </div>
  );
};

export function CustomerInfoCard({
  order,
  fraudData,
  loadingFraud,
  savingFraud,
  fraudError,
  isCustomerBlocked,
  blockingCustomer,
  onUpdateCustomer,
  onCheckFraud,
  onToggleFraudBlock,
}: CustomerInfoCardProps) {
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Order["customer"]>>({});

  const handleCopy = async (text: string, field: string, label: string) => {
    if (editingField) return; // Don't copy when editing
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleEdit = (field: string) => {
    setEditingField(field);
    if (field === "address") {
      // Initialize all address fields
      setEditValues({
        addressLine1: order.customer.addressLine1,
        addressLine2: order.customer.addressLine2,
        city: order.customer.city,
        postalCode: order.customer.postalCode,
      });
    } else {
      setEditValues({
        [field]: order.customer[field as keyof Order["customer"]],
      });
    }
  };

  const handleSave = async () => {
    if (!editingField) return;

    try {
      // Special handling for address fields
      if (editingField === "address") {
        // Check if any address field has been modified
        const hasAddressChanges =
          editValues.addressLine1 !== undefined ||
          editValues.addressLine2 !== undefined ||
          editValues.city !== undefined ||
          editValues.postalCode !== undefined;

        if (hasAddressChanges) {
          await onUpdateCustomer(editValues);
          setEditingField(null);
          setEditValues({});
          toast.success("Customer information updated");
        }
      } else {
        // For other fields, check if the field value exists
        if (editValues[editingField as keyof Order["customer"]] !== undefined) {
          await onUpdateCustomer(editValues);
          setEditingField(null);
          setEditValues({});
          toast.success("Customer information updated");
        }
      }
    } catch (error) {
      // Error is already handled in onUpdateCustomer
      // Don't clear editing state on error so user can retry
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const getAddressText = () => {
    const parts = [order.customer.addressLine1, order.customer.addressLine2, order.customer.city, order.customer.postalCode].filter(
      Boolean
    );
    return parts.join(", ");
  };

  // Icon component with hover and copy states
  const CopyableIcon = ({
    field,
    defaultIcon: DefaultIcon,
    text,
    label,
  }: {
    field: string;
    defaultIcon: React.ElementType;
    text: string;
    label: string;
  }) => {
    const isHovered = hoveredField === field;
    const isCopied = copiedField === field;
    const IconComponent = DefaultIcon;

    return (
      <div className='p-1.5 rounded-full bg-primary/10 shrink-0 relative transition-all duration-200 group-hover:bg-primary/20'>
        <div className='relative w-3.5 h-3.5'>
          <IconComponent
            className={cn(
              "h-3.5 w-3.5 text-primary absolute inset-0 transition-all duration-200",
              isHovered && !isCopied && "opacity-0 scale-90",
              !isHovered && !isCopied && "opacity-100 scale-100",
              isCopied && "opacity-0 scale-90"
            )}
          />
          <Copy
            className={cn(
              "h-3.5 w-3.5 text-primary absolute inset-0 transition-all duration-200",
              isHovered && !isCopied && "opacity-100 scale-100",
              !isHovered && "opacity-0 scale-90",
              isCopied && "opacity-0 scale-90"
            )}
          />
          <Check
            className={cn(
              "h-3.5 w-3.5 text-green-600 dark:text-green-400 absolute inset-0 transition-all duration-200",
              isCopied && "opacity-100 scale-100",
              !isCopied && "opacity-0 scale-90"
            )}
          />
        </div>
      </div>
    );
  };

  const [fraudOpen, setFraudOpen] = useState(false);

  return (
    <Card className='border shadow-md overflow-hidden gap-0 !pt-0'>
      <CardHeader className='sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4 !pb-4 border-b'>
        <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
          <div className='p-1.5 bg-purple-500/10 rounded-lg'>
            <User className='h-4 w-4 text-purple-600 dark:text-purple-400' />
          </div>
          Customer Details
        </CardTitle>
      </CardHeader>
      <CardContent className='p-3 sm:p-4 space-y-2.5'>
        {/* Mobile Customer Card - Compact Action-Oriented Design */}
        <div className='sm:hidden'>
          {/* Customer Avatar & Name with Call Button */}
          <div className='flex items-center gap-3 mb-3'>
            <div className='h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md'>
              {order.customer.fullName.charAt(0).toUpperCase()}
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='font-semibold text-foreground truncate'>{order.customer.fullName}</h3>
              <p className='text-xs text-muted-foreground'>{order.customer.city || 'Customer'}</p>
            </div>
            {/* Quick Call Button */}
            <a href={`tel:${order.customer.phone}`}>
              <Button size='sm' className='h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 p-0 shadow-md'>
                <Phone className='h-4 w-4 text-white' />
              </Button>
            </a>
          </div>

          {/* Quick Info Pills */}
          <div className='flex flex-wrap gap-2 mb-3'>
            {/* Phone Pill */}
            <button
              onClick={() => handleCopy(order.customer.phone, "phone", "Phone")}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium active:scale-95 transition-transform'
            >
              <Phone className='h-3 w-3 text-muted-foreground' />
              <span className='text-foreground'>{order.customer.phone}</span>
              {copiedField === "phone" ? (
                <Check className='h-3 w-3 text-emerald-500' />
              ) : (
                <Copy className='h-3 w-3 text-muted-foreground' />
              )}
            </button>

            {/* Email Pill */}
            {order.customer.email && (
              <button
                onClick={() => handleCopy(order.customer.email!, "email", "Email")}
                className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium active:scale-95 transition-transform'
              >
                <Mail className='h-3 w-3 text-muted-foreground' />
                <span className='text-foreground truncate max-w-[120px]'>{order.customer.email}</span>
                {copiedField === "email" ? (
                  <Check className='h-3 w-3 text-emerald-500' />
                ) : (
                  <Copy className='h-3 w-3 text-muted-foreground' />
                )}
              </button>
            )}
          </div>

          {/* Address Card */}
          <button
            onClick={() => handleCopy(getAddressText(), "address", "Address")}
            className='w-full flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/50 text-left active:scale-[0.99] transition-transform'
          >
            <div className='p-1.5 rounded-lg bg-primary/10 mt-0.5'>
              <MapPin className='h-3.5 w-3.5 text-primary' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5'>Delivery Address</p>
              <p className='text-sm font-medium text-foreground leading-snug'>
                {order.customer.addressLine1}
                {order.customer.addressLine2 && `, ${order.customer.addressLine2}`}
              </p>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {order.customer.city}{order.customer.postalCode && ` - ${order.customer.postalCode}`}
              </p>
            </div>
            {copiedField === "address" ? (
              <Check className='h-4 w-4 text-emerald-500 shrink-0' />
            ) : (
              <Copy className='h-4 w-4 text-muted-foreground shrink-0' />
            )}
          </button>

          {/* Edit Button */}
          <Button
            variant='ghost'
            size='sm'
            className='w-full mt-2 h-9 text-xs text-muted-foreground'
            onClick={() => handleEdit("address")}
          >
            <Edit2 className='h-3 w-3 mr-1.5' />
            Edit Customer Details
          </Button>

          {/* Editing Modal for Mobile */}
          {editingField && (
            <div className='fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4'>
              <div className='bg-background w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom duration-300'>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='font-semibold'>Edit Customer Info</h3>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={handleCancel}>
                    <X className='h-4 w-4' />
                  </Button>
                </div>
                
                {editingField === "address" ? (
                  <div className='space-y-2'>
                    <Input
                      placeholder='Address Line 1'
                      value={editValues.addressLine1 !== undefined ? editValues.addressLine1 : order.customer.addressLine1}
                      onChange={(e) => setEditValues({ ...editValues, addressLine1: e.target.value })}
                      className='h-10'
                    />
                    <Input
                      placeholder='Address Line 2 (optional)'
                      value={editValues.addressLine2 !== undefined ? editValues.addressLine2 : order.customer.addressLine2 || ""}
                      onChange={(e) => setEditValues({ ...editValues, addressLine2: e.target.value })}
                      className='h-10'
                    />
                    <div className='flex gap-2'>
                      <Input
                        placeholder='City'
                        value={editValues.city !== undefined ? editValues.city : order.customer.city}
                        onChange={(e) => setEditValues({ ...editValues, city: e.target.value })}
                        className='h-10 flex-1'
                      />
                      <Input
                        placeholder='Postal Code'
                        value={editValues.postalCode !== undefined ? editValues.postalCode : order.customer.postalCode}
                        onChange={(e) => setEditValues({ ...editValues, postalCode: e.target.value })}
                        className='h-10 w-28'
                      />
                    </div>
                  </div>
                ) : (
                  <Input
                    placeholder={editingField === "fullName" ? "Full Name" : editingField === "phone" ? "Phone Number" : "Email"}
                    value={editValues[editingField as keyof Order["customer"]] as string || ""}
                    onChange={(e) => setEditValues({ ...editValues, [editingField]: e.target.value })}
                    className='h-10'
                    autoFocus
                  />
                )}
                
                <div className='flex gap-2 pt-2'>
                  <Button variant='outline' className='flex-1 h-10' onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button className='flex-1 h-10' onClick={handleSave}>
                    <Save className='h-4 w-4 mr-1.5' />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Customer Info - Original Design */}
        <div className='hidden sm:grid grid-cols-1 gap-2'>
          {/* Customer Name & Phone Row */}
          <div className='flex flex-col sm:flex-row gap-2'>
            <div
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 flex-1 group transition-colors",
                editingField === "fullName" ? "bg-muted/70" : "cursor-pointer hover:bg-muted/50"
              )}
              onMouseEnter={() => !editingField && setHoveredField("name")}
              onMouseLeave={() => setHoveredField(null)}
              onClick={() => !editingField && handleCopy(order.customer.fullName, "name", "Name")}
            >
              <CopyableIcon field='name' defaultIcon={User} text={order.customer.fullName} label='Name' />
              <div className='flex-1 min-w-0'>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5'>Name</p>
                {editingField === "fullName" ? (
                  <div className='flex items-center gap-1'>
                    <Input
                      value={editValues.fullName || order.customer.fullName}
                      onChange={(e) => setEditValues({ ...editValues, fullName: e.target.value })}
                      className='h-7 text-sm'
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") handleCancel();
                      }}
                    />
                    <Button size='sm' variant='ghost' className='h-7 w-7 p-0' onClick={handleSave}>
                      <Save className='h-3.5 w-3.5' />
                    </Button>
                    <Button size='sm' variant='ghost' className='h-7 w-7 p-0' onClick={handleCancel}>
                      <X className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                ) : (
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-semibold text-foreground truncate'>{order.customer.fullName}</p>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit("fullName");
                      }}
                    >
                      <Edit2 className='h-3 w-3' />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 flex-1 group transition-colors",
                editingField === "phone" ? "bg-muted/70" : "cursor-pointer hover:bg-muted/50"
              )}
              onMouseEnter={() => !editingField && setHoveredField("phone")}
              onMouseLeave={() => setHoveredField(null)}
              onClick={() => !editingField && handleCopy(order.customer.phone, "phone", "Phone")}
            >
              <CopyableIcon field='phone' defaultIcon={Phone} text={order.customer.phone} label='Phone' />
              <div className='flex-1 min-w-0'>
                <p className='text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5'>Phone</p>
                {editingField === "phone" ? (
                  <div className='flex items-center gap-1'>
                    <Input
                      value={editValues.phone || order.customer.phone}
                      onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                      className='h-7 text-sm'
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") handleCancel();
                      }}
                    />
                    <Button size='sm' variant='ghost' className='h-7 w-7 p-0' onClick={handleSave}>
                      <Save className='h-3.5 w-3.5' />
                    </Button>
                    <Button size='sm' variant='ghost' className='h-7 w-7 p-0' onClick={handleCancel}>
                      <X className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                ) : (
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-semibold text-foreground truncate'>{order.customer.phone}</p>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit("phone");
                      }}
                    >
                      <Edit2 className='h-3 w-3' />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Email */}
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 group transition-colors",
              editingField === "email" ? "bg-muted/70" : "cursor-pointer hover:bg-muted/50"
            )}
            onMouseEnter={() => !editingField && setHoveredField("email")}
            onMouseLeave={() => setHoveredField(null)}
            onClick={() => !editingField && order.customer.email && handleCopy(order.customer.email, "email", "Email")}
          >
            <CopyableIcon field='email' defaultIcon={Mail} text={order.customer.email || ""} label='Email' />
            <div className='flex-1 min-w-0'>
              <p className='text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5'>Email</p>
              {editingField === "email" ? (
                <div className='flex items-center gap-1'>
                  <Input
                    value={editValues.email !== undefined ? editValues.email : order.customer.email || ""}
                    onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    className='h-7 text-sm'
                    type='email'
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                  />
                  <Button size='sm' variant='ghost' className='h-7 w-7 p-0' onClick={handleSave}>
                    <Save className='h-3.5 w-3.5' />
                  </Button>
                  <Button size='sm' variant='ghost' className='h-7 w-7 p-0' onClick={handleCancel}>
                    <X className='h-3.5 w-3.5' />
                  </Button>
                </div>
              ) : (
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-semibold text-foreground truncate'>{order.customer.email || "No email"}</p>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit("email");
                    }}
                  >
                    <Edit2 className='h-3 w-3' />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Customer Address */}
          <div
            className={cn(
              "flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 group transition-colors",
              editingField?.startsWith("address") ? "bg-muted/70" : "cursor-pointer hover:bg-muted/50"
            )}
            onMouseEnter={() => !editingField && setHoveredField("address")}
            onMouseLeave={() => setHoveredField(null)}
            onClick={() => !editingField && handleCopy(getAddressText(), "address", "Address")}
          >
            <div className='mt-0.5'>
              <CopyableIcon field='address' defaultIcon={MapPin} text={getAddressText()} label='Address' />
            </div>
            <div className='flex-1 min-w-0 space-y-1'>
              <p className='text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5'>Address</p>
              {editingField?.startsWith("address") ? (
                <div className='space-y-1'>
                  <Input
                    placeholder='Address Line 1'
                    value={editValues.addressLine1 !== undefined ? editValues.addressLine1 : order.customer.addressLine1}
                    onChange={(e) => setEditValues({ ...editValues, addressLine1: e.target.value })}
                    className='h-7 text-sm'
                    autoFocus
                  />
                  <Input
                    placeholder='Address Line 2 (optional)'
                    value={editValues.addressLine2 !== undefined ? editValues.addressLine2 : order.customer.addressLine2 || ""}
                    onChange={(e) => setEditValues({ ...editValues, addressLine2: e.target.value })}
                    className='h-7 text-sm'
                  />
                  <div className='flex gap-1'>
                    <Input
                      placeholder='City'
                      value={editValues.city !== undefined ? editValues.city : order.customer.city}
                      onChange={(e) => setEditValues({ ...editValues, city: e.target.value })}
                      className='h-7 text-sm flex-1'
                    />
                    <Input
                      placeholder='Postal Code'
                      value={editValues.postalCode !== undefined ? editValues.postalCode : order.customer.postalCode}
                      onChange={(e) => setEditValues({ ...editValues, postalCode: e.target.value })}
                      className='h-7 text-sm w-24'
                    />
                  </div>
                  <div className='flex items-center gap-1 pt-1'>
                    <Button size='sm' variant='ghost' className='h-7 px-2 text-xs' onClick={handleSave}>
                      <Save className='h-3.5 w-3.5 mr-1' />
                      Save
                    </Button>
                    <Button size='sm' variant='ghost' className='h-7 px-2 text-xs' onClick={handleCancel}>
                      <X className='h-3.5 w-3.5 mr-1' />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='flex items-start justify-between'>
                  <p className='text-sm font-semibold text-foreground leading-snug'>
                    {order.customer.addressLine1}
                    {order.customer.addressLine2 && `, ${order.customer.addressLine2}`}
                    {order.customer.city && `, ${order.customer.city}`}
                    {order.customer.postalCode && ` ${order.customer.postalCode}`}
                  </p>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit("address");
                    }}
                  >
                    <Edit2 className='h-3 w-3' />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className='my-3' />

        {/* Fraud Detection Section - Collapsible on Mobile */}
        <Collapsible open={fraudOpen} onOpenChange={setFraudOpen} className='sm:!block'>
          <div className='bg-white dark:bg-card rounded-lg border border-blue-200/50 dark:border-blue-800/50 overflow-hidden'>
            {/* Header - Always visible */}
            <CollapsibleTrigger className='w-full sm:cursor-default' asChild>
              <div className='flex items-center justify-between p-3'>
                <div className='flex items-center gap-1.5'>
                  <div className='p-1 bg-blue-500/10 rounded-lg'>
                    <Shield className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <Label className='text-xs sm:text-sm font-bold'>Fraud Risk</Label>
                  {/* Mobile: Show badge inline when collapsed */}
                  {fraudData && !loadingFraud && (
                    <span className='sm:hidden ml-1'>
                      {getRiskBadge(fraudData.fraud_risk)}
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-1.5'>
                  {fraudData && !loadingFraud && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation();
                        onCheckFraud(true);
                      }}
                      disabled={loadingFraud || savingFraud}
                      className='h-7 px-2 text-xs hidden sm:flex'
                    >
                      {loadingFraud || savingFraud ? (
                        <>
                          <Spinner className='h-3 w-3 mr-1' />
                          {savingFraud ? "Saving" : "Checking"}
                        </>
                      ) : (
                        <>
                          <FolderSync className='h-3 w-3 mr-1' />
                          Recheck
                        </>
                      )}
                    </Button>
                  )}
                  {/* Mobile: Chevron indicator */}
                  <ChevronDown className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform sm:hidden',
                    fraudOpen && 'rotate-180'
                  )} />
                </div>
              </div>
            </CollapsibleTrigger>

            {/* Content - Collapsible on mobile, always shown on desktop */}
            <CollapsibleContent className='sm:!block'>
              <div className='px-3 pb-3'>
                {loadingFraud && (
                  <div className='flex items-center justify-center py-4'>
                    <Spinner className='h-4 w-4 mr-2 text-blue-600' />
                    <span className='text-xs sm:text-sm font-medium text-muted-foreground'>Checking fraud risk...</span>
                  </div>
                )}

                {fraudError && (
                  <Alert variant='destructive' className='border-2'>
                    <AlertTriangle className='h-4 w-4' />
                    <AlertDescription className='text-xs font-medium'>{fraudError}</AlertDescription>
                  </Alert>
                )}

                {fraudData && !loadingFraud && (
                  <div className='space-y-3'>
                    <div className='hidden sm:flex items-center justify-between'>
                      <Label className='text-xs sm:text-sm font-bold'>Risk Level</Label>
                      {getRiskBadge(fraudData.fraud_risk)}
                    </div>

                    {/* Mobile: Compact Stats Row */}
                    <div className='sm:hidden grid grid-cols-4 gap-2 text-center'>
                      <div className='p-2 bg-muted/50 rounded-lg'>
                        <p className='text-lg font-bold'>{fraudData.success_rate}%</p>
                        <p className='text-[9px] text-muted-foreground'>Success</p>
                      </div>
                      <div className='p-2 bg-muted/50 rounded-lg'>
                        <p className='text-lg font-bold'>{fraudData.total_parcels}</p>
                        <p className='text-[9px] text-muted-foreground'>Total</p>
                      </div>
                      <div className='p-2 bg-green-50 dark:bg-green-950/30 rounded-lg'>
                        <p className='text-lg font-bold text-green-600'>{fraudData.successful_deliveries}</p>
                        <p className='text-[9px] text-muted-foreground'>Success</p>
                      </div>
                      <div className='p-2 bg-red-50 dark:bg-red-950/30 rounded-lg'>
                        <p className='text-lg font-bold text-red-600'>{fraudData.failed_deliveries}</p>
                        <p className='text-[9px] text-muted-foreground'>Failed</p>
                      </div>
                    </div>

                    {/* Mobile: Progress Bar */}
                    <div className='sm:hidden space-y-1'>
                      <div className='relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                        <div
                          className={`h-full transition-all duration-500 ${
                            fraudData.success_rate >= 90 ? "bg-green-500" : fraudData.success_rate >= 70 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${fraudData.success_rate}%` }}
                        />
                      </div>
                    </div>

                    {/* Desktop: Radial Progress Chart */}
                    <div className='hidden sm:flex relative w-full items-center justify-center py-1'>
                      <div className='relative w-28 h-28 sm:w-32 sm:h-32'>
                        <svg className='w-full h-full transform -rotate-90' viewBox='0 0 200 200'>
                          <circle
                            cx='100'
                            cy='100'
                            r='80'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='20'
                            className='text-gray-200 dark:text-gray-700'
                          />
                          <circle
                            cx='100'
                            cy='100'
                            r='80'
                            fill='none'
                            stroke={fraudData.success_rate >= 90 ? "#22c55e" : fraudData.success_rate >= 70 ? "#eab308" : "#ef4444"}
                            strokeWidth='20'
                            strokeDasharray={`${(fraudData.success_rate / 100) * 502.65} 502.65`}
                            strokeLinecap='round'
                            className='transition-all duration-1000 ease-out'
                          />
                        </svg>
                        <div className='absolute inset-0 flex flex-col items-center justify-center'>
                          <div className='text-lg sm:text-xl font-bold'>{fraudData.success_rate}%</div>
                          <div className='text-[10px] md:text-xs text-muted-foreground'>Success</div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: Fraud Stats */}
                    <div className='hidden sm:grid grid-cols-3 gap-1.5 text-xs'>
                      <div className='text-center p-1.5 bg-muted/50 rounded'>
                        <p className='text-[10px] text-muted-foreground mb-0.5'>Total</p>
                        <p className='font-bold text-sm sm:text-base'>{fraudData.total_parcels}</p>
                      </div>
                      <div className='text-center p-1.5 bg-green-50 dark:bg-green-950/30 rounded'>
                        <p className='text-[10px] text-muted-foreground mb-0.5'>Success</p>
                        <p className='font-bold text-sm sm:text-base text-green-600'>{fraudData.successful_deliveries}</p>
                      </div>
                      <div className='text-center p-1.5 bg-red-50 dark:bg-red-950/30 rounded'>
                        <p className='text-[10px] text-muted-foreground mb-0.5'>Failed</p>
                        <p className='font-bold text-sm sm:text-base text-red-600'>{fraudData.failed_deliveries}</p>
                      </div>
                    </div>

                    {/* Desktop: Success Rate Progress Bar */}
                    <div className='hidden sm:block space-y-1'>
                      <div className='flex items-center justify-between text-[10px] md:text-xs'>
                        <span className='text-muted-foreground'>Success Rate</span>
                        <span className='font-medium'>{fraudData.success_rate}%</span>
                      </div>
                      <div className='relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                        <div
                          className={`h-full transition-all duration-500 ${
                            fraudData.success_rate >= 90 ? "bg-green-500" : fraudData.success_rate >= 70 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${fraudData.success_rate}%` }}
                        />
                      </div>
                    </div>

                    {/* Courier History - Shown on both mobile and desktop */}
                    {fraudData.courier_history && fraudData.courier_history.length > 0 && (
                      <>
                        {/* Mobile: Compact Courier Cards */}
                        <div className='sm:hidden space-y-2'>
                          <Label className='text-xs font-medium text-muted-foreground flex items-center gap-1.5'>
                            <Truck className='h-3 w-3' />
                            Courier Breakdown
                          </Label>
                          <div className='grid gap-2'>
                            {fraudData.courier_history.map((courier, index) => {
                              const successRate = courier.success_rate ?? (courier.total > 0 ? Math.round((courier.successful / courier.total) * 100) : 0);
                              const risk = calculateRiskLevel(successRate);
                              return (
                                <div key={index} className='flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/50'>
                                  {/* Courier Icon/Logo */}
                                  <div className='h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                                    {courier.logo ? (
                                      <img src={courier.logo} alt={courier.courier} className='w-6 h-6 object-contain rounded-full' />
                                    ) : (
                                      <Truck className='h-4 w-4 text-primary' />
                                    )}
                                  </div>
                                  {/* Courier Info */}
                                  <div className='flex-1 min-w-0'>
                                    <div className='flex items-center justify-between gap-1'>
                                      <p className='text-xs font-semibold text-foreground truncate'>{courier.courier}</p>
                                      <span className={cn(
                                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                        risk === 'low' ? 'bg-green-100 text-green-700' :
                                        risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                      )}>
                                        {successRate}%
                                      </span>
                                    </div>
                                    <div className='flex items-center gap-2 mt-0.5'>
                                      <span className='text-[10px] text-muted-foreground'>{courier.total} orders</span>
                                      <span className='text-[10px] text-green-600'>✓ {courier.successful}</span>
                                      <span className='text-[10px] text-red-600'>✗ {courier.failed}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Desktop: Full Courier History */}
                        <div className='hidden sm:block space-y-1.5'>
                          <Label className='text-[10px] md:text-xs font-medium text-muted-foreground'>Courier History</Label>
                          <div className='space-y-1.5 max-h-36 overflow-y-auto'>
                            {fraudData.courier_history.map((courier, index) => (
                              <CourierHistoryItem key={index} courier={courier} />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Last Delivery & Checked At */}
                    {(fraudData.last_delivery || fraudData.checkedAt) && (
                      <div className='space-y-1 pt-2 border-t'>
                        {fraudData.checkedAt && (
                          <div className='flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            <span>Checked: {formatFraudDate(fraudData.checkedAt)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mobile: Recheck Button */}
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onCheckFraud(true)}
                      disabled={loadingFraud || savingFraud}
                      className='w-full h-9 text-xs sm:hidden'
                    >
                      {loadingFraud || savingFraud ? (
                        <>
                          <Spinner className='h-3 w-3 mr-1' />
                          {savingFraud ? "Saving..." : "Checking..."}
                        </>
                      ) : (
                        <>
                          <FolderSync className='h-3 w-3 mr-1' />
                          Recheck Fraud Status
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!fraudData && !loadingFraud && !fraudError && order.customer?.phone && (
                  <div className='text-center py-4 text-xs sm:text-sm text-muted-foreground'>
                    <Shield className='h-8 w-8 mx-auto mb-2 opacity-50' />
                    <p className='font-medium mb-2'>No fraud data</p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onCheckFraud(false)}
                      disabled={loadingFraud || savingFraud}
                      className='h-7 px-2 text-xs'
                    >
                      {loadingFraud || savingFraud ? (
                        <>
                          <Spinner className='h-3 w-3 mr-1' />
                          {savingFraud ? "Saving" : "Checking"}
                        </>
                      ) : (
                        <>
                          <Shield className='h-3 w-3 mr-1' />
                          Check Now
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        <Separator className='my-3' />

        <div className='space-y-1.5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Label className='text-xs sm:text-sm font-semibold'>Mark as Fraud</Label>
              {blockingCustomer && <Spinner className='h-3 w-3' />}
            </div>
            <Switch
              checked={isCustomerBlocked}
              onCheckedChange={onToggleFraudBlock}
              disabled={blockingCustomer || !order.customer?.phone}
              className='data-[state=checked]:bg-red-500'
            />
          </div>
          {isCustomerBlocked ? (
            <p className='text-[10px] md:text-xs text-red-600 font-medium'>⚠️ This customer is blocked and cannot place new orders.</p>
          ) : (
            <p className='text-[10px] md:text-xs text-muted-foreground'>Flagging prevents future orders from this customer.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
