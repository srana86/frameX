"use client";

import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Clock, CreditCard, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionStatusDetails, SubscriptionInvoice, TenantSubscription, SubscriptionPlan } from "@/lib/subscription-types";
import { apiRequest } from "@/lib/api-client";

interface SubscriptionBannerProps {
  className?: string;
}

interface SubscriptionData {
  subscription: TenantSubscription | null;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatusDetails;
  pendingInvoice: SubscriptionInvoice | null;
  debug?: {
    merchantId: string | null;
    hasSubscription: boolean;
    hasPlan: boolean;
  };
}

export function SubscriptionBanner({ className }: SubscriptionBannerProps) {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const result = await apiRequest<SubscriptionData>("/subscription/status", { method: "GET" });
      if (result) {
        console.log("[SubscriptionBanner] Received data:", result);
        setData(result);
      }
    } catch (error: any) {
      console.error("Failed to fetch subscription status:", error);
      setError(error.message || "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (dismissed) return null;

  // Show error state if no data
  if (!data || error) {
    return null; // Silently fail if no data
  }

  const { subscription, plan, status, pendingInvoice } = data;

  // If no subscription at all, show "no subscription" message
  if (!subscription) {
    // Optionally show a "no subscription" banner - uncomment if needed
    // return (
    //   <div className={cn("relative w-full border-b px-4 py-3 bg-gray-50 border-gray-200", className)}>
    //     <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-2">
    //       <AlertTriangle className="w-4 h-4 text-gray-500" />
    //       <span className="text-sm text-gray-600">No subscription assigned. Contact support.</span>
    //     </div>
    //   </div>
    // );
    return null;
  }

  // Don't show banner if subscription is active with more than 7 days remaining
  if (status.isActive && !status.showRenewalNotice && !status.showUrgentNotice) {
    return null;
  }

  // Determine banner type and content
  let bannerType: "warning" | "urgent" | "expired" | "grace" = "warning";
  let title = "";
  let message = "";
  let actionText = "";
  let bgColor = "";
  let borderColor = "";
  let textColor = "";
  let icon = <Clock className='w-5 h-5' />;

  if (status.isExpired) {
    bannerType = "expired";
    title = "Subscription Expired";
    message = "Your subscription has expired. Please renew to continue using all features.";
    actionText = "Renew Now";
    bgColor = "bg-red-50";
    borderColor = "border-red-200";
    textColor = "text-red-800";
    icon = <AlertTriangle className='w-5 h-5 text-red-600' />;
  } else if (status.isGracePeriod) {
    bannerType = "grace";
    title = "Grace Period Active";
    message = `Your subscription has ended. You have ${status.graceDaysRemaining} day${status.graceDaysRemaining !== 1 ? "s" : ""
      } left in your grace period. Renew now to avoid service interruption.`;
    actionText = "Pay Invoice";
    bgColor = "bg-orange-50";
    borderColor = "border-orange-200";
    textColor = "text-orange-800";
    icon = <AlertTriangle className='w-5 h-5 text-orange-600' />;
  } else if (status.showUrgentNotice) {
    bannerType = "urgent";
    title = "Subscription Expiring Soon";
    message = `Your subscription expires in ${status.daysRemaining} day${status.daysRemaining !== 1 ? "s" : ""
      }. Renew now to avoid any interruption.`;
    actionText = "Renew Now";
    bgColor = "bg-amber-50";
    borderColor = "border-amber-200";
    textColor = "text-amber-800";
    icon = <Clock className='w-5 h-5 text-amber-600' />;
  } else if (status.showRenewalNotice) {
    bannerType = "warning";
    title = "Subscription Renewal";
    message = `Your subscription will renew in ${status.daysRemaining} days. Make sure your payment method is up to date.`;
    actionText = "View Billing";
    bgColor = "bg-blue-50";
    borderColor = "border-blue-200";
    textColor = "text-blue-800";
    icon = <CreditCard className='w-5 h-5 text-blue-600' />;
  } else {
    return null;
  }

  const handleAction = () => {
    if (status.requiresPayment) {
      setShowPaymentModal(true);
    } else {
      window.location.href = "/merchant/billing";
    }
  };

  return (
    <>
      {/* Main Banner */}
      <div className={cn("relative w-full border-b px-4 py-3", bgColor, borderColor, className)}>
        <div className='max-w-[1440px] mx-auto flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            {icon}
            <div>
              <h4 className={cn("font-semibold text-sm", textColor)}>{title}</h4>
              <p className={cn("text-sm opacity-90", textColor)}>{message}</p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={handleAction}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                bannerType === "expired" || bannerType === "grace"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : bannerType === "urgent"
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {actionText}
            </button>
            {bannerType === "warning" && (
              <button onClick={() => setDismissed(true)} className={cn("p-1 rounded-full hover:bg-white/50 transition-colors", textColor)}>
                <X className='w-5 h-5' />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          subscription={subscription}
          plan={plan}
          invoice={pendingInvoice}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            fetchSubscriptionStatus();
          }}
        />
      )}
    </>
  );
}

// Payment Modal Component
interface PaymentModalProps {
  subscription: TenantSubscription | null;
  plan: SubscriptionPlan | null;
  invoice: SubscriptionInvoice | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default SubscriptionBanner;

function PaymentModal({ subscription, plan, invoice, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "Dhaka",
    customerState: "Dhaka",
    customerPostcode: "1000",
    customerCountry: "Bangladesh",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest<any>("/subscription/renew", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: invoice?.id,
          planId: plan?.id || "premium", // Assuming plan.id is available or a default
          ...formData,
        }),
      });

      if (data.GatewayPageURL) {
        window.location.href = data.GatewayPageURL;
      } else if (data.demoMode) {
        // Demo mode - simulate success
        alert("Demo Mode: Payment would be processed here. Subscription renewed!");
        onPaymentSuccess();
      } else {
        throw new Error(data.error || "Payment initialization failed");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center'>
              <FileText className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900'>Pay Invoice</h3>
              <p className='text-sm text-gray-500'>Renew your subscription</p>
            </div>
          </div>
          <button onClick={onClose} className='p-2 rounded-lg hover:bg-gray-100 transition-colors'>
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Invoice Summary */}
        {invoice && (
          <div className='px-6 py-4 bg-gray-50 border-b'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm text-gray-600'>Invoice #{invoice.invoiceNumber}</span>
              <span
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  invoice.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                )}
              >
                {invoice.status === "overdue" ? "Overdue" : "Due"}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-semibold text-gray-900'>{plan?.name || invoice.planName} Plan</p>
                <p className='text-sm text-gray-500'>
                  {subscription?.billingCycleMonths || 1} month{(subscription?.billingCycleMonths || 1) > 1 ? "s" : ""} subscription
                </p>
              </div>
              <div className='text-right'>
                <p className='text-2xl font-bold text-gray-900'>${invoice.amount}</p>
                <p className='text-xs text-gray-500'>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Full Name</label>
              <input
                type='text'
                name='customerName'
                value={formData.customerName}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='John Doe'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
              <input
                type='email'
                name='customerEmail'
                value={formData.customerEmail}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='john@example.com'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Phone</label>
              <input
                type='tel'
                name='customerPhone'
                value={formData.customerPhone}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='+880 1XXX-XXXXXX'
              />
            </div>
            <div className='col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Address</label>
              <input
                type='text'
                name='customerAddress'
                value={formData.customerAddress}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                placeholder='123 Main Street'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>City</label>
              <input
                type='text'
                name='customerCity'
                value={formData.customerCity}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Country</label>
              <select
                name='customerCountry'
                value={formData.customerCountry}
                onChange={handleInputChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='Bangladesh'>Bangladesh</option>
                <option value='India'>India</option>
                <option value='Pakistan'>Pakistan</option>
                <option value='Other'>Other</option>
              </select>
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            {loading ? (
              <>
                <Loader2 className='w-5 h-5 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className='w-5 h-5' />
                Pay ${invoice?.amount || subscription?.amount || 0}
              </>
            )}
          </button>

          <p className='text-xs text-gray-500 text-center'>Secured by SSLCommerz - 256-bit SSL encryption</p>
        </form>
      </div>
    </div>
  );
}
