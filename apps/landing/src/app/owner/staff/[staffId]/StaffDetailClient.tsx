"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  ArrowLeft,
  Store,
  Shield,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/utils/cn";

interface StoreAccess {
  storeId: string;
  storeName: string;
  storeSlug?: string | null;
  permission: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  createdAt: Date;
  stores: StoreAccess[];
}

interface StoreInfo {
  id: string;
  name: string;
  slug?: string | null;
  status: string;
}

interface StaffDetailClientProps {
  staff: StaffMember;
  ownerStores: StoreInfo[];
}

/**
 * Permission badge component
 */
function PermissionBadge({ permission }: { permission: string }) {
  const colors: Record<string, string> = {
    VIEW: "bg-blue-100 text-blue-700",
    EDIT: "bg-yellow-100 text-yellow-700",
    FULL: "bg-green-100 text-green-700",
  };

  const descriptions: Record<string, string> = {
    VIEW: "Read-only access",
    EDIT: "Can create and edit",
    FULL: "Full access",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          colors[permission] || "bg-gray-100 text-gray-700"
        )}
      >
        {permission}
      </span>
      <span className="text-xs text-muted-foreground">
        {descriptions[permission]}
      </span>
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-gray-100 text-gray-700",
    BLOCKED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[status] || "bg-gray-100 text-gray-700"
      )}
    >
      {status}
    </span>
  );
}

/**
 * Staff Detail Client Component
 */
export function StaffDetailClient({
  staff,
  ownerStores,
}: StaffDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/owner/staff/${staff.id}`);
      toast.success("Staff access removed successfully");
      router.push("/owner/staff");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove staff access");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/owner/staff">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{staff.name}</h1>
            <p className="text-muted-foreground">{staff.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/owner/staff/${staff.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove Access
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Staff Access</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove {staff.name}&apos;s access to all your stores.
                  They will no longer be able to manage any of your stores.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove Access
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <span className="text-2xl font-semibold text-primary">
                  {staff.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{staff.name}</p>
                <StatusBadge status={staff.status} />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{staff.email}</span>
              </div>
              {staff.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Joined {new Date(staff.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Access */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Access
            </CardTitle>
            <CardDescription>
              Stores this staff member can access and their permission levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staff.stores.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Shield className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No store access configured
                </p>
                <Link href={`/owner/staff/${staff.id}/edit`}>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add Store Access
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {staff.stores.map((access) => (
                  <div
                    key={access.storeId}
                    className="flex items-center justify-between rounded-lg border bg-muted/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{access.storeName}</p>
                        {access.storeSlug && (
                          <p className="text-xs text-muted-foreground">
                            {access.storeSlug}.framextech.com
                          </p>
                        )}
                      </div>
                    </div>
                    <PermissionBadge permission={access.permission} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permission Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Permission Levels Explained</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                VIEW
              </span>
              <div>
                <p className="font-medium text-sm">View Only</p>
                <p className="text-xs text-muted-foreground">
                  Can view products, orders, customers, and analytics but cannot
                  make any changes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                EDIT
              </span>
              <div>
                <p className="font-medium text-sm">Edit Access</p>
                <p className="text-xs text-muted-foreground">
                  Can create and edit products, manage orders, update inventory,
                  but cannot delete critical data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                FULL
              </span>
              <div>
                <p className="font-medium text-sm">Full Access</p>
                <p className="text-xs text-muted-foreground">
                  Full access to all store features except store deletion,
                  subscription changes, and adding other staff
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
