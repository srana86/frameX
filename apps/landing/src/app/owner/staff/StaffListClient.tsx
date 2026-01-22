"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Store,
  Shield,
  MoreHorizontal,
  UserPlus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
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
  status: string;
  createdAt: string | Date;
  stores: StoreAccess[];
}

interface StoreInfo {
  id: string;
  name: string;
  slug?: string | null;
  status: string;
}

interface StaffListClientProps {
  initialStaff: StaffMember[];
  stores: StoreInfo[];
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

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors[permission] || "bg-gray-100 text-gray-700"
      )}
    >
      {permission}
    </span>
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        colors[status] || "bg-gray-100 text-gray-700"
      )}
    >
      {status}
    </span>
  );
}

/**
 * Staff List Client Component
 */
export function StaffListClient({
  initialStaff,
  stores,
}: StaffListClientProps) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string | null>(
    null
  );

  // Filter staff based on search and store filter
  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStore =
      !selectedStoreFilter ||
      member.stores.some((s) => s.storeId === selectedStoreFilter);

    return matchesSearch && matchesStore;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Create and manage staff accounts for your stores
          </p>
        </div>
        <Link href="/owner/staff/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={selectedStoreFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStoreFilter(null)}
              >
                All Stores
              </Button>
              {stores.map((store) => (
                <Button
                  key={store.id}
                  variant={
                    selectedStoreFilter === store.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedStoreFilter(store.id)}
                  className="whitespace-nowrap"
                >
                  <Store className="mr-2 h-3 w-3" />
                  {store.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {staff.length === 0
                ? "No staff members yet"
                : "No matching staff found"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {staff.length === 0
                ? "Add staff members to help manage your stores"
                : "Try adjusting your search or filter"}
            </p>
            {staff.length === 0 && (
              <Link href="/owner/staff/new">
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Your First Staff Member
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
            <CardDescription>
              Manage staff access to your stores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Store Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <StatusBadge status={member.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.stores.map((access) => (
                          <div
                            key={access.storeId}
                            className="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs"
                          >
                            <Store className="h-3 w-3" />
                            <span className="font-medium">
                              {access.storeName}
                            </span>
                            <PermissionBadge permission={access.permission} />
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/owner/staff/${member.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/owner/staff/${member.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Permission Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Permission Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <PermissionBadge permission="VIEW" />
              <div>
                <p className="font-medium text-sm">View Only</p>
                <p className="text-xs text-muted-foreground">
                  Can view products, orders, and analytics but cannot make
                  changes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PermissionBadge permission="EDIT" />
              <div>
                <p className="font-medium text-sm">Edit Access</p>
                <p className="text-xs text-muted-foreground">
                  Can create and edit products, manage orders, but cannot delete
                  critical data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PermissionBadge permission="FULL" />
              <div>
                <p className="font-medium text-sm">Full Access</p>
                <p className="text-xs text-muted-foreground">
                  Full access to all features except store deletion and
                  subscription changes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
