"use client";

import { useState, useEffect } from "react";
import { SubscriptionClient } from "./SubscriptionClient";
import type { TenantSubscription, SubscriptionPlan } from "@/lib/subscription-types";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api-client";

interface SubscriptionData {
  subscription: TenantSubscription | null;
  plan: SubscriptionPlan | null;
  status: any;
  pendingInvoice: any;
  debug?: {
    tenantId: string | null;
    hasSubscription: boolean;
    hasPlan: boolean;
  };
}

export function SubscriptionPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch subscription status and available plans in parallel
      const [statusData, plansData] = await Promise.all([
        apiRequest<SubscriptionData>("GET", "/subscription/status").catch(() => null),
        apiRequest<SubscriptionPlan[]>("GET", "/subscription/plans").catch(() => [])
      ]);

      if (statusData) {
        console.log("[SubscriptionPageClient] Status data:", statusData);
        setData(statusData);
      }

      if (plansData) {
        console.log("[SubscriptionPageClient] Plans data:", plansData);
        setAvailablePlans(plansData);
      }
    } catch (err: any) {
      console.error("[SubscriptionPageClient] Error:", err);
      setError(err.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <p className='text-destructive'>{error}</p>
        <button onClick={fetchData} className='mt-4 text-primary underline'>
          Try again
        </button>
      </div>
    );
  }

  return (
    <SubscriptionClient currentSubscription={data?.subscription || null} currentPlan={data?.plan || null} availablePlans={availablePlans} />
  );
}
