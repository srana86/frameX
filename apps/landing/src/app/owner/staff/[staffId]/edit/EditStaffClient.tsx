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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Store,
  Shield,
  Loader2,
  Save,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/utils/cn";

interface StoreAccess {
  storeId: string;
  storeName: string;
  permission: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  stores: StoreAccess[];
}

interface StoreInfo {
  id: string;
  name: string;
  slug?: string | null;
  status: string;
}

interface EditStaffClientProps {
  staff: StaffMember;
  ownerStores: StoreInfo[];
}

type Permission = "VIEW" | "EDIT" | "FULL";

interface StoreAssignment {
  storeId: string;
  storeName: string;
  permission: Permission;
}

/**
 * Edit Staff Client Component
 */
export function EditStaffClient({ staff, ownerStores }: EditStaffClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: staff.name,
    phone: staff.phone || "",
    status: staff.status as "ACTIVE" | "INACTIVE" | "BLOCKED",
  });

  // Store assignments
  const [assignments, setAssignments] = useState<StoreAssignment[]>(
    staff.stores.map((s) => ({
      storeId: s.storeId,
      storeName: s.storeName,
      permission: s.permission as Permission,
    }))
  );

  // Add store assignment
  const addAssignment = (storeId: string) => {
    const store = ownerStores.find((s) => s.id === storeId);
    if (!store) return;
    if (assignments.some((a) => a.storeId === storeId)) return;

    setAssignments([
      ...assignments,
      {
        storeId: store.id,
        storeName: store.name,
        permission: "VIEW",
      },
    ]);
  };

  // Remove store assignment
  const removeAssignment = (storeId: string) => {
    setAssignments(assignments.filter((a) => a.storeId !== storeId));
  };

  // Update permission
  const updatePermission = (storeId: string, permission: Permission) => {
    setAssignments(
      assignments.map((a) =>
        a.storeId === storeId ? { ...a, permission } : a
      )
    );
  };

  // Get available stores (not yet assigned)
  const availableStores = ownerStores.filter(
    (s) => !assignments.some((a) => a.storeId === s.id)
  );

  // Handle save
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsSaving(true);

    try {
      // Update staff details
      await api.patch(`/owner/staff/${staff.id}`, {
        name: formData.name,
        phone: formData.phone || undefined,
        status: formData.status,
      });

      // Update store access
      await api.put(`/owner/staff/${staff.id}/access`, {
        storeAssignments: assignments.map((a) => ({
          storeId: a.storeId,
          permission: a.permission,
        })),
      });

      toast.success("Staff member updated successfully");
      router.push(`/owner/staff/${staff.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update staff member");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/owner/staff/${staff.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Staff Member</h1>
          <p className="text-muted-foreground">
            Update details and store access for {staff.name}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the staff member&apos;s account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={staff.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as "ACTIVE" | "INACTIVE" | "BLOCKED",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <span className="text-green-600">Active</span>
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <span className="text-gray-600">Inactive</span>
                    </SelectItem>
                    <SelectItem value="BLOCKED">
                      <span className="text-red-600">Blocked</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Store Access</CardTitle>
            <CardDescription>
              Manage which stores this staff member can access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Store */}
            {availableStores.length > 0 && (
              <div className="flex gap-2">
                <Select onValueChange={addAssignment}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add store access..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          {store.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Assigned Stores */}
            {assignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-8 text-center">
                <Shield className="mx-auto h-8 w-8 text-destructive/50" />
                <p className="mt-2 text-sm text-destructive">
                  Warning: Saving with no store access will remove this staff
                  member&apos;s ability to access any of your stores.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.storeId}
                    className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Store className="h-5 w-5 text-primary" />
                      <p className="font-medium">{assignment.storeName}</p>
                    </div>

                    <Select
                      value={assignment.permission}
                      onValueChange={(value) =>
                        updatePermission(assignment.storeId, value as Permission)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEW">
                          <span className="text-blue-600">View Only</span>
                        </SelectItem>
                        <SelectItem value="EDIT">
                          <span className="text-yellow-600">Edit Access</span>
                        </SelectItem>
                        <SelectItem value="FULL">
                          <span className="text-green-600">Full Access</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAssignment(assignment.storeId)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Permission Info */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Permission Levels</h4>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-blue-600">VIEW:</span>
                  <span>Can view data but cannot make any changes</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-yellow-600">EDIT:</span>
                  <span>
                    Can create and edit items but cannot delete critical data
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-green-600">FULL:</span>
                  <span>
                    Full access except store deletion and subscription changes
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/owner/staff/${staff.id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
