"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Loader2,
  Rocket,
  Database,
  CreditCard,
  X,
  ExternalLink,
  Copy,
  CheckCircle,
  Sparkles,
  Server,
  Globe,
  Settings,
  Zap,
  ArrowRight,
  User,
  Building2,
  Layers,
  HardDrive,
  AlertTriangle,
  Info,
  Play,
  RefreshCw,
  ChevronRight,
  Terminal,
  Shield,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/SettingsContext";

interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface SimulationStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "running" | "completed" | "error";
  message?: string;
  data?: any;
  color: string;
  phase: "setup" | "provision" | "deploy";
}

// Step icon component with animations
function StepIcon({ step, index }: { step: SimulationStep; index: number }) {
  const baseClasses = "relative flex items-center justify-center transition-all duration-500";

  if (step.status === "completed") {
    return (
      <div className={`${baseClasses} h-12 w-12`}>
        <div className='absolute inset-0 rounded-full bg-green-500 animate-[ping_1s_ease-out_1]' />
        <div className='relative flex h-12 w-12 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30'>
          <CheckCircle2 className='h-6 w-6 text-white' />
        </div>
      </div>
    );
  }

  if (step.status === "running") {
    return (
      <div className={`${baseClasses} h-12 w-12`}>
        <div className='absolute inset-0 rounded-full bg-primary/30 animate-ping' />
        <div className={`relative flex h-12 w-12 items-center justify-center rounded-full ${step.color} shadow-lg`}>
          <Loader2 className='h-6 w-6 text-white animate-spin' />
        </div>
      </div>
    );
  }

  if (step.status === "error") {
    return (
      <div className={`${baseClasses} h-12 w-12`}>
        <div className='relative flex h-12 w-12 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30'>
          <X className='h-6 w-6 text-white' />
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} h-12 w-12`}>
      <div className='relative flex h-12 w-12 items-center justify-center rounded-full bg-muted/80 border-2 border-dashed border-muted-foreground/30'>
        <span className='text-lg font-bold text-muted-foreground/50'>{index + 1}</span>
      </div>
    </div>
  );
}

// Connection line between steps
function StepConnector({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) {
  return (
    <div className='relative h-8 w-0.5 mx-auto overflow-hidden'>
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          isCompleted ? "bg-green-500" : isActive ? "bg-primary" : "bg-muted-foreground/20"
        }`}
      />
      {isActive && <div className='absolute inset-0 bg-primary animate-pulse' />}
    </div>
  );
}

// Phase header component
function PhaseHeader({ phase, isActive, isCompleted }: { phase: string; isActive: boolean; isCompleted: boolean }) {
  const phaseConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    setup: { label: "Setup", icon: <Settings className='h-4 w-4' />, color: "from-blue-500 to-cyan-500" },
    provision: { label: "Provision", icon: <Database className='h-4 w-4' />, color: "from-violet-500 to-purple-500" },
    deploy: { label: "Deploy", icon: <Rocket className='h-4 w-4' />, color: "from-orange-500 to-red-500" },
  };

  const config = phaseConfig[phase];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
        isCompleted
          ? "bg-green-500/10 text-green-600"
          : isActive
          ? `bg-linear-to-r ${config.color} text-white shadow-lg`
          : "bg-muted text-muted-foreground"
      }`}
    >
      {config.icon}
      {config.label}
      {isCompleted && <CheckCircle2 className='h-3 w-3 ml-1' />}
    </div>
  );
}

export default function SimulatePage() {
  const { formatAmount } = useCurrency();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [merchantName, setMerchantName] = useState<string>("Test Merchant");
  const [merchantEmail, setMerchantEmail] = useState<string>("merchant@example.com");
  const [customSubdomain, setCustomSubdomain] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Initialize steps with icons, descriptions, and phases
  const initializeSteps = (): SimulationStep[] => [
    {
      id: "1",
      name: "Select Plan",
      description: "Choose subscription tier",
      icon: <Layers className='h-5 w-5' />,
      status: "pending",
      color: "bg-blue-500",
      phase: "setup",
    },
    {
      id: "2",
      name: "Create Merchant",
      description: "Register merchant account",
      icon: <Building2 className='h-5 w-5' />,
      status: "pending",
      color: "bg-cyan-500",
      phase: "setup",
    },
    {
      id: "3",
      name: "Create Subscription",
      description: "Activate billing",
      icon: <CreditCard className='h-5 w-5' />,
      status: "pending",
      color: "bg-teal-500",
      phase: "setup",
    },
    {
      id: "4",
      name: "Provision Database",
      description: "Create MongoDB instance",
      icon: <Database className='h-5 w-5' />,
      status: "pending",
      color: "bg-violet-500",
      phase: "provision",
    },
    {
      id: "5",
      name: "Initialize Schema",
      description: "Create collections",
      icon: <HardDrive className='h-5 w-5' />,
      status: "pending",
      color: "bg-purple-500",
      phase: "provision",
    },
    {
      id: "6",
      name: "Create Indexes",
      description: "Optimize queries",
      icon: <Zap className='h-5 w-5' />,
      status: "pending",
      color: "bg-fuchsia-500",
      phase: "provision",
    },
    {
      id: "7",
      name: "Deploy to Vercel",
      description: "Live deployment",
      icon: <Rocket className='h-5 w-5' />,
      status: "pending",
      color: "bg-orange-500",
      phase: "deploy",
    },
    {
      id: "8",
      name: "Configure Environment",
      description: "Set up variables",
      icon: <Settings className='h-5 w-5' />,
      status: "pending",
      color: "bg-amber-500",
      phase: "deploy",
    },
    {
      id: "9",
      name: "Finalize",
      description: "Complete setup",
      icon: <CheckCircle2 className='h-5 w-5' />,
      status: "pending",
      color: "bg-green-500",
      phase: "deploy",
    },
  ];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading, startTime]);

  // Load plans
  useEffect(() => {
    loadPlans();
    setSteps(initializeSteps());
  }, []);

  // Prevent navigation during deployment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDeploying) {
        e.preventDefault();
        e.returnValue = "Deployment is in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDeploying]);

  // Poll deployment status
  useEffect(() => {
    if (!deploymentId || !isDeploying) return;
    let pollInterval: NodeJS.Timeout;
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/simulate/deployment-status?deploymentId=${deploymentId}`);
        if (res.ok) {
          const data = await res.json();
          const status = data.status.toUpperCase();
          setDeploymentStatus(status);
          updateStep("7", "running", `Deployment status: ${status}...`, { status, url: data.url, deploymentId });
          if (status === "READY") {
            setIsDeploying(false);
            setLoading(false);
            updateStep("7", "completed", `Deployment ready: ${data.url}`, {
              deploymentUrl: data.url,
              vercelUrl: data.url,
              status: "active",
            });
            setSimulationResult((prev: any) => ({ ...prev, deploymentUrl: data.url, vercelUrl: data.url, status: "active" }));
            toast.success("Deployment completed successfully!");
          } else if (status === "ERROR" || status === "CANCELED") {
            setIsDeploying(false);
            setLoading(false);
            updateStep("7", "error", `Deployment failed: ${status}`);
            toast.error(`Deployment failed with status: ${status}`);
          }
        }
      } catch (error) {
        console.error("Error polling deployment status:", error);
      }
    };
    pollStatus();
    pollInterval = setInterval(pollStatus, 5000);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [deploymentId, isDeploying]);

  const loadPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.filter((p: any) => p.isActive));
      }
    } catch (error) {
      console.error("Failed to load plans:", error);
    }
  };

  const updateStep = (stepId: string, status: SimulationStep["status"], message?: string, data?: any) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status, message, data } : step)));
  };

  const getCompletedSteps = () => steps.filter((s) => s.status === "completed").length;
  const getProgress = () => (getCompletedSteps() / steps.length) * 100;
  const getCurrentPhase = () => {
    const runningStep = steps.find((s) => s.status === "running");
    return runningStep?.phase || null;
  };

  const phaseStatus = useMemo(() => {
    const phases = ["setup", "provision", "deploy"];
    return phases.reduce((acc, phase) => {
      const phaseSteps = steps.filter((s) => s.phase === phase);
      const completed = phaseSteps.every((s) => s.status === "completed");
      const active = phaseSteps.some((s) => s.status === "running");
      acc[phase] = { completed, active };
      return acc;
    }, {} as Record<string, { completed: boolean; active: boolean }>);
  }, [steps]);

  const simulateFlow = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a plan");
      return;
    }

    setLoading(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsDeploying(false);
    setDeploymentId(null);
    setDeploymentStatus("");
    setSteps(initializeSteps());
    setSimulationResult(null);

    try {
      // Step 1: Select Plan
      updateStep("1", "running", "Plan selected");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const selectedPlan = plans.find((p) => p.id === selectedPlanId);
      updateStep("1", "completed", `Plan: ${selectedPlan?.name} (${formatAmount(selectedPlan?.price || 0)}/month)`);

      // Step 2: Create Merchant
      updateStep("2", "running", "Creating merchant record...");
      const merchantId = `merchant_${Date.now()}`;
      const merchantResponse = await fetch("/api/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: merchantId,
          name: merchantName,
          email: merchantEmail,
          status: "trial",
          settings: { brandName: merchantName, currency: "USD", timezone: "UTC" },
        }),
      });
      if (!merchantResponse.ok) {
        const error = await merchantResponse.json();
        throw new Error(error.error || "Failed to create merchant");
      }
      const createdMerchant = await merchantResponse.json();
      updateStep("2", "completed", `Merchant created: ${merchantName}`, { merchantId, merchant: createdMerchant });

      // Step 3: Create Subscription
      updateStep("3", "running", "Creating subscription...");
      const subscriptionId = `sub_${Date.now()}`;
      const subscriptionResponse = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subscriptionId,
          merchantId,
          planId: selectedPlanId,
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
        }),
      });
      if (!subscriptionResponse.ok) {
        const error = await subscriptionResponse.json();
        throw new Error(error.error || "Failed to create subscription");
      }
      const createdSubscription = await subscriptionResponse.json();
      updateStep("3", "completed", `Subscription active`, { subscriptionId, subscription: createdSubscription });

      // Step 4: Create Database
      updateStep("4", "running", "Creating MongoDB database...");
      const dbResponse = await fetch("/api/simulate/create-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId }),
      });
      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        let errorMessage = errorData.error || "Failed to create database";
        if (errorData.details) {
          const details = typeof errorData.details === "string" ? errorData.details.split("\n").join(" | ") : errorData.details;
          errorMessage = `${errorMessage}: ${details}`;
        }
        toast.error(errorMessage, { duration: 10000 });
        throw new Error(errorMessage);
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

      // Step 7: Create Vercel Deployment
      updateStep("7", "running", "Creating deployment...");
      setIsDeploying(true);
      setDeploymentStatus("QUEUED");
      const deployResponse = await fetch("/api/simulate/create-deployment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          merchantName,
          merchantEmail,
          databaseName: dbData.databaseName,
          customSubdomain: customSubdomain.trim() || undefined,
        }),
      });
      if (!deployResponse.ok) {
        const error = await deployResponse.json();
        setIsDeploying(false);
        setLoading(false);
        throw new Error(error.error || "Failed to create deployment");
      }
      const deployData = await deployResponse.json();
      const deploymentIdFromResponse = deployData.deployment.deploymentId;
      const isVercelSkipped =
        deployData.deployment.url?.includes("localhost") ||
        deployData.deployment.url?.includes("127.0.0.1") ||
        deployData.project?.id?.includes("mock");
      if (isVercelSkipped) {
        setIsDeploying(false);
        setLoading(false);
        const deploymentUrl = deployData.deployment.url || "http://localhost:3000";
        updateStep("7", "completed", `Deployment ready (Local mode)`, { deploymentUrl, status: "active", skipped: true });
        setDeploymentStatus("READY");
      } else {
        setDeploymentId(deploymentIdFromResponse);
        setDeploymentStatus(deployData.deployment.status?.toUpperCase() || "QUEUED");
      }
      if (deployData.merchantUser || deployData.deployment.dnsInstructions) {
        setSimulationResult((prev: any) => ({
          ...prev,
          merchantUser: deployData.merchantUser,
          dnsInstructions: deployData.deployment.dnsInstructions,
        }));
      }
      updateStep("7", "running", `Deployment created. Status: ${deployData.deployment.status?.toUpperCase() || "QUEUED"}...`, {
        deploymentId: deploymentIdFromResponse,
        status: deployData.deployment.status?.toUpperCase() || "QUEUED",
        url: deployData.deployment.url || deployData.deployment.vercelUrl,
      });
      if (deployData.deployment.status === "active" || deployData.deployment.status?.toUpperCase() === "READY") {
        setIsDeploying(false);
        setLoading(false);
        const deploymentUrl = deployData.deployment.url || deployData.deployment.vercelUrl;
        updateStep("7", "completed", `Deployment ready`, {
          deploymentUrl,
          vercelUrl: deployData.deployment.vercelUrl,
          projectId: deployData.project.id,
          status: "active",
        });
      }

      // Step 8: Configure Environment
      updateStep("8", "running", "Configuring environment...");
      await new Promise((resolve) => setTimeout(resolve, 400));
      updateStep("8", "completed", "Environment configured");

      // Step 9: Complete
      if (!isDeploying) {
        updateStep("9", "running", "Finalizing...");
        await new Promise((resolve) => setTimeout(resolve, 300));
        updateStep("9", "completed", "Deployment complete!");
      }

      setSimulationResult({
        merchantId,
        subscriptionId,
        databaseName: dbData.databaseName,
        deploymentUrl: deployData.deployment.url || deployData.deployment.vercelUrl || "Deploying...",
        vercelUrl: deployData.deployment.vercelUrl,
        projectId: deployData.project.id,
        projectName: deployData.project.name,
        deploymentId: deploymentIdFromResponse,
        status: deployData.deployment.status || "deploying",
        plan: selectedPlan,
        merchantUser: deployData.merchantUser || null,
        subdomain: deployData.deployment.subdomain,
        subdomainConfigured: deployData.deployment.subdomainConfigured,
        dnsInstructions: deployData.deployment.dnsInstructions,
      });

      if (!isDeploying) {
        toast.success("Simulation completed successfully!");
      }
    } catch (error: any) {
      setIsDeploying(false);
      setLoading(false);
      toast.error(error.message || "Simulation failed");
      const failedStep = steps.find((s) => s.status === "running");
      if (failedStep) {
        updateStep(failedStep.id, "error", error.message);
      }
    } finally {
      if (!isDeploying) {
        setLoading(false);
      }
    }
  };

  const resetSimulation = () => {
    setSteps(initializeSteps());
    setSimulationResult(null);
    setDeploymentId(null);
    setDeploymentStatus("");
    setIsDeploying(false);
    setLoading(false);
    setElapsedTime(0);
    setStartTime(null);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <div className='relative'>
            <div className='absolute inset-0 rounded-2xl bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 blur-xl opacity-50' />
            <div className='relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-xl'>
              <Sparkles className='h-7 w-7 text-white' />
            </div>
          </div>
          <div>
            <h1 className='text-3xl font-bold tracking-tight bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent'>
              Flow Simulation
            </h1>
            <p className='text-muted-foreground'>End-to-end merchant onboarding pipeline</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          {loading && (
            <div className='flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border'>
              <Clock className='h-4 w-4 text-primary animate-pulse' />
              <span className='font-mono text-sm font-medium'>{formatTime(elapsedTime)}</span>
            </div>
          )}
          {simulationResult && (
            <Button variant='outline' onClick={resetSimulation} disabled={isDeploying}>
              <RefreshCw className='h-4 w-4 mr-2' />
              New Simulation
            </Button>
          )}
        </div>
      </div>

      {/* Deployment Warning */}
      {isDeploying && (
        <Card className='border-yellow-500/50 bg-linear-to-r from-yellow-500/5 to-orange-500/5 overflow-hidden'>
          <div className='absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(234,179,8,0.1)_50%,transparent_100%)] animate-[shimmer_2s_infinite]' />
          <CardContent className='flex items-center gap-4 pt-6 relative'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 border border-yellow-500/30'>
              <AlertTriangle className='h-6 w-6 text-yellow-600 animate-pulse' />
            </div>
            <div className='flex-1'>
              <p className='font-semibold text-yellow-600'>Deployment in Progress</p>
              <p className='text-sm text-muted-foreground'>Please stay on this page until the deployment is complete.</p>
            </div>
            <Badge className='bg-yellow-500 text-yellow-950 font-mono'>{deploymentStatus || "QUEUED"}</Badge>
          </CardContent>
        </Card>
      )}

      <div className='grid gap-6 lg:grid-cols-12'>
        {/* Left Column: Configuration */}
        <div className='lg:col-span-4 space-y-6'>
          <Card className='overflow-hidden'>
            <CardHeader className='pb-4 bg-linear-to-br from-muted/50 to-transparent'>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                  <Terminal className='h-4 w-4 text-primary' />
                </div>
                Configuration
              </CardTitle>
              <CardDescription>Set up simulation parameters</CardDescription>
            </CardHeader>
            <CardContent className='space-y-5 pt-4'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Subscription Plan</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className='h-12 border-2 transition-colors focus:border-primary'>
                    <SelectValue placeholder='Select a plan...' />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className='flex items-center justify-between w-full'>
                          <span className='font-medium'>{plan.name}</span>
                          <Badge variant='secondary' className='ml-2 font-mono'>
                            {formatAmount(plan.price)}/mo
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan && (
                <div className='rounded-xl border-2 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-semibold text-lg'>{selectedPlan.name}</p>
                      <p className='text-xs text-muted-foreground'>{selectedPlan.description || "Monthly subscription"}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-3xl font-bold text-primary'>{formatAmount(selectedPlan.price)}</p>
                      <p className='text-xs text-muted-foreground'>/month</p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Merchant Name</Label>
                <Input
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder='Test Merchant'
                  className='h-12 border-2 transition-colors focus:border-primary'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Merchant Email</Label>
                <Input
                  type='email'
                  value={merchantEmail}
                  onChange={(e) => setMerchantEmail(e.target.value)}
                  placeholder='merchant@example.com'
                  className='h-12 border-2 transition-colors focus:border-primary'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium flex items-center gap-2'>
                  Custom Subdomain
                  <Badge variant='outline' className='text-xs font-normal'>
                    Optional
                  </Badge>
                </Label>
                <Input
                  value={customSubdomain}
                  onChange={(e) => setCustomSubdomain(e.target.value)}
                  placeholder='mystore.framextech.com'
                  className='h-12 border-2 transition-colors focus:border-primary'
                />
              </div>

              <Button
                onClick={simulateFlow}
                disabled={loading || !selectedPlanId || isDeploying}
                className='w-full h-14 text-base font-semibold bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25'
                size='lg'
              >
                {loading || isDeploying ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    {isDeploying ? "Deploying..." : "Running..."}
                  </>
                ) : (
                  <>
                    <Play className='mr-2 h-5 w-5' />
                    Launch Simulation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className='border-primary/20 bg-linear-to-br from-primary/5 to-transparent'>
            <CardContent className='pt-6'>
              <div className='flex items-start gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                  <Info className='h-4 w-4 text-primary' />
                </div>
                <div className='space-y-2'>
                  <p className='font-semibold text-sm'>What happens during simulation?</p>
                  <ul className='text-xs text-muted-foreground space-y-1.5'>
                    <li className='flex items-center gap-2'>
                      <Shield className='h-3 w-3 text-green-500' /> Creates a real merchant account
                    </li>
                    <li className='flex items-center gap-2'>
                      <Database className='h-3 w-3 text-violet-500' /> Provisions a dedicated MongoDB database
                    </li>
                    <li className='flex items-center gap-2'>
                      <Rocket className='h-3 w-3 text-orange-500' /> Deploys a live Vercel instance
                    </li>
                    <li className='flex items-center gap-2'>
                      <User className='h-3 w-3 text-blue-500' /> Generates merchant login credentials
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column: Progress Pipeline */}
        <div className='lg:col-span-4'>
          <Card className='h-full overflow-hidden'>
            <CardHeader className='pb-4 bg-linear-to-br from-muted/50 to-transparent'>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
                    <Zap className='h-4 w-4 text-primary' />
                  </div>
                  Pipeline
                </CardTitle>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-24 rounded-full bg-muted overflow-hidden'>
                    <div
                      className='h-full bg-linear-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out'
                      style={{ width: `${getProgress()}%` }}
                    />
                  </div>
                  <Badge variant='outline' className='font-mono text-xs'>
                    {getCompletedSteps()}/{steps.length}
                  </Badge>
                </div>
              </div>
              {/* Phase indicators */}
              <div className='flex items-center gap-2 mt-4'>
                <PhaseHeader phase='setup' isActive={phaseStatus.setup?.active} isCompleted={phaseStatus.setup?.completed} />
                <ChevronRight className='h-4 w-4 text-muted-foreground/50' />
                <PhaseHeader phase='provision' isActive={phaseStatus.provision?.active} isCompleted={phaseStatus.provision?.completed} />
                <ChevronRight className='h-4 w-4 text-muted-foreground/50' />
                <PhaseHeader phase='deploy' isActive={phaseStatus.deploy?.active} isCompleted={phaseStatus.deploy?.completed} />
              </div>
            </CardHeader>
            <CardContent className='pt-4'>
              <div className='relative'>
                {steps.map((step, index) => {
                  const isLastInPhase = index === steps.length - 1 || steps[index + 1]?.phase !== step.phase;
                  const isFirstInPhase = index === 0 || steps[index - 1]?.phase !== step.phase;

                  return (
                    <div key={step.id}>
                      {isFirstInPhase && index > 0 && (
                        <div className='flex items-center gap-2 my-3'>
                          <div className='h-px flex-1 bg-linear-to-r from-transparent via-muted-foreground/20 to-transparent' />
                        </div>
                      )}
                      <div
                        className={`flex items-start gap-4 transition-all duration-300 ${step.status === "running" ? "scale-[1.02]" : ""}`}
                      >
                        <div className='flex flex-col items-center'>
                          <StepIcon step={step} index={index} />
                          {!isLastInPhase && index < steps.length - 1 && (
                            <StepConnector
                              isActive={step.status === "running" || steps[index + 1]?.status === "running"}
                              isCompleted={step.status === "completed"}
                            />
                          )}
                        </div>
                        <div className={`flex-1 pb-4 transition-all duration-300 ${step.status === "running" ? "translate-x-1" : ""}`}>
                          <div className='flex items-center justify-between'>
                            <h4
                              className={`font-semibold transition-colors ${
                                step.status === "completed"
                                  ? "text-green-600"
                                  : step.status === "running"
                                  ? "text-primary"
                                  : step.status === "error"
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.name}
                            </h4>
                            {step.status !== "pending" && (
                              <Badge
                                variant={step.status === "completed" ? "default" : step.status === "running" ? "secondary" : "destructive"}
                                className={`text-xs ${step.status === "completed" ? "bg-green-500" : ""}`}
                              >
                                {step.status}
                              </Badge>
                            )}
                          </div>
                          <p
                            className={`text-sm mt-0.5 transition-colors ${
                              step.status === "running" ? "text-primary/80" : "text-muted-foreground"
                            }`}
                          >
                            {step.message || step.description}
                          </p>
                          {step.status === "running" && step.id === "7" && deploymentStatus && (
                            <div className='mt-2 flex items-center gap-2 text-xs'>
                              <div className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' />
                              <span className='text-primary font-medium'>Status: {deploymentStatus}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className='lg:col-span-4 space-y-6'>
          {simulationResult ? (
            <>
              {/* Deployment Status */}
              <Card
                className={`overflow-hidden ${
                  simulationResult.status === "active"
                    ? "border-green-500/50 bg-linear-to-br from-green-500/5 to-emerald-500/10"
                    : "border-yellow-500/50 bg-linear-to-br from-yellow-500/5 to-orange-500/10"
                }`}
              >
                <CardContent className='pt-6'>
                  <div className='flex items-center gap-4'>
                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${
                        simulationResult.status === "active" ? "bg-green-500" : "bg-yellow-500"
                      } shadow-lg`}
                    >
                      {simulationResult.status === "active" ? (
                        <CheckCircle2 className='h-7 w-7 text-white' />
                      ) : (
                        <Loader2 className='h-7 w-7 text-white animate-spin' />
                      )}
                    </div>
                    <div className='flex-1'>
                      <p className={`text-xl font-bold ${simulationResult.status === "active" ? "text-green-600" : "text-yellow-600"}`}>
                        {simulationResult.status === "active" ? "Deployment Ready!" : "Deploying..."}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {simulationResult.status === "active" ? "Your merchant store is live" : `Status: ${deploymentStatus || "QUEUED"}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deployment URL */}
              {simulationResult.deploymentUrl && simulationResult.deploymentUrl !== "Deploying..." && (
                <Card className='overflow-hidden'>
                  <CardHeader className='pb-3 bg-linear-to-br from-muted/50 to-transparent'>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <Globe className='h-4 w-4 text-primary' />
                      Live Store URL
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={`https://${simulationResult.deploymentUrl}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='group flex items-center justify-between rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 hover:border-primary hover:bg-primary/10 transition-all'
                    >
                      <span className='font-mono text-sm text-primary truncate'>{simulationResult.deploymentUrl}</span>
                      <ExternalLink className='h-5 w-5 text-primary shrink-0 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Merchant Credentials */}
              {simulationResult.merchantUser && (
                <Card className='overflow-hidden'>
                  <CardHeader className='pb-3 bg-linear-to-br from-muted/50 to-transparent'>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <User className='h-4 w-4 text-primary' />
                      Merchant Login
                    </CardTitle>
                    <CardDescription>Use these credentials to access the dashboard</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <Label className='text-xs text-muted-foreground'>Email</Label>
                      <div className='flex items-center gap-2'>
                        <code className='flex-1 rounded-lg border bg-muted/50 px-4 py-3 text-sm font-mono'>
                          {simulationResult.merchantUser.email}
                        </code>
                        <Button
                          variant='outline'
                          size='icon'
                          className='h-11 w-11'
                          onClick={() => copyToClipboard(simulationResult.merchantUser.email, "email")}
                        >
                          {copiedField === "email" ? <CheckCircle className='h-4 w-4 text-green-500' /> : <Copy className='h-4 w-4' />}
                        </Button>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-xs text-muted-foreground'>Password</Label>
                      <div className='flex items-center gap-2'>
                        <code className='flex-1 rounded-lg border bg-muted/50 px-4 py-3 text-sm font-mono'>
                          {simulationResult.merchantUser.password}
                        </code>
                        <Button
                          variant='outline'
                          size='icon'
                          className='h-11 w-11'
                          onClick={() => copyToClipboard(simulationResult.merchantUser.password, "password")}
                        >
                          {copiedField === "password" ? <CheckCircle className='h-4 w-4 text-green-500' /> : <Copy className='h-4 w-4' />}
                        </Button>
                      </div>
                    </div>
                    {simulationResult.deploymentUrl && simulationResult.deploymentUrl !== "Deploying..." && (
                      <a
                        href={`https://${simulationResult.deploymentUrl}/login`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline'
                      >
                        Open Login Page <ArrowRight className='h-4 w-4' />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Resource IDs */}
              <Card className='overflow-hidden'>
                <CardHeader className='pb-3 bg-linear-to-br from-muted/50 to-transparent'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Server className='h-4 w-4 text-primary' />
                    Resources Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='rounded-xl border bg-muted/30 p-3'>
                      <p className='text-xs text-muted-foreground mb-1'>Merchant ID</p>
                      <p className='font-mono text-xs truncate'>{simulationResult.merchantId}</p>
                    </div>
                    <div className='rounded-xl border bg-muted/30 p-3'>
                      <p className='text-xs text-muted-foreground mb-1'>Database</p>
                      <p className='font-mono text-xs truncate'>{simulationResult.databaseName}</p>
                    </div>
                    <div className='rounded-xl border bg-muted/30 p-3'>
                      <p className='text-xs text-muted-foreground mb-1'>Plan</p>
                      <p className='text-sm font-semibold'>{simulationResult.plan?.name}</p>
                    </div>
                    <div className='rounded-xl border bg-muted/30 p-3'>
                      <p className='text-xs text-muted-foreground mb-1'>Status</p>
                      <Badge
                        variant={simulationResult.status === "active" ? "default" : "secondary"}
                        className={simulationResult.status === "active" ? "bg-green-500" : ""}
                      >
                        {simulationResult.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DNS Instructions */}
              {simulationResult.dnsInstructions && simulationResult.dnsInstructions.length > 0 && !simulationResult.dnsAutoConfigured && (
                <Card className='border-amber-500/50 overflow-hidden'>
                  <CardHeader className='pb-3 bg-linear-to-br from-amber-500/10 to-transparent'>
                    <CardTitle className='flex items-center gap-2 text-base text-amber-600'>
                      <AlertTriangle className='h-4 w-4' />
                      DNS Configuration Required
                    </CardTitle>
                    <CardDescription>Add these records to your domain provider</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {simulationResult.dnsInstructions.map((dns: any, index: number) => (
                      <div key={index} className='rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2'>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-muted-foreground'>Type</span>
                          <Badge variant='outline' className='font-mono'>
                            {dns.type}
                          </Badge>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-muted-foreground'>Name</span>
                          <code className='font-mono text-xs'>{dns.name}</code>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                          <span className='text-muted-foreground'>Value</span>
                          <div className='flex items-center gap-2'>
                            <code className='font-mono text-xs'>{dns.value}</code>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={() => copyToClipboard(dns.value, `dns-${index}`)}
                            >
                              {copiedField === `dns-${index}` ? (
                                <CheckCircle className='h-3 w-3 text-green-500' />
                              ) : (
                                <Copy className='h-3 w-3' />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className='h-full overflow-hidden'>
              <CardContent className='flex flex-col items-center justify-center h-full py-16 text-center'>
                <div className='relative mb-6'>
                  <div className='absolute inset-0 rounded-full bg-linear-to-br from-violet-500 to-purple-500 blur-2xl opacity-20' />
                  <div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-muted to-muted/50 border-2 border-dashed border-muted-foreground/30'>
                    <Rocket className='h-10 w-10 text-muted-foreground/50' />
                  </div>
                </div>
                <h3 className='text-xl font-semibold mb-2'>Ready to Launch</h3>
                <p className='text-sm text-muted-foreground max-w-[240px]'>
                  Configure your simulation parameters and click Launch to begin the onboarding pipeline
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
