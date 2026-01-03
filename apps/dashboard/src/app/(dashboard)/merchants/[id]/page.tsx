"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  CreditCard,
  Database,
  Rocket,
  Settings,
  ExternalLink,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Server,
  HardDrive,
  Layers,
  DollarSign,
  Activity,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/SettingsContext";

interface MerchantFull {
  merchant: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    customDomain?: string;
    deploymentUrl?: string;
    subscriptionId?: string;
    settings?: {
      brandName?: string;
      logo?: string;
      theme?: { primaryColor?: string };
      currency?: string;
      timezone?: string;
    };
    createdAt?: string;
    updatedAt?: string;
  };
  subscription: {
    id: string;
    merchantId: string;
    planId: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEndsAt?: string;
    cancelAtPeriodEnd?: boolean;
  } | null;
  plan: {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
    features?: Record<string, any>;
  } | null;
  deployment: {
    id: string;
    merchantId: string;
    deploymentType: string;
    deploymentStatus: string;
    deploymentUrl: string;
    deploymentProvider?: string;
    subdomain?: string;
    createdAt?: string;
  } | null;
  database: {
    id: string;
    merchantId: string;
    databaseName: string;
    status: string;
    useSharedDatabase?: boolean;
    createdAt?: string;
  } | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    active: { color: "bg-green-500", icon: <CheckCircle2 className='h-3 w-3' /> },
    trial: { color: "bg-blue-500", icon: <Clock className='h-3 w-3' /> },
    suspended: { color: "bg-red-500", icon: <XCircle className='h-3 w-3' /> },
    inactive: { color: "bg-gray-500", icon: <AlertTriangle className='h-3 w-3' /> },
    pending: { color: "bg-yellow-500", icon: <Clock className='h-3 w-3' /> },
    failed: { color: "bg-red-500", icon: <XCircle className='h-3 w-3' /> },
    past_due: { color: "bg-yellow-500", icon: <AlertTriangle className='h-3 w-3' /> },
    cancelled: { color: "bg-gray-500", icon: <XCircle className='h-3 w-3' /> },
  };

  const { color, icon } = config[status] || { color: "bg-gray-500", icon: null };

  return (
    <Badge className={`${color} gap-1`}>
      {icon}
      <span className='capitalize'>{status.replace("_", " ")}</span>
    </Badge>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className='space-y-1'>
      <Label className='text-xs text-muted-foreground flex items-center gap-1'>
        {Icon && <Icon className='h-3 w-3' />}
        {label}
      </Label>
      <p className='text-sm font-medium'>{value || "—"}</p>
    </div>
  );
}

export default function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { formatAmount } = useCurrency();
  const resolvedParams = use(params);
  const router = useRouter();
  const [data, setData] = useState<MerchantFull | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchants/${resolvedParams.id}/full`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Merchant not found");
          router.push("/merchants");
          return;
        }
        throw new Error("Failed to load merchant");
      }
      const merchantData = await res.json();
      setData(merchantData);
    } catch (error) {
      console.error("Failed to load merchant:", error);
      toast.error("Failed to load merchant details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this merchant and all associated data? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/merchants/${resolvedParams.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete merchant");

      toast.success("Merchant deleted successfully");
      router.push("/merchants");
    } catch (error) {
      toast.error("Failed to delete merchant");
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <div className='h-10 w-10 animate-pulse rounded bg-muted' />
          <div className='space-y-2'>
            <div className='h-6 w-48 animate-pulse rounded bg-muted' />
            <div className='h-4 w-32 animate-pulse rounded bg-muted' />
          </div>
        </div>
        <div className='grid gap-6 lg:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-48 animate-pulse rounded-lg bg-muted' />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Building2 className='h-12 w-12 text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Merchant not found</p>
        <Link href='/merchants'>
          <Button className='mt-4'>Back to Merchants</Button>
        </Link>
      </div>
    );
  }

  const { merchant, subscription, plan, deployment, database } = data;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/merchants'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary'>
            {merchant.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold'>{merchant.name}</h1>
              <StatusBadge status={merchant.status} />
            </div>
            <p className='text-muted-foreground'>{merchant.email}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href={`/merchants?edit=${merchant.id}`}>
            <Button variant='outline'>
              <Edit className='h-4 w-4 mr-2' />
              Edit
            </Button>
          </Link>
          <Button variant='destructive' onClick={handleDelete}>
            <Trash2 className='h-4 w-4 mr-2' />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Subscription</p>
                <p className='text-2xl font-bold'>{plan?.name || "None"}</p>
              </div>
              <CreditCard className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Monthly Revenue</p>
                <p className='text-2xl font-bold text-green-600'>{formatAmount(plan?.price || 0)}</p>
              </div>
              <DollarSign className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Deployment</p>
                <p className='text-2xl font-bold capitalize'>{deployment?.deploymentStatus || "None"}</p>
              </div>
              <Rocket className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Database</p>
                <p className='text-2xl font-bold capitalize'>{database?.status || "None"}</p>
              </div>
              <Database className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='subscription'>Subscription</TabsTrigger>
          <TabsTrigger value='deployment'>Deployment</TabsTrigger>
          <TabsTrigger value='database'>Database</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-6 lg:grid-cols-2'>
            {/* Merchant Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  Merchant Information
                </CardTitle>
              </CardHeader>
              <CardContent className='grid gap-4 sm:grid-cols-2'>
                <InfoItem label='Merchant ID' value={<code className='text-xs'>{merchant.id}</code>} />
                <InfoItem label='Name' value={merchant.name} icon={Building2} />
                <InfoItem label='Email' value={merchant.email} icon={Mail} />
                <InfoItem label='Phone' value={merchant.phone} icon={Phone} />
                <InfoItem label='Status' value={<StatusBadge status={merchant.status} />} />
                <InfoItem
                  label='Created'
                  value={merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString() : "—"}
                  icon={Calendar}
                />
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Globe className='h-5 w-5' />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {deployment?.deploymentUrl && (
                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div>
                      <p className='text-sm font-medium'>Store URL</p>
                      <p className='text-xs text-muted-foreground'>{deployment.deploymentUrl}</p>
                    </div>
                    <a href={`https://${deployment.deploymentUrl}`} target='_blank' rel='noopener noreferrer'>
                      <Button variant='outline' size='sm'>
                        <ExternalLink className='h-4 w-4' />
                      </Button>
                    </a>
                  </div>
                )}
                {merchant.customDomain && (
                  <div className='flex items-center justify-between rounded-lg border p-3'>
                    <div>
                      <p className='text-sm font-medium'>Custom Domain</p>
                      <p className='text-xs text-muted-foreground'>{merchant.customDomain}</p>
                    </div>
                    <a href={`https://${merchant.customDomain}`} target='_blank' rel='noopener noreferrer'>
                      <Button variant='outline' size='sm'>
                        <ExternalLink className='h-4 w-4' />
                      </Button>
                    </a>
                  </div>
                )}
                {!deployment?.deploymentUrl && !merchant.customDomain && (
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <Globe className='mb-2 h-8 w-8 text-muted-foreground' />
                    <p className='text-sm text-muted-foreground'>No deployment configured</p>
                    <Link href='/simulate'>
                      <Button variant='outline' size='sm' className='mt-2'>
                        Create Deployment
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value='subscription' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CreditCard className='h-5 w-5' />
                Subscription Details
              </CardTitle>
              <CardDescription>Current subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription && plan ? (
                <div className='space-y-6'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10'>
                      <Layers className='h-8 w-8 text-primary' />
                    </div>
                    <div>
                      <h3 className='text-xl font-semibold'>{plan.name}</h3>
                      <p className='text-2xl font-bold text-green-600'>
                        {formatAmount(plan.price)}
                        <span className='text-sm font-normal text-muted-foreground'>/{plan.billingCycle}</span>
                      </p>
                    </div>
                    <StatusBadge status={subscription.status} />
                  </div>

                  <Separator />

                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    <InfoItem label='Period Start' value={new Date(subscription.currentPeriodStart).toLocaleDateString()} icon={Calendar} />
                    <InfoItem label='Period End' value={new Date(subscription.currentPeriodEnd).toLocaleDateString()} icon={Calendar} />
                    <InfoItem
                      label='Days Remaining'
                      value={
                        <span
                          className={
                            getDaysUntilExpiry(subscription.currentPeriodEnd) <= 7
                              ? "text-yellow-600"
                              : getDaysUntilExpiry(subscription.currentPeriodEnd) <= 0
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {getDaysUntilExpiry(subscription.currentPeriodEnd)} days
                        </span>
                      }
                      icon={Clock}
                    />
                    <InfoItem label='Cancel at Period End' value={subscription.cancelAtPeriodEnd ? "Yes" : "No"} icon={AlertTriangle} />
                  </div>

                  {plan.features && Object.keys(plan.features).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className='mb-3 font-semibold'>Plan Features</h4>
                        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                          {Object.entries(plan.features).map(([key, value]) => (
                            <div key={key} className='flex items-center gap-2 text-sm'>
                              <CheckCircle2 className='h-4 w-4 text-green-500' />
                              <span className='capitalize'>{key.replace(/_/g, " ")}</span>
                              {typeof value !== "boolean" && (
                                <Badge variant='secondary' className='ml-auto'>
                                  {String(value)}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <CreditCard className='mb-4 h-12 w-12 text-muted-foreground' />
                  <h3 className='text-lg font-semibold'>No Active Subscription</h3>
                  <p className='text-sm text-muted-foreground'>This merchant doesn't have an active subscription</p>
                  <Link href='/subscriptions'>
                    <Button className='mt-4'>Create Subscription</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value='deployment' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Rocket className='h-5 w-5' />
                Deployment Details
              </CardTitle>
              <CardDescription>Hosting and deployment configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {deployment ? (
                <div className='space-y-6'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10'>
                      <Server className='h-8 w-8 text-primary' />
                    </div>
                    <div>
                      <h3 className='text-xl font-semibold capitalize'>{deployment.deploymentType.replace("_", " ")}</h3>
                      <p className='text-sm text-muted-foreground'>{deployment.deploymentUrl}</p>
                    </div>
                    <StatusBadge status={deployment.deploymentStatus} />
                  </div>

                  <Separator />

                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    <InfoItem label='Deployment ID' value={<code className='text-xs'>{deployment.id}</code>} />
                    <InfoItem label='Provider' value={deployment.deploymentProvider || "—"} icon={Server} />
                    <InfoItem label='Subdomain' value={deployment.subdomain || "—"} icon={Globe} />
                    <InfoItem
                      label='Created'
                      value={deployment.createdAt ? new Date(deployment.createdAt).toLocaleDateString() : "—"}
                      icon={Calendar}
                    />
                    <InfoItem label='URL' value={deployment.deploymentUrl} icon={ExternalLink} />
                  </div>

                  {deployment.deploymentUrl && (
                    <div className='flex gap-2'>
                      <a href={`https://${deployment.deploymentUrl}`} target='_blank' rel='noopener noreferrer' className='flex-1'>
                        <Button variant='outline' className='w-full'>
                          <ExternalLink className='mr-2 h-4 w-4' />
                          Visit Site
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <Rocket className='mb-4 h-12 w-12 text-muted-foreground' />
                  <h3 className='text-lg font-semibold'>No Deployment</h3>
                  <p className='text-sm text-muted-foreground'>This merchant doesn't have a deployment configured</p>
                  <Link href='/simulate'>
                    <Button className='mt-4'>Create Deployment</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value='database' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='h-5 w-5' />
                Database Details
              </CardTitle>
              <CardDescription>Database configuration and status</CardDescription>
            </CardHeader>
            <CardContent>
              {database ? (
                <div className='space-y-6'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10'>
                      <HardDrive className='h-8 w-8 text-primary' />
                    </div>
                    <div>
                      <h3 className='text-xl font-semibold font-mono'>{database.databaseName}</h3>
                      <p className='text-sm text-muted-foreground'>
                        {database.useSharedDatabase ? "Shared Database" : "Dedicated Database"}
                      </p>
                    </div>
                    <StatusBadge status={database.status} />
                  </div>

                  <Separator />

                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    <InfoItem label='Database ID' value={<code className='text-xs'>{database.id}</code>} />
                    <InfoItem label='Database Name' value={<code>{database.databaseName}</code>} icon={Database} />
                    <InfoItem label='Type' value={database.useSharedDatabase ? "Shared" : "Dedicated"} icon={HardDrive} />
                    <InfoItem
                      label='Created'
                      value={database.createdAt ? new Date(database.createdAt).toLocaleDateString() : "—"}
                      icon={Calendar}
                    />
                  </div>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <Database className='mb-4 h-12 w-12 text-muted-foreground' />
                  <h3 className='text-lg font-semibold'>No Database</h3>
                  <p className='text-sm text-muted-foreground'>This merchant doesn't have a database configured</p>
                  <Link href='/simulate'>
                    <Button className='mt-4'>Create Database</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value='settings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                Merchant Settings
              </CardTitle>
              <CardDescription>Store configuration and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {merchant.settings ? (
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                  <InfoItem label='Brand Name' value={merchant.settings.brandName} icon={Building2} />
                  <InfoItem label='Currency' value={merchant.settings.currency} icon={DollarSign} />
                  <InfoItem label='Timezone' value={merchant.settings.timezone} icon={Clock} />
                  {merchant.settings.theme?.primaryColor && (
                    <div className='space-y-1'>
                      <Label className='text-xs text-muted-foreground'>Primary Color</Label>
                      <div className='flex items-center gap-2'>
                        <div className='h-6 w-6 rounded border' style={{ backgroundColor: merchant.settings.theme.primaryColor }} />
                        <code className='text-sm'>{merchant.settings.theme.primaryColor}</code>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <Settings className='mb-4 h-12 w-12 text-muted-foreground' />
                  <h3 className='text-lg font-semibold'>No Settings Configured</h3>
                  <p className='text-sm text-muted-foreground'>This merchant hasn't configured any settings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
