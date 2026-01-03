import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import { getCollection } from "@/lib/mongodb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { revalidatePath } from "next/cache";

type FeatureRequestStatus = "new" | "in_review" | "resolved";
type FeatureRequestPriority = "low" | "medium" | "high";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: FeatureRequestPriority;
  contactEmail?: string;
  contactPhone?: string;
  merchantId: string;
  status: FeatureRequestStatus;
  createdAt: string;
}

export const metadata: Metadata = {
  title: "Feature Request",
};

async function getRequest(id: string): Promise<FeatureRequest | null> {
  try {
    const col = await getCollection("feature_requests");
    const doc = await col.findOne({ id });
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return rest as FeatureRequest;
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: FeatureRequestStatus }) {
  const map: Record<FeatureRequestStatus, string> = {
    new: "bg-blue-100 text-blue-800",
    in_review: "bg-amber-100 text-amber-800",
    resolved: "bg-green-100 text-green-800",
  };
  return <Badge className={map[status]}>{status.replace("_", " ")}</Badge>;
}

function PriorityBadge({ priority }: { priority: FeatureRequestPriority }) {
  const map: Record<FeatureRequestPriority, string> = {
    low: "bg-slate-100 text-slate-800",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-800",
  };
  return <Badge className={map[priority]}>{priority}</Badge>;
}

export default async function FeatureRequestView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getRequest(id);

  if (!request) {
    return (
      <div className='space-y-4'>
        <Button asChild variant='ghost' size='sm'>
          <Link href='/feature-requests'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to list
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Not found</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground'>This feature request could not be found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <Button asChild variant='ghost' size='sm'>
          <Link href='/feature-requests'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Link>
        </Button>
        <form
          action={async (formData) => {
            "use server";
            const status = formData.get("status")?.toString();
            const priority = formData.get("priority")?.toString();
            const updates: Record<string, any> = {};
            if (status && ["new", "in_review", "resolved"].includes(status)) updates.status = status;
            if (priority && ["low", "medium", "high"].includes(priority)) updates.priority = priority;
            if (Object.keys(updates).length === 0) return;
            const col = await getCollection("feature_requests");
            await col.updateOne({ id }, { $set: updates });
            revalidatePath(`/feature-requests/${id}`);
          }}
          className='flex flex-wrap items-center gap-2'
        >
          <Select name='status' defaultValue={request.status}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='new'>New</SelectItem>
              <SelectItem value='in_review'>In Review</SelectItem>
              <SelectItem value='resolved'>Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select name='priority' defaultValue={request.priority}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='high'>High</SelectItem>
              <SelectItem value='medium'>Medium</SelectItem>
              <SelectItem value='low'>Low</SelectItem>
            </SelectContent>
          </Select>
          <Button type='submit' size='sm'>
            Save
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex flex-col gap-1'>
            <span>{request.title}</span>
            <span className='text-sm font-normal text-muted-foreground'>ID: {request.id}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Merchant</div>
            <div className='font-mono text-sm text-foreground'>{request.merchantId}</div>
          </div>

          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>Description</div>
            <p className='text-sm text-foreground whitespace-pre-wrap'>{request.description}</p>
          </div>

          <div className='space-y-2'>
            <div className='text-sm text-muted-foreground'>Contact</div>
            <div className='space-y-1 text-sm text-foreground'>
              {request.contactEmail ? (
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  <span>{request.contactEmail}</span>
                </div>
              ) : (
                <div className='text-muted-foreground text-xs'>No email provided</div>
              )}
              {request.contactPhone ? (
                <div className='flex items-center gap-2'>
                  <Phone className='h-4 w-4' />
                  <span>{request.contactPhone}</span>
                </div>
              ) : (
                <div className='text-muted-foreground text-xs'>No phone provided</div>
              )}
            </div>
          </div>

          <div className='text-xs text-muted-foreground'>Created: {new Date(request.createdAt).toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
