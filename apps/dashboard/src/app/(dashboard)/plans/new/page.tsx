"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PlanForm, type SimplePlan } from "@/app/(dashboard)/_components/modules/plans/PlanForm";
import Link from "next/link";

export default function NewPlanPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<SimplePlan>({
    name: "",
    description: "",
    price: 0,
    billingCycleMonths: 1,
    featuresList: [],
    isActive: true,
    isPopular: false,
    sortOrder: 0,
    buttonText: "Get Started",
    buttonVariant: "outline",
    iconType: "star",
  });

  const handleSave = async () => {
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
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create plan");
      }

      toast.success("Plan created successfully!");
      router.push("/plans");
    } catch (error: any) {
      toast.error(error.message || "Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/plans");
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/plans">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Plan</h1>
        <p className="text-muted-foreground mt-2">
          Create a subscription plan with its own pricing and billing cycle (monthly, 6-month, or yearly)
        </p>
      </div>

      <PlanForm
        plan={plan}
        onChange={(updatedPlan) => setPlan(updatedPlan)}
        onSave={handleSave}
        onCancel={handleCancel}
        mode="create"
        saving={saving}
      />
    </div>
  );
}
