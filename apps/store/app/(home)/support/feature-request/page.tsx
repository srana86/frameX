import type { Metadata } from "next";
import { FeatureRequestForm } from "./FeatureRequestForm";
import { getMerchantId } from "@/lib/env-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";

type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  contactEmail?: string;
  contactPhone?: string;
  merchantId: string;
  status: "new" | "in_review" | "resolved";
  createdAt: string;
};

async function getMyRequests(merchantId: string): Promise<FeatureRequest[]> {
  const apiBase = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPERADMIN_API_URL;
  if (!apiBase) return [];
  try {
    const res = await fetch(`${apiBase}/api/feature-requests?merchantId=${merchantId}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: "Request a Feature",
  description: "Share what you need from our team.",
};

export default async function FeatureRequestPage() {
  const merchantId = getMerchantId();
  const requests = merchantId ? await getMyRequests(merchantId) : [];

  if (!merchantId) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-10 sm:py-14 space-y-4'>
        <Alert variant='destructive'>
          <AlertTitle>Missing merchant configuration</AlertTitle>
          <AlertDescription>Set MERCHANT_ID to submit a feature request.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-3xl px-4 py-10 sm:py-14 space-y-4'>
      <div className='space-y-2'>
        <p className='text-sm uppercase tracking-wide text-primary/80'>Support</p>
        <h1 className='text-3xl font-semibold text-foreground'>Request a Feature</h1>
        <p className='text-muted-foreground'>
          Tell us what you need. We review every request and will reach out on the contact info you provide.
        </p>
      </div>
      <FeatureRequestForm />

      <Card className='mt-6'>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No requests yet.</p>
          ) : (
            <div className='space-y-3'>
              {requests.map((req) => (
                <div key={req.id} className='rounded-lg border p-3 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='font-semibold text-foreground'>{req.title}</span>
                    <Badge variant='outline' className='capitalize'>
                      {req.status.replace("_", " ")}
                    </Badge>
                    <Badge className='capitalize'>{req.priority}</Badge>
                  </div>
                  <p className='text-sm text-muted-foreground line-clamp-2'>{req.description}</p>
                  <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                    <span>{new Date(req.createdAt).toLocaleString()}</span>
                    {req.contactEmail && (
                      <span className='flex items-center gap-1'>
                        <Mail className='h-3 w-3' />
                        {req.contactEmail}
                      </span>
                    )}
                    {req.contactPhone && (
                      <span className='flex items-center gap-1'>
                        <Phone className='h-3 w-3' />
                        {req.contactPhone}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
