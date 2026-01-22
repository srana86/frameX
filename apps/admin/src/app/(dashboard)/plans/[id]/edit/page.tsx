"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PlanForm,
  type SimplePlan,
} from "@/app/_components/modules/plans/PlanForm";
import Link from "next/link";
import { api } from "@/lib/api-client";

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  const [plan, setPlan] = useState<SimplePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPlan = async () => {
      if (!planId) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get<any>(`plans/${planId}`);

        if (!data || !data.id) {
          throw new Error("Plan data is invalid");
        }

        // Map the API response to SimplePlan
        setPlan({
          id: data.id,
          name: data.name || "",
          description: data.description || "",
          price: data.price ?? data.basePrice ?? 0,
          billingCycleMonths: data.billingCycleMonths || 1,
          featuresList: data.featuresList || data.features || [],
          isActive: data.isActive !== false,
          isPopular: data.isPopular || false,
          sortOrder: data.sortOrder || 0,
          buttonText: data.buttonText || "Get Started",
          buttonVariant: data.buttonVariant || "outline",
          iconType: data.iconType || "star",
        });
      } catch (error: any) {
        console.error("Failed to load plan:", error);
        toast.error(error.message || "Failed to load plan");
        setTimeout(() => router.push("/plans"), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [planId, router]);

  const handleSave = async () => {
    if (!plan) return;
    if (!plan.name) {
      toast.error("Plan name is required");
      return;
    }
    if (plan.price < 0) {
      toast.error("Price cannot be negative");
      return;
    }

    setSaving(true);
    try {
      await api.put(`plans/${planId}`, plan);
      toast.success("Plan updated successfully!");
      router.push("/plans");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/plans");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Plan not found</p>
        <Link href="/plans">
          <Button className="mt-4">Back to Plans</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/plans">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Edit Plan: {plan.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Update pricing, billing cycle, and features
        </p>
      </div>

      <PlanForm
        plan={plan}
        onChange={(updatedPlan) => setPlan(updatedPlan)}
        onSave={handleSave}
        onCancel={handleCancel}
        mode="edit"
        saving={saving}
      />
    </div>
  );
}
