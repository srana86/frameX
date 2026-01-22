"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/utils/cn";
import {
  CheckCircle2,
  Loader2,
  Rocket,
  X,
  ExternalLink,
  Copy,
  Server,
  Globe,
  ArrowRight,
  User,
  Building2,
  Clock,
  Play,
  Terminal,
  PartyPopper,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";

interface SimulationStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  message?: string;
  data?: any;
  color: string;
  phase: "setup" | "provision" | "deploy";
}

interface CheckoutSession {
  tranId: string;
  planId: string;
  planName: string;
  planPrice: number;
  billingCycle: string;
  billingCycleMonths?: number;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  customSubdomain: string;
  status: string;
}

function StepIcon({ step, index }: { step: SimulationStep; index: number }) {
  const baseClasses = "relative flex items-center justify-center transition-all duration-500";

  if (step.status === "completed") {
    return (
      <div className={`${baseClasses} h-10 w-10`}>
        <div className='absolute inset-0 rounded-full bg-green-500 animate-[ping_1s_ease-out_1]' />
        <div className='relative flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30'>
          <CheckCircle2 className='h-5 w-5 text-white' />
        </div>
      </div>
    );
  }

  if (step.status === "running") {
    return (
      <div className={`${baseClasses} h-10 w-10`}>
        <div className='absolute inset-0 rounded-full bg-blue-500/30 animate-ping' />
        <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ${step.color} shadow-lg`}>
          <Loader2 className='h-5 w-5 text-white animate-spin' />
        </div>
      </div>
    );
  }

  if (step.status === "error") {
    return (
      <div className={`${baseClasses} h-10 w-10`}>
        <div className='relative flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30'>
          <X className='h-5 w-5 text-white' />
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} h-10 w-10`}>
      <div className='relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 border-2 border-dashed border-gray-300'>
        <span className='text-sm font-bold text-gray-400'>{index + 1}</span>
      </div>
    </div>
  );
}

function StepConnector({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) {
  return (
    <div className='relative h-6 w-0.5 mx-auto overflow-hidden'>
      <div
        className={`absolute inset-0 transition-all duration-500 ${isCompleted ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-gray-200"
          }`}
      />
      {isActive && <div className='absolute inset-0 bg-blue-500 animate-pulse' />}
    </div>
  );
}

function SuccessContainerInner() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get("tran_id");

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol(DEFAULT_CURRENCY));

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const initializeSteps = (): SimulationStep[] => [
    { id: "1", name: "Verify Payment", description: "Confirming transaction", status: "pending", color: "bg-blue-500", phase: "setup" },
    { id: "2", name: "Create Tenant", description: "Register tenant account", status: "pending", color: "bg-cyan-500", phase: "setup" },
    { id: "3", name: "Create Subscription", description: "Activate billing", status: "pending", color: "bg-teal-500", phase: "setup" },
    {
      id: "4",
      name: "Provision Database",
      description: "Create MongoDB instance",
      status: "pending",
      color: "bg-violet-500",
      phase: "provision",
    },
    {
      id: "5",
      name: "Initialize Schema",
      description: "Create collections",
      status: "pending",
      color: "bg-purple-500",
      phase: "provision",
    },
    { id: "6", name: "Create Indexes", description: "Optimize queries", status: "pending", color: "bg-fuchsia-500", phase: "provision" },
    { id: "7", name: "Deploy Store", description: "Live deployment", status: "pending", color: "bg-orange-500", phase: "deploy" },
    { id: "8", name: "Configure", description: "Set up environment", status: "pending", color: "bg-amber-500", phase: "deploy" },
    { id: "9", name: "Complete", description: "Ready to go!", status: "pending", color: "bg-green-500", phase: "deploy" },
  ];

  useGSAP(
    () => {
      if (!sectionRef.current || !headerRef.current) return;
      gsap.fromTo(headerRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
    },
    { scope: sectionRef }
  );

  // Load session data and settings
  useEffect(() => {
    if (!tranId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Fetch session and settings in parallel
        const [sessionRes, settingsRes] = await Promise.all([
          fetch(`/api/checkout/session?tran_id=${tranId}`),
          fetch("/api/settings/general"),
        ]);

        if (sessionRes.ok) {
          const data = await sessionRes.json();
          setSession(data);
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.defaultCurrency) {
            setCurrencySymbol(getCurrencySymbol(settings.defaultCurrency));
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    setSteps(initializeSteps());
  }, [tranId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simulationStarted && !simulationComplete) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [simulationStarted, simulationComplete]);

  const updateStep = (stepId: string, status: SimulationStep["status"], message?: string, data?: any) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status, message, data } : step)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const runSimulation = async () => {
    if (!session) return;

    setSimulationStarted(true);
    setElapsedTime(0);
    setSteps(initializeSteps());

    try {
      // Step 1: Verify Payment
      updateStep("1", "running", "Verifying payment...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateStep("1", "completed", `Payment verified: ${session.planName} Plan`);

      // Step 2: Create Tenant
      updateStep("2", "running", "Creating tenant record...");
      const tenantId = `tenant_${Date.now()}`;
      const tenantResponse = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tenantId,
          name: session.tenantName,
          email: session.tenantEmail,
          phone: session.tenantPhone,
          status: "trial",
          settings: { brandName: session.tenantName, currency: "USD", timezone: "UTC" },
        }),
      });
      if (!tenantResponse.ok) {
        const error = await tenantResponse.json();
        throw new Error(error.error || "Failed to create tenant");
      }
      updateStep("2", "completed", `Tenant: ${session.tenantName}`, { tenantId });

      // Step 3: Create Subscription
      updateStep("3", "running", "Activating subscription...");
      const subscriptionId = `sub_${Date.now()}`;
      const plansRes = await fetch("/api/plans");
      const plans = await plansRes.json();
      const selectedPlan = plans.find((p: any) => p.id === session.planId) || plans[0];

      // Calculate billing period based on billing cycle (1, 3, 6, or 12 months)
      const billingCycleMonths = session.billingCycleMonths || Number(session.billingCycle) || 1;
      const periodStart = new Date();
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + billingCycleMonths);

      // Calculate grace period (7 days after subscription ends)
      const gracePeriodEnd = new Date(periodEnd);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

      // Check if this is an upgrade (existing subscription)
      const isUpgrade = new URLSearchParams(window.location.search).get("upgrade") === "true";

      const subscriptionResponse = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subscriptionId,
          tenantId,
          planId: selectedPlan?.id || session.planId,
          planName: selectedPlan?.name || session.planName,
          status: "active",
          billingCycleMonths,
          billingCycle:
            billingCycleMonths === 1
              ? "monthly"
              : billingCycleMonths === 3
                ? "quarterly"
                : billingCycleMonths === 6
                  ? "semi_annual"
                  : "yearly",
          amount: session.planPrice,
          currency: "BDT",
          currentPeriodStart: periodStart.toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
          gracePeriodEndsAt: gracePeriodEnd.toISOString(),
          nextBillingDate: periodEnd.toISOString(),
          lastPaymentDate: periodStart.toISOString(),
          totalPaid: session.planPrice,
          autoRenew: true,
          cancelAtPeriodEnd: false,
        }),
      });
      if (!subscriptionResponse.ok) {
        const error = await subscriptionResponse.json();
        throw new Error(error.error || "Failed to create subscription");
      }

      const subscriptionData = await subscriptionResponse.json();
      const actualSubscriptionId = subscriptionData.id || subscriptionId;

      // Record the sale for tracking
      try {
        await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            tenantName: session.tenantName,
            tenantEmail: session.tenantEmail,
            subscriptionId: actualSubscriptionId,
            planId: selectedPlan?.id || session.planId,
            planName: selectedPlan?.name || session.planName,
            amount: session.planPrice,
            currency: "BDT",
            billingCycleMonths,
            paymentMethod: "sslcommerz",
            transactionId: session.tranId,
            status: "completed",
            type: isUpgrade ? "upgrade" : "new",
            metadata: {
              checkoutSessionId: session.tranId,
              billingCycle:
                billingCycleMonths === 1
                  ? "monthly"
                  : billingCycleMonths === 3
                    ? "quarterly"
                    : billingCycleMonths === 6
                      ? "semi_annual"
                      : "yearly",
            },
          }),
        });
        console.log(`[checkout] Sale recorded for ${tenantId}`);
      } catch (saleError) {
        console.error("[checkout] Failed to record sale:", saleError);
        // Don't fail the whole process for sale tracking error
      }

      const cycleLabel =
        billingCycleMonths === 1
          ? "Monthly"
          : billingCycleMonths === 3
            ? "3 Months"
            : billingCycleMonths === 6
              ? "6 Months"
              : "Yearly";
      updateStep("3", "completed", `${cycleLabel} subscription active`, { subscriptionId: actualSubscriptionId });

      // Step 4: Create Database
      updateStep("4", "running", "Creating MongoDB database...");
      const dbResponse = await fetch("/api/simulate/create-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        throw new Error(errorData.error || "Failed to create database");
      }
      const dbData = await dbResponse.json();
      updateStep("4", "completed", `Database: ${dbData.databaseName}`, dbData);

      // Step 5: Initialize Collections
      updateStep("5", "running", "Initializing collections...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStep("5", "completed", `Created ${dbData.collections || 10} collections`);

      // Step 6: Create Indexes
      updateStep("6", "running", "Creating indexes...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStep("6", "completed", "Indexes created");

      // Step 7: Deploy
      updateStep("7", "running", "Deploying store...");
      const deployResponse = await fetch("/api/simulate/create-deployment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          tenantName: session.tenantName,
          tenantEmail: session.tenantEmail,
          databaseName: dbData.databaseName,
          customSubdomain: session.customSubdomain || undefined,
        }),
      });
      if (!deployResponse.ok) {
        const error = await deployResponse.json();
        throw new Error(error.error || "Failed to create deployment");
      }
      const deployData = await deployResponse.json();
      updateStep("7", "completed", "Deployment ready", deployData);

      // Step 8: Configure
      updateStep("8", "running", "Configuring environment...");
      await new Promise((resolve) => setTimeout(resolve, 400));
      updateStep("8", "completed", "Environment configured");

      // Step 9: Complete
      updateStep("9", "running", "Finalizing...");
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep("9", "completed", "Setup complete!");

      // Set final result
      setSimulationResult({
        tenantId,
        subscriptionId,
        databaseName: dbData.databaseName,
        deploymentUrl: deployData.deployment?.url || deployData.deployment?.vercelUrl || "localhost:3000",
        tenantUser: deployData.tenantUser,
        plan: { name: session.planName, price: session.planPrice },
        status: "active",
      });

      setSimulationComplete(true);
      toast.success("Your store is ready!");
    } catch (error: any) {
      console.error("Simulation error:", error);
      toast.error(error.message || "Setup failed");
      const failedStep = steps.find((s) => s.status === "running");
      if (failedStep) {
        updateStep(failedStep.id, "error", error.message);
      }
      setSimulationComplete(true);
    }
  };

  const getCompletedSteps = () => steps.filter((s) => s.status === "completed").length;
  const getProgress = () => (getCompletedSteps() / steps.length) * 100;

  if (loading) {
    return (
      <section className='min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-blue-50/30 to-white'>
        <div className='text-center'>
          <Loader2 className='w-10 h-10 animate-spin text-blue-500 mx-auto mb-4' />
          <p className='text-gray-600'>Loading your order...</p>
        </div>
      </section>
    );
  }

  if (!tranId || !session) {
    return (
      <section className='min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-blue-50/30 to-white'>
        <div className='text-center max-w-md mx-auto px-4'>
          <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4'>
            <X className='w-8 h-8 text-red-500' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Session Not Found</h1>
          <p className='text-gray-600 mb-6'>We couldn't find your checkout session. Please try again.</p>
          <Link
            href='/#pricing'
            className='inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors'
          >
            Back to Pricing
            <ArrowRight className='w-4 h-4' />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className='min-h-screen py-24 sm:py-28 md:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6'>
        {/* Success Header */}
        {!simulationStarted && (
          <div ref={headerRef} className='text-center mb-12'>
            <div className='relative inline-flex mb-6'>
              <div className='absolute inset-0 rounded-full bg-green-500 blur-2xl opacity-30 animate-pulse' />
              <div className='relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30'>
                <PartyPopper className='w-10 h-10 text-white' />
              </div>
            </div>
            <h1
              className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4'
              style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}
            >
              Payment Successful! 🎉
            </h1>
            <p className='text-lg text-gray-600 max-w-xl mx-auto mb-8' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
              Thank you for choosing FrameX! Click the button below to set up your store.
            </p>

            {/* Order Summary */}
            <div className='max-w-md mx-auto bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8'>
              <div className='flex items-center justify-between mb-4 pb-4 border-b border-gray-100'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center'>
                    <Building2 className='w-5 h-5 text-white' />
                  </div>
                  <div className='text-left'>
                    <p className='font-semibold text-gray-900'>{session.tenantName}</p>
                    <p className='text-sm text-gray-500'>{session.tenantEmail}</p>
                  </div>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-500'>Plan</p>
                  <p className='font-semibold text-gray-900'>{session.planName}</p>
                </div>
                <div className='text-right'>
                  <p className='text-sm text-gray-500'>Amount</p>
                  <p className='text-xl font-bold text-green-600'>
                    {currencySymbol}
                    {session.planPrice}
                  </p>
                </div>
              </div>
            </div>

            {/* Start Setup Button */}
            <button
              onClick={runSimulation}
              className='inline-flex items-center gap-3 px-8 py-4 bg-[#0448FD] text-white rounded-2xl font-semibold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all group'
              style={{
                fontFamily: "var(--font-urbanist), sans-serif",
                boxShadow: `
                  0px 1px 1px 0px rgba(4, 72, 253, 0.18),
                  0px 2px 2.8px 0px rgba(4, 72, 253, 0.44),
                  0px 5px 12.8px 0px rgba(4, 72, 253, 0.49),
                  0px -5px 11.1px 0px rgba(255, 255, 255, 0.52) inset
                `,
              }}
            >
              <Play className='w-5 h-5' />
              Set Up My Store
              <ArrowRight className='w-5 h-5 transition-transform group-hover:translate-x-1' />
            </button>
          </div>
        )}

        {/* Simulation Progress */}
        {simulationStarted && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Left: Steps */}
            <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center'>
                    <Terminal className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                      Setup Progress
                    </h3>
                    <p className='text-sm text-gray-500'>
                      {getCompletedSteps()} of {steps.length} steps complete
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Clock className='w-4 h-4 text-gray-400' />
                  <span className='font-mono text-sm text-gray-600'>{formatTime(elapsedTime)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className='h-2 w-full rounded-full bg-gray-100 mb-6 overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out rounded-full'
                  style={{ width: `${getProgress()}%` }}
                />
              </div>

              {/* Steps List */}
              <div className='space-y-0'>
                {steps.map((step, index) => (
                  <div key={step.id}>
                    <div className='flex items-start gap-3 py-2'>
                      <StepIcon step={step} index={index} />
                      <div className='flex-1 pt-2'>
                        <div className='flex items-center justify-between'>
                          <h4
                            className={cn(
                              "font-medium transition-colors",
                              step.status === "completed"
                                ? "text-green-600"
                                : step.status === "running"
                                  ? "text-blue-600"
                                  : step.status === "error"
                                    ? "text-red-600"
                                    : "text-gray-400"
                            )}
                          >
                            {step.name}
                          </h4>
                        </div>
                        <p className='text-sm text-gray-500'>{step.message || step.description}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <StepConnector
                        isActive={step.status === "running" || steps[index + 1]?.status === "running"}
                        isCompleted={step.status === "completed"}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Results */}
            <div className='space-y-6'>
              {simulationComplete && simulationResult ? (
                <>
                  {/* Success Card */}
                  <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200'>
                    <div className='flex items-center gap-4'>
                      <div className='w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30'>
                        <CheckCircle2 className='w-7 h-7 text-white' />
                      </div>
                      <div>
                        <h3 className='text-xl font-bold text-green-700'>Store Ready!</h3>
                        <p className='text-green-600'>Your store has been deployed successfully</p>
                      </div>
                    </div>
                  </div>

                  {/* Store URL */}
                  {simulationResult.deploymentUrl && (
                    <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100'>
                      <div className='flex items-center gap-3 mb-4'>
                        <Globe className='w-5 h-5 text-blue-500' />
                        <h4 className='font-semibold text-gray-900'>Your Store URL</h4>
                      </div>
                      <a
                        href={`https://${simulationResult.deploymentUrl}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors group'
                      >
                        <span className='font-mono text-blue-600 truncate'>{simulationResult.deploymentUrl}</span>
                        <ExternalLink className='w-5 h-5 text-blue-500 flex-shrink-0 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
                      </a>
                    </div>
                  )}

                  {/* Credentials */}
                  {simulationResult.tenantUser && (
                    <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100'>
                      <div className='flex items-center gap-3 mb-4'>
                        <User className='w-5 h-5 text-violet-500' />
                        <h4 className='font-semibold text-gray-900'>Login Credentials</h4>
                      </div>
                      <div className='space-y-3'>
                        <div>
                          <p className='text-xs text-gray-500 mb-1'>Email</p>
                          <div className='flex items-center gap-2'>
                            <code className='flex-1 px-4 py-2.5 rounded-lg bg-gray-50 border text-sm font-mono'>
                              {simulationResult.tenantUser.email}
                            </code>
                            <button
                              onClick={() => copyToClipboard(simulationResult.tenantUser.email, "email")}
                              className='p-2.5 rounded-lg border hover:bg-gray-50 transition-colors'
                            >
                              {copiedField === "email" ? (
                                <CheckCircle2 className='w-4 h-4 text-green-500' />
                              ) : (
                                <Copy className='w-4 h-4 text-gray-500' />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className='text-xs text-gray-500 mb-1'>Password</p>
                          <div className='flex items-center gap-2'>
                            <code className='flex-1 px-4 py-2.5 rounded-lg bg-gray-50 border text-sm font-mono'>
                              {simulationResult.tenantUser.password}
                            </code>
                            <button
                              onClick={() => copyToClipboard(simulationResult.tenantUser.password, "password")}
                              className='p-2.5 rounded-lg border hover:bg-gray-50 transition-colors'
                            >
                              {copiedField === "password" ? (
                                <CheckCircle2 className='w-4 h-4 text-green-500' />
                              ) : (
                                <Copy className='w-4 h-4 text-gray-500' />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      {simulationResult.deploymentUrl && (
                        <a
                          href={`https://${simulationResult.deploymentUrl}/login`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:underline'
                        >
                          Open Login Page <ArrowRight className='w-4 h-4' />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Resources */}
                  <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100'>
                    <div className='flex items-center gap-3 mb-4'>
                      <Server className='w-5 h-5 text-purple-500' />
                      <h4 className='font-semibold text-gray-900'>Resources Created</h4>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='p-3 rounded-xl bg-gray-50'>
                        <p className='text-xs text-gray-500 mb-1'>Tenant ID</p>
                        <p className='font-mono text-xs truncate'>{simulationResult.tenantId}</p>
                      </div>
                      <div className='p-3 rounded-xl bg-gray-50'>
                        <p className='text-xs text-gray-500 mb-1'>Database</p>
                        <p className='font-mono text-xs truncate'>{simulationResult.databaseName}</p>
                      </div>
                      <div className='p-3 rounded-xl bg-gray-50'>
                        <p className='text-xs text-gray-500 mb-1'>Plan</p>
                        <p className='font-semibold text-sm'>{simulationResult.plan?.name}</p>
                      </div>
                      <div className='p-3 rounded-xl bg-gray-50'>
                        <p className='text-xs text-gray-500 mb-1'>Status</p>
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className='bg-white rounded-2xl p-12 shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center'>
                  <div className='relative mb-6'>
                    <div className='absolute inset-0 rounded-full bg-violet-500 blur-2xl opacity-20' />
                    <div className='relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center'>
                      <Rocket className='w-10 h-10 text-gray-400' />
                    </div>
                  </div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>Setting Up Your Store</h3>
                  <p className='text-gray-500'>Please wait while we configure everything for you...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function SuccessContainer() {
  return (
    <Suspense
      fallback={
        <section className='min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-blue-50/30 to-white'>
          <div className='text-center'>
            <Loader2 className='w-10 h-10 animate-spin text-blue-500 mx-auto mb-4' />
            <p className='text-gray-600'>Loading...</p>
          </div>
        </section>
      }
    >
      <SuccessContainerInner />
    </Suspense>
  );
}
