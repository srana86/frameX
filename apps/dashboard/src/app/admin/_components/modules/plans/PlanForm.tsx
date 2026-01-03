"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, X, CheckCircle2, Sparkles, Calendar, Eye } from "lucide-react";
import { useCurrency } from "@/contexts/SettingsContext";

export interface SimplePlan {
  id?: string;
  name: string;
  description?: string;
  price: number; // Total price for the billing cycle
  billingCycleMonths: 1 | 6 | 12; // 1 = monthly, 6 = 6 months, 12 = yearly
  featuresList: string[];
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "gradient";
  iconType?: "star" | "grid" | "sparkles"; // Icon to show on pricing page
}

interface PlanFormProps {
  plan: SimplePlan;
  onChange: (plan: SimplePlan) => void;
  onSave: () => void;
  onCancel?: () => void;
  mode: "create" | "edit";
  saving?: boolean;
}

export function PlanForm({ plan, onChange, onSave, onCancel, mode, saving = false }: PlanFormProps) {
  const { formatAmount, currencySymbol } = useCurrency();
  const [newFeature, setNewFeature] = useState("");

  const addFeature = () => {
    if (!newFeature.trim()) return;
    const currentList = plan.featuresList || [];
    if (!currentList.includes(newFeature.trim())) {
      onChange({
        ...plan,
        featuresList: [...currentList, newFeature.trim()],
      });
    }
    setNewFeature("");
  };

  const removeFeature = (feature: string) => {
    onChange({
      ...plan,
      featuresList: (plan.featuresList || []).filter((f) => f !== feature),
    });
  };

  const moveFeature = (index: number, direction: "up" | "down") => {
    const list = [...(plan.featuresList || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;
    [list[index], list[newIndex]] = [list[newIndex], list[index]];
    onChange({ ...plan, featuresList: list });
  };

  // Calculate monthly equivalent for display
  const monthlyEquivalent = plan.price / (plan.billingCycleMonths || 1);

  const getBillingLabel = () => {
    switch (plan.billingCycleMonths) {
      case 1:
        return "Monthly";
      case 6:
        return "6 Months";
      case 12:
        return "Yearly";
      default:
        return "Monthly";
    }
  };

  return (
    <div className='space-y-6'>
      {/* Basic Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5' />
            Plan Information
          </CardTitle>
          <CardDescription>Set the plan name, price, and billing cycle</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='plan-name'>Plan Name *</Label>
              <Input
                id='plan-name'
                value={plan.name}
                onChange={(e) => onChange({ ...plan, name: e.target.value })}
                placeholder='e.g., Starter Monthly, Professional Yearly'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='plan-cycle'>Billing Cycle *</Label>
              <Select
                value={String(plan.billingCycleMonths || 1)}
                onValueChange={(v) => onChange({ ...plan, billingCycleMonths: Number(v) as 1 | 6 | 12 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select billing cycle' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>Monthly (1 month)</SelectItem>
                  <SelectItem value='6'>Semi-Annual (6 months)</SelectItem>
                  <SelectItem value='12'>Yearly (12 months)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='plan-price'>Total Price (USD) *</Label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='plan-price'
                  type='number'
                  value={plan.price}
                  onChange={(e) => onChange({ ...plan, price: Number(e.target.value) })}
                  placeholder='29'
                  min='0'
                  step='0.01'
                  className='pl-9'
                />
              </div>
              <p className='text-xs text-muted-foreground'>This is the total amount charged for {getBillingLabel().toLowerCase()}</p>
            </div>
            <div className='space-y-2'>
              <Label>Monthly Equivalent</Label>
              <div className='p-3 rounded-lg bg-muted/50 border'>
                <span className='text-2xl font-bold'>${monthlyEquivalent.toFixed(2)}</span>
                <span className='text-muted-foreground text-sm ml-1'>/month</span>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='plan-description'>Description</Label>
            <Textarea
              id='plan-description'
              value={plan.description || ""}
              onChange={(e) => onChange({ ...plan, description: e.target.value })}
              placeholder='Perfect for small businesses getting started'
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Eye className='h-5 w-5' />
            Display Settings
          </CardTitle>
          <CardDescription>How this plan appears on the pricing page</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='plan-sort'>Sort Order</Label>
              <Input
                id='plan-sort'
                type='number'
                value={plan.sortOrder || 0}
                onChange={(e) => onChange({ ...plan, sortOrder: Number(e.target.value) })}
                placeholder='0'
              />
              <p className='text-xs text-muted-foreground'>Lower numbers appear first</p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='plan-icon'>Icon Type</Label>
              <Select
                value={plan.iconType || "star"}
                onValueChange={(v) => onChange({ ...plan, iconType: v as "star" | "grid" | "sparkles" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='star'>⭐ Star</SelectItem>
                  <SelectItem value='grid'>📊 Grid</SelectItem>
                  <SelectItem value='sparkles'>✨ Sparkles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='button-variant'>Button Style</Label>
              <Select
                value={plan.buttonVariant || "outline"}
                onValueChange={(v) => onChange({ ...plan, buttonVariant: v as "default" | "outline" | "gradient" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='outline'>Outline (Light)</SelectItem>
                  <SelectItem value='gradient'>Gradient (Dark)</SelectItem>
                  <SelectItem value='default'>Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='button-text'>Button Text</Label>
            <Input
              id='button-text'
              value={plan.buttonText || ""}
              onChange={(e) => onChange({ ...plan, buttonText: e.target.value })}
              placeholder='Get Started'
            />
          </div>

          <div className='flex flex-wrap gap-6 pt-2'>
            <div className='flex items-center gap-3'>
              <Switch checked={plan.isActive} onCheckedChange={(checked) => onChange({ ...plan, isActive: checked })} />
              <Label>Active (visible to users)</Label>
            </div>
            <div className='flex items-center gap-3'>
              <Switch checked={plan.isPopular || false} onCheckedChange={(checked) => onChange({ ...plan, isPopular: checked })} />
              <Label>Featured / Most Popular</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Preview
          </CardTitle>
          <CardDescription>How this plan will look on the pricing page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='max-w-sm mx-auto p-6 rounded-xl border-2 bg-white shadow-lg relative'>
            {plan.isPopular && (
              <div className='absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full'>
                Most Popular
              </div>
            )}
            <div className='text-center space-y-4'>
              <h3 className='text-xl font-bold'>{plan.name || "Plan Name"}</h3>
              <p className='text-sm text-muted-foreground'>{plan.description || "Plan description"}</p>
              <div>
                <span className='text-4xl font-bold'>{formatAmount(plan.price || 0)}</span>
                <span className='text-muted-foreground'>/{getBillingLabel().toLowerCase()}</span>
              </div>
              <p className='text-sm text-green-600'>${monthlyEquivalent.toFixed(2)}/month</p>
              <button
                className={`w-full py-3 px-4 rounded-full font-medium ${
                  plan.buttonVariant === "gradient" ? "bg-gray-900 text-white" : "bg-blue-50 text-gray-900 border border-gray-200"
                }`}
              >
                {plan.buttonText || "Get Started"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle2 className='h-5 w-5' />
            Features List
          </CardTitle>
          <CardDescription>Features shown on the pricing page</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder='e.g., Unlimited products, Custom domain, Priority support'
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
              className='flex-1'
            />
            <Button onClick={addFeature} type='button'>
              <Plus className='h-4 w-4 mr-1' />
              Add
            </Button>
          </div>

          {(plan.featuresList || []).length > 0 ? (
            <div className='space-y-2'>
              {(plan.featuresList || []).map((feature, idx) => (
                <div
                  key={idx}
                  className='flex items-center gap-2 p-3 rounded-lg border bg-muted/30 group hover:bg-muted/50 transition-colors'
                >
                  <CheckCircle2 className='h-4 w-4 text-green-500 shrink-0' />
                  <span className='flex-1'>{feature}</span>
                  <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <Button variant='ghost' size='sm' className='h-7 w-7 p-0' onClick={() => moveFeature(idx, "up")} disabled={idx === 0}>
                      ↑
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-7 w-7 p-0'
                      onClick={() => moveFeature(idx, "down")}
                      disabled={idx === (plan.featuresList?.length || 0) - 1}
                    >
                      ↓
                    </Button>
                    <Button variant='ghost' size='sm' className='h-7 w-7 p-0 text-destructive' onClick={() => removeFeature(feature)}>
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg'>
              <CheckCircle2 className='h-8 w-8 mx-auto mb-2 opacity-50' />
              <p>No features added yet</p>
              <p className='text-sm'>Add features that describe what&apos;s included in this plan</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className='flex justify-end gap-3 pt-4 border-t'>
        {onCancel && (
          <Button variant='outline' onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button onClick={onSave} disabled={saving} size='lg'>
          {saving ? "Saving..." : mode === "create" ? "Create Plan" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
