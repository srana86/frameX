"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, CreditCard, Calendar, Loader2 } from "lucide-react";
import type { MerchantSubscription, SubscriptionPlan } from "@/lib/subscription-types";
import { Separator } from "@/components/ui/separator";

// Helper to get billing cycle label
function getBillingCycleLabel(months: number | undefined): string {
  if (!months) return "Monthly";
  switch (months) {
    case 1:
      return "Monthly";
    case 6:
      return "6 Months";
    case 12:
      return "Yearly";
    default:
      return `${months} Months`;
  }
}

// Helper to get billing cycle badge color
function getBillingCycleBadgeClass(months: number | undefined): string {
  if (!months || months === 1) return "bg-blue-100 text-blue-700";
  if (months === 6) return "bg-purple-100 text-purple-700";
  return "bg-green-100 text-green-700";
}

interface SubscriptionClientProps {
  currentSubscription: MerchantSubscription | null;
  currentPlan: SubscriptionPlan | null;
  availablePlans: SubscriptionPlan[];
}

// Super-admin URL for checkout
const SUPER_ADMIN_URL = process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "https://framextech.com";

export function SubscriptionClient({ currentSubscription, currentPlan, availablePlans }: SubscriptionClientProps) {
  const [loading, setLoading] = useState(false);

  // Navigate to super-admin checkout page
  const handleSubscribe = (planId: string) => {
    const plan = availablePlans.find((p) => p.id === planId);
    const billingCycleMonths = (plan as any)?.billingCycleMonths || 1;

    // Build checkout URL with plan and billing info
    const checkoutUrl = `${SUPER_ADMIN_URL}/checkout?plan=${planId}&cycle=${billingCycleMonths}&upgrade=true`;

    // Redirect to super-admin checkout
    window.location.href = checkoutUrl;
  };

  // Handle renewal payment
  const handleRenew = async () => {
    if (!currentSubscription) return;

    setLoading(true);
    try {
      const res = await fetch("/api/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to initiate renewal");
      }

      const data = await res.json();

      if (data.GatewayPageURL) {
        // Redirect to payment gateway
        window.location.href = data.GatewayPageURL;
      } else if (data.demoMode) {
        toast.success("Demo mode: Subscription renewed!");
        window.location.reload();
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to renew subscription");
    } finally {
      setLoading(false);
    }
  };

  if (!currentSubscription) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>Choose a plan to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              {availablePlans.map((plan) => {
                const billingMonths = (plan as any).billingCycleMonths || 1;
                const planPrice = (plan as any).price || (plan as any).basePrice || plan.price || 0;
                const monthlyEquivalent = planPrice / billingMonths;

                return (
                  <Card key={plan.id} className={plan.isPopular ? "border-primary" : ""}>
                    <CardHeader>
                      <div className='flex items-center justify-between flex-wrap gap-2'>
                        <CardTitle>{plan.name}</CardTitle>
                        <div className='flex gap-1'>
                          {plan.isPopular && <Badge>Popular</Badge>}
                          <Badge className={getBillingCycleBadgeClass(billingMonths)}>
                            <Calendar className='h-3 w-3 mr-1' />
                            {getBillingCycleLabel(billingMonths)}
                          </Badge>
                        </div>
                      </div>
                      <div className='mt-2'>
                        <span className='text-3xl font-bold'>৳{planPrice}</span>
                        <span className='text-muted-foreground'>/{getBillingCycleLabel(billingMonths).toLowerCase()}</span>
                      </div>
                      {billingMonths > 1 && <p className='text-sm text-green-600 font-medium'>৳{monthlyEquivalent.toFixed(0)}/month</p>}
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <ul className='space-y-2 text-sm'>
                        {/* Use featuresList if available, fallback to features object */}
                        {(plan as any).featuresList?.length > 0 ? (
                          (plan as any).featuresList.slice(0, 4).map((feature: string, idx: number) => (
                            <li key={idx} className='flex items-center gap-2'>
                              <Check className='h-4 w-4 text-primary' />
                              <span>{feature}</span>
                            </li>
                          ))
                        ) : plan.features ? (
                          <>
                            <li className='flex items-center gap-2'>
                              <Check className='h-4 w-4 text-primary' />
                              <span>{plan.features.max_products === "unlimited" ? "Unlimited" : plan.features.max_products} Products</span>
                            </li>
                            <li className='flex items-center gap-2'>
                              <Check className='h-4 w-4 text-primary' />
                              <span>
                                {plan.features.max_storage_gb === "unlimited" ? "Unlimited" : plan.features.max_storage_gb}GB Storage
                              </span>
                            </li>
                            <li className='flex items-center gap-2'>
                              <Check className='h-4 w-4 text-primary' />
                              <span>{plan.features.custom_domain ? "Custom Domain" : "Subdomain Only"}</span>
                            </li>
                            <li className='flex items-center gap-2'>
                              <Check className='h-4 w-4 text-primary' />
                              <span>{plan.features.support_level} Support</span>
                            </li>
                          </>
                        ) : (
                          <li className='text-muted-foreground'>No features listed</li>
                        )}
                      </ul>
                      <Button className='w-full' onClick={() => handleSubscribe(plan.id)} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className='mr-2 h-4 w-4' />
                            Subscribe
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            <Badge variant={currentSubscription.status === "active" ? "default" : "secondary"}>{currentSubscription.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {currentPlan ? (
            <>
              <div>
                <h3 className='text-2xl font-bold'>{currentPlan.name}</h3>
                <p className='text-muted-foreground'>{currentPlan.description}</p>
              </div>
              <Separator />
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <div>
                  <p className='text-sm text-muted-foreground'>Billing Cycle</p>
                  <p className='font-medium'>
                    {currentSubscription.billingCycleMonths === 1
                      ? "Monthly"
                      : currentSubscription.billingCycleMonths === 6
                      ? "6 Months"
                      : "Yearly"}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Current Period</p>
                  <p className='font-medium'>
                    {new Date(currentSubscription.currentPeriodStart).toLocaleDateString()} -{" "}
                    {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Amount</p>
                  <p className='font-medium'>৳{currentSubscription.amount || (currentPlan as any).basePrice || currentPlan.price}</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Days Remaining</p>
                  <p className='font-medium'>
                    {Math.max(
                      0,
                      Math.ceil((new Date(currentSubscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    )}{" "}
                    days
                  </p>
                </div>
              </div>
              {/* Features List */}
              {(currentPlan as any).featuresList?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className='text-sm text-muted-foreground mb-2'>Plan Features</p>
                    <ul className='grid gap-1 md:grid-cols-2 text-sm'>
                      {(currentPlan as any).featuresList.map((feature: string, idx: number) => (
                        <li key={idx} className='flex items-center gap-2'>
                          <Check className='h-4 w-4 text-green-500' />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className='text-center py-4'>
              <p className='text-muted-foreground'>Subscription: {currentSubscription.planId}</p>
              <p className='text-sm text-muted-foreground mt-1'>
                Expires: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {availablePlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Upgrade or change your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              {availablePlans.map((plan) => {
                const isCurrent = plan.id === currentPlan?.id || plan.id === currentSubscription?.planId;
                const billingMonths = (plan as any).billingCycleMonths || 1;
                const planPrice = (plan as any).price || (plan as any).basePrice || plan.price || 0;
                const monthlyEquivalent = planPrice / billingMonths;

                return (
                  <Card key={plan.id} className={`${plan.isPopular ? "border-primary" : ""} ${isCurrent ? "ring-2 ring-primary/50" : ""}`}>
                    <CardHeader>
                      <div className='flex items-center justify-between flex-wrap gap-2'>
                        <CardTitle className='text-lg'>{plan.name}</CardTitle>
                        <div className='flex gap-1 flex-wrap'>
                          {plan.isPopular && <Badge>Popular</Badge>}
                          {isCurrent && <Badge variant='secondary'>Current</Badge>}
                          <Badge className={getBillingCycleBadgeClass(billingMonths)}>
                            <Calendar className='h-3 w-3 mr-1' />
                            {getBillingCycleLabel(billingMonths)}
                          </Badge>
                        </div>
                      </div>
                      <div className='mt-2'>
                        <span className='text-2xl font-bold'>৳{planPrice}</span>
                        <span className='text-muted-foreground text-sm'>/{getBillingCycleLabel(billingMonths).toLowerCase()}</span>
                      </div>
                      {billingMonths > 1 && <p className='text-xs text-green-600 font-medium'>৳{monthlyEquivalent.toFixed(0)}/month</p>}
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant={isCurrent ? "outline" : "default"}
                        className='w-full'
                        disabled={isCurrent || loading}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {isCurrent ? "Current Plan" : "Switch Plan"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
