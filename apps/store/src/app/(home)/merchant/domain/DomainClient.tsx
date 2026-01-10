"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, CheckCircle2, Loader2, Copy, Trash2, RefreshCw, AlertTriangle, Clock, XCircle } from "lucide-react";
import type { DomainConfiguration } from "@/lib/domain-service";
import type { MerchantDeployment } from "@/lib/merchant-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/api-client";

interface DomainClientProps {
  domainConfig: DomainConfiguration | null;
  deployment: MerchantDeployment | null;
}

interface DomainStatus {
  verified: boolean;
  configuredCorrectly: boolean;
}

export function DomainClient({ domainConfig: initialConfig, deployment }: DomainClientProps) {
  const [domainConfig, setDomainConfig] = useState(initialConfig);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<DomainStatus | null>(null);

  // Fetch real-time status from server
  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const data = await apiRequest<any>("GET", "/merchant/domain/configure");
      if (data.domain) {
        setDomainConfig(data.domain);
      }
      if (data.dnsStatus) {
        setDnsStatus(data.dnsStatus);
      }

      if (data.domain?.verified) {
        toast.success("Domain is connected!");
      } else if (data.dnsStatus?.configuredCorrectly === false) {
        toast.error("DNS not configured correctly. Check your records.");
      } else {
        toast.info("DNS not propagated yet. Try again in a few minutes.");
      }
    } catch (error) {
      toast.error("Failed to refresh status");
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh status on mount if domain exists
  useEffect(() => {
    if (initialConfig && !initialConfig.verified) {
      refreshStatus();
    }
  }, []);

  const handleAddDomain = async () => {
    if (!domain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain.trim())) {
      toast.error("Invalid domain format");
      return;
    }

    setLoading(true);
    try {
      await apiRequest<any>("POST", "/merchant/domain/configure", { domain: domain.toLowerCase().trim() });

      toast.success("Domain added! Configure DNS records below.");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to add domain");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!domainConfig) return;

    setChecking(true);
    try {
      const data = await apiRequest<any>("POST", "/merchant/domain/verify", { domain: domainConfig.domain });

      if (data.verified) {
        toast.success("Domain connected successfully!");
        window.location.reload();
      } else {
        toast.info(data.message || "DNS not propagated yet. Try again in a few minutes.");
      }
    } catch (error: any) {
      toast.error("Failed to check status");
    } finally {
      setChecking(false);
    }
  };

  const handleRemoveDomain = async () => {
    if (!domainConfig) return;

    setRemoving(true);
    try {
      await apiRequest<any>("DELETE", `/merchant/domain/remove?domain=${encodeURIComponent(domainConfig.domain)}`);

      toast.success("Domain removed");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove domain");
    } finally {
      setRemoving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  // No domain configured - show add form
  if (!domainConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Globe className='h-5 w-5' />
            Add Custom Domain
          </CardTitle>
          <CardDescription>Connect your own domain to your store</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='domain'>Domain</Label>
            <div className='flex gap-2'>
              <Input
                id='domain'
                placeholder='yourdomain.com'
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase())}
                className='font-mono'
              />
              <Button onClick={handleAddDomain} disabled={loading || !domain.trim()}>
                {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : "Add"}
              </Button>
            </div>
          </div>

          {deployment && (
            <p className='text-sm text-muted-foreground'>
              Current URL:{" "}
              <a href={`https://${deployment.deploymentUrl}`} target='_blank' rel='noopener noreferrer' className='text-primary underline'>
                {deployment.deploymentUrl}
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Domain configured - show status and DNS records
  return (
    <div className='space-y-4'>
      {/* Status Card */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Globe className='h-5 w-5' />
              <div>
                <CardTitle className='text-lg font-mono'>{domainConfig.domain}</CardTitle>
                <CardDescription>Custom Domain</CardDescription>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {/* Refresh button */}
              <Button variant='ghost' size='icon' onClick={refreshStatus} disabled={refreshing} title='Refresh status'>
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>

              {/* Status badge */}
              {domainConfig.verified ? (
                <Badge className='bg-green-500 hover:bg-green-600'>
                  <CheckCircle2 className='h-3 w-3 mr-1' />
                  Connected
                </Badge>
              ) : dnsStatus?.configuredCorrectly === false ? (
                <Badge variant='destructive'>
                  <XCircle className='h-3 w-3 mr-1' />
                  Invalid DNS
                </Badge>
              ) : (
                <Badge variant='secondary' className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
                  <Clock className='h-3 w-3 mr-1' />
                  Pending DNS
                </Badge>
              )}

              {/* Delete button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='ghost' size='icon' disabled={removing}>
                    {removing ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4 text-muted-foreground' />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Domain?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will disconnect <strong>{domainConfig.domain}</strong> from your store.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveDomain} className='bg-red-500 hover:bg-red-600'>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-0 space-y-3'>
          {/* Connected status */}
          {domainConfig.verified && (
            <div className='flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg'>
              <CheckCircle2 className='h-5 w-5 text-green-600' />
              <span className='text-sm text-green-700 dark:text-green-300'>
                Your store is live at{" "}
                <a href={`https://${domainConfig.domain}`} target='_blank' rel='noopener noreferrer' className='font-medium underline'>
                  {domainConfig.domain}
                </a>
              </span>
            </div>
          )}

          {/* Invalid DNS warning */}
          {!domainConfig.verified && dnsStatus?.configuredCorrectly === false && (
            <div className='flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg'>
              <XCircle className='h-5 w-5 text-red-600' />
              <span className='text-sm text-red-700 dark:text-red-300'>
                DNS records are not configured correctly. Please check your domain provider settings.
              </span>
            </div>
          )}

          {/* Vercel Status Info */}
          <div className='flex items-center justify-between text-xs text-muted-foreground pt-2 border-t'>
            <span>
              Status:{" "}
              {domainConfig.verified ? "Verified ✓" : dnsStatus?.configuredCorrectly === false ? "Misconfigured ✗" : "Pending..."}
            </span>
            <Button variant='link' size='sm' className='h-auto p-0 text-xs' onClick={refreshStatus} disabled={refreshing}>
              {refreshing ? "Checking..." : "Recheck now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DNS Records Card - Show when not verified */}
      {!domainConfig.verified && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4 text-yellow-500' />
              Set Up DNS to Connect Your Domain
            </CardTitle>
            <CardDescription>Add this record to your domain provider to connect your domain</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Simple DNS Record Display */}
            {domainConfig.dnsRecords.map((record, index) => (
              <div key={index} className='border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5'>
                <p className='text-sm font-medium mb-3'>
                  Go to your domain provider (Hostinger, GoDaddy, Namecheap, etc.) and add this DNS record:
                </p>
                <div className='bg-background rounded-lg p-4 space-y-3'>
                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>Type</p>
                      <div className='flex items-center gap-2'>
                        <code className='bg-muted px-3 py-1.5 rounded font-mono text-sm font-bold'>{record.type}</code>
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={() => copyToClipboard(record.type)}>
                          <Copy className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>Name / Host</p>
                      <div className='flex items-center gap-2'>
                        <code className='bg-muted px-3 py-1.5 rounded font-mono text-sm font-bold'>{record.name}</code>
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={() => copyToClipboard(record.name)}>
                          <Copy className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>Value / Points to</p>
                      <div className='flex items-center gap-2'>
                        <code className='bg-muted px-3 py-1.5 rounded font-mono text-sm font-bold'>{record.value}</code>
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={() => copyToClipboard(record.value)}>
                          <Copy className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Simple Steps */}
            <div className='space-y-2'>
              <p className='text-sm font-medium'>Steps:</p>
              <div className='grid gap-2 text-sm text-muted-foreground'>
                <div className='flex items-start gap-2'>
                  <span className='bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0'>
                    1
                  </span>
                  <span>Log in to your domain provider (where you bought your domain)</span>
                </div>
                <div className='flex items-start gap-2'>
                  <span className='bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0'>
                    2
                  </span>
                  <span>Go to DNS settings or DNS Zone</span>
                </div>
                <div className='flex items-start gap-2'>
                  <span className='bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0'>
                    3
                  </span>
                  <span>Add a new record with the values above</span>
                </div>
                <div className='flex items-start gap-2'>
                  <span className='bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0'>
                    4
                  </span>
                  <span>Save and click &quot;Check Status&quot; below (may take 5-30 minutes)</span>
                </div>
              </div>
            </div>

            {/* Help Link */}
            <p className='text-xs text-muted-foreground'>
              Need help? Check if DNS is propagated at{" "}
              <a
                href={`https://dnschecker.org/#A/${domainConfig.domain}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary underline'
              >
                dnschecker.org
              </a>
            </p>

            {/* Check Status Button */}
            <Button onClick={handleCheckStatus} disabled={checking} className='w-full' size='lg'>
              {checking ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Check Status
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Show DNS as reference when connected */}
      {domainConfig.verified && domainConfig.dnsRecords.length > 0 && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Your DNS Configuration</CardTitle>
            <CardDescription>These records are configured in your domain provider</CardDescription>
          </CardHeader>
          <CardContent>
            {domainConfig.dnsRecords.map((record, index) => (
              <div key={index} className='p-4 bg-muted/30 rounded-lg'>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Type</p>
                    <code className='text-sm font-mono font-bold'>{record.type}</code>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Name</p>
                    <code className='text-sm font-mono font-bold'>{record.name}</code>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Target</p>
                    <div className='flex items-center gap-2'>
                      <code className='text-sm font-mono font-bold'>{record.value}</code>
                      <Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={() => copyToClipboard(record.value)}>
                        <Copy className='h-3 w-3' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
