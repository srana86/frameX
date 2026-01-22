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
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Zap,
  Package,
  ShoppingCart,
  HardDrive,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface SubscriptionData {
  plan: string;
  status: string;
  features: string[];
  limits: {
    products: number;
    orders: number;
    storage: string;
  };
  usage: {
    products: number;
    orders: number;
    storage: string;
  };
  billingCycle: string | null;
  nextBillingDate: string | null;
  price: number;
}

interface SubscriptionClientProps {
  initialData: SubscriptionData;
  storeId: string;
  permission: StaffPermission | null;
}

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "Up to 10 products",
      "Up to 100 orders/month",
      "100MB storage",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "STARTER",
    name: "Starter",
    price: 29,
    description: "For growing businesses",
    features: [
      "Up to 100 products",
      "Up to 1,000 orders/month",
      "1GB storage",
      "Advanced analytics",
      "Priority email support",
      "Custom domain",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 79,
    description: "For established stores",
    features: [
      "Unlimited products",
      "Unlimited orders",
      "10GB storage",
      "Full analytics suite",
      "24/7 phone support",
      "Custom domain",
      "API access",
      "Affiliate program",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 199,
    description: "For large operations",
    features: [
      "Everything in Pro",
      "100GB storage",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "White-label options",
    ],
  },
];

/**
 * Subscription Client Component
 */
export function SubscriptionClient({
  initialData,
  storeId,
  permission,
}: SubscriptionClientProps) {
  const [data, setData] = useState<SubscriptionData>(initialData);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Permission check
  const canEdit = permission === null || permission === "FULL";

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Parse storage value
  const parseStorage = (value: string): number => {
    const match = value.match(/^(\d+(?:\.\d+)?)(MB|GB|TB)$/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "GB") return num * 1024;
    if (unit === "TB") return num * 1024 * 1024;
    return num; // MB
  };

  // Calculate usage percentages
  const productUsage = (data.usage.products / data.limits.products) * 100;
  const orderUsage = (data.usage.orders / data.limits.orders) * 100;
  const storageUsage =
    (parseStorage(data.usage.storage) / parseStorage(data.limits.storage)) * 100;

  // Upgrade plan
  const upgradePlan = async (planId: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to change subscription");
      return;
    }

    setUpgrading(planId);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.post("subscription/upgrade", { plan: planId });
      setData({ ...data, ...(result as any) });
      toast.success("Plan upgraded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade plan");
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlanIndex = PLANS.findIndex((p) => p.id === data.plan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your store subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card className="border-primary/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Current Plan: {data.plan}
              </CardTitle>
              <CardDescription>
                {data.billingCycle
                  ? `Billed ${data.billingCycle.toLowerCase()}`
                  : "Free tier - No billing"}
              </CardDescription>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                data.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              )}
            >
              {data.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Products
                </span>
                <span>
                  {data.usage.products} / {data.limits.products}
                </span>
              </div>
              <Progress
                value={Math.min(productUsage, 100)}
                className={cn(productUsage > 80 && "bg-red-100")}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  Orders (this month)
                </span>
                <span>
                  {data.usage.orders} / {data.limits.orders}
                </span>
              </div>
              <Progress
                value={Math.min(orderUsage, 100)}
                className={cn(orderUsage > 80 && "bg-red-100")}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Storage
                </span>
                <span>
                  {data.usage.storage} / {data.limits.storage}
                </span>
              </div>
              <Progress
                value={Math.min(storageUsage, 100)}
                className={cn(storageUsage > 80 && "bg-red-100")}
              />
            </div>
          </div>

          {/* Billing Info */}
          {data.nextBillingDate && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Next billing date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(data.nextBillingDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${data.price}</p>
                  <p className="text-sm text-muted-foreground">
                    per {data.billingCycle?.toLowerCase() || "month"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, index) => {
            const isCurrent = plan.id === data.plan;
            const isUpgrade = index > currentPlanIndex;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative",
                  isCurrent && "border-primary ring-2 ring-primary/20"
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}
                <CardHeader className="pt-6">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : isUpgrade ? "default" : "secondary"}
                    disabled={isCurrent || !canEdit || !!upgrading}
                    onClick={() => upgradePlan(plan.id)}
                  >
                    {upgrading === plan.id ? (
                      "Processing..."
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : isUpgrade ? (
                      <>
                        Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      "Downgrade"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      {data.plan !== "FREE" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-16 rounded border bg-muted flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled={!canEdit}>
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
