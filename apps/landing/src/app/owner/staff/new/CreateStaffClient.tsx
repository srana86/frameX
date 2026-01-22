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
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Store,
  Shield,
  Loader2,
  Plus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/utils/cn";

interface StoreInfo {
  id: string;
  name: string;
  slug?: string | null;
  status: string;
}

interface StoreAssignment {
  storeId: string;
  storeName: string;
  permission: "VIEW" | "EDIT" | "FULL";
}

interface CreateStaffClientProps {
  stores: StoreInfo[];
}

/**
 * Create Staff Client Component
 */
export function CreateStaffClient({ stores }: CreateStaffClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  // Store assignments
  const [assignments, setAssignments] = useState<StoreAssignment[]>([]);

  // Add store assignment
  const addAssignment = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
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
  const updatePermission = (
    storeId: string,
    permission: "VIEW" | "EDIT" | "FULL"
  ) => {
    setAssignments(
      assignments.map((a) =>
        a.storeId === storeId ? { ...a, permission } : a
      )
    );
  };

  // Get available stores (not yet assigned)
  const availableStores = stores.filter(
    (s) => !assignments.some((a) => a.storeId === s.id)
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (assignments.length === 0) {
      toast.error("Please assign at least one store");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/owner/staff", {
        ...formData,
        storeAssignments: assignments.map((a) => ({
          storeId: a.storeId,
          permission: a.permission,
        })),
      });

      toast.success("Staff member created successfully");
      router.push("/owner/staff");
    } catch (error: any) {
      toast.error(error.message || "Failed to create staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/owner/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Staff Member</h1>
          <p className="text-muted-foreground">
            Create a new staff account and assign store access
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the staff member&apos;s account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter a secure password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters recommended
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+880 1XXX-XXXXXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Store Access</CardTitle>
            <CardDescription>
              Assign stores and set permission levels for this staff member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Store */}
            {availableStores.length > 0 && (
              <div className="flex gap-2">
                <Select onValueChange={addAssignment}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a store to add..." />
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
              <div className="rounded-lg border border-dashed p-8 text-center">
                <Shield className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No stores assigned yet. Add stores to give this staff member
                  access.
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
                      <div>
                        <p className="font-medium">{assignment.storeName}</p>
                      </div>
                    </div>

                    <Select
                      value={assignment.permission}
                      onValueChange={(value) =>
                        updatePermission(
                          assignment.storeId,
                          value as "VIEW" | "EDIT" | "FULL"
                        )
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
          <Link href="/owner/staff">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Staff Member
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
