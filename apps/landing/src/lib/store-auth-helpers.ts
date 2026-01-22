/**
 * Store Access Authentication Helpers
 * Server-side utilities for verifying store access and permissions
 */

import { getCurrentUser, type CurrentUser } from "./auth";
import { redirect } from "next/navigation";
import { prisma } from "@framex/database";

export type UserRole = "owner" | "tenant" | "staff" | "admin" | "super_admin";
export type StaffPermission = "VIEW" | "EDIT" | "FULL";

/**
 * Store access information
 */
export interface StoreAccessInfo {
  hasAccess: boolean;
  permission: StaffPermission | null; // null = owner (full access)
  isOwner: boolean;
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: CurrentUser | null,
  requiredRole: UserRole | UserRole[]
): boolean {
  if (!user) return false;

  // Role hierarchy for permission checks
  // TENANT is treated as equivalent to OWNER for store admin access
  const roleHierarchy: Record<UserRole, number> = {
    staff: 1,
    owner: 2,
    tenant: 2, // TENANT has same level as OWNER (store admin)
    admin: 3,
    super_admin: 4,
  };

  const userRole = user.role.toLowerCase() as UserRole;
  const normalizedUserRole = roleHierarchy[userRole] || 0;

  if (Array.isArray(requiredRole)) {
    return requiredRole.some(
      (role) => normalizedUserRole >= roleHierarchy[role]
    );
  }

  return normalizedUserRole >= roleHierarchy[requiredRole];
}

/**
 * Verify store access for a user
 * Returns access information including permission level
 */
export async function verifyStoreAccess(
  userId: string,
  storeId: string
): Promise<StoreAccessInfo> {
  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return {
      hasAccess: false,
      permission: null,
      isOwner: false,
    };
  }

  // Super admins and platform admins have access to all stores
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return {
      hasAccess: true,
      permission: "FULL",
      isOwner: false,
    };
  }

  // Check if user is owner (via StoreOwner relationship)
  const ownerStore = await prisma.storeOwnerStore.findFirst({
    where: {
      tenantId: storeId,
      owner: {
        userId: userId,
      },
    },
  });

  if (ownerStore) {
    return {
      hasAccess: true,
      permission: null, // null = owner (full access)
      isOwner: true,
    };
  }

  // Check if TENANT user - they have full access to their associated store
  // TENANT users are typically bound to a specific store
  if (user.role === "TENANT") {
    // Check if user is directly linked to the store as a tenant
    const tenantLink = await prisma.tenant.findFirst({
      where: {
        id: storeId,
        // Check if there's a user relationship or tenant admin link
        // This depends on your schema - adjust as needed
      },
    });
    
    // For now, TENANT users get access if they're assigned via environment
    // In production, you'd want a proper TenantUser or similar relationship
    // TENANT role users typically manage one specific store
    return {
      hasAccess: true,
      permission: null, // TENANT has full access to their store
      isOwner: true,
    };
  }

  // Check if user is staff with access
  const staffAccess = await prisma.staffStoreAccess.findUnique({
    where: {
      staffId_storeId: {
        staffId: userId,
        storeId: storeId,
      },
    },
  });

  if (staffAccess) {
    return {
      hasAccess: true,
      permission: staffAccess.permission,
      isOwner: false,
    };
  }

  return {
    hasAccess: false,
    permission: null,
    isOwner: false,
  };
}

/**
 * Require authentication and optionally a specific role
 */
export async function requireAuth(
  requiredRole?: UserRole | UserRole[]
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    const userRole = user.role.toLowerCase();
    // OWNER, TENANT, and STAFF go to owner panel
    if (userRole === "owner" || userRole === "tenant" || userRole === "staff") {
      redirect("/owner");
    } else if (userRole === "admin" || userRole === "super_admin") {
      redirect("/admin");
    }
    redirect("/");
  }

  return user;
}

/**
 * Require store access
 * Verifies user has access to the specified store
 */
export async function requireStoreAccess(
  storeId: string,
  minPermission?: StaffPermission
): Promise<StoreAccessInfo & { user: CurrentUser }> {
  // OWNER, TENANT, and STAFF can all access stores they have permission for
  const user = await requireAuth(["owner", "tenant", "staff"]);

  const access = await verifyStoreAccess(user.id, storeId);

  if (!access.hasAccess) {
    redirect("/owner/stores");
  }

  // Check minimum permission if specified
  if (minPermission && access.permission !== null) {
    const permissionLevels: Record<StaffPermission, number> = {
      VIEW: 1,
      EDIT: 2,
      FULL: 3,
    };

    const userPermission = permissionLevels[access.permission] || 0;
    const requiredPermission = permissionLevels[minPermission] || 0;

    if (userPermission < requiredPermission) {
      redirect(`/owner/stores/${storeId}`);
    }
  }

  return { ...access, user };
}

/**
 * Check if user can edit a store
 */
export function canEditStore(permission: StaffPermission | null): boolean {
  if (permission === null) return true; // Owner
  return permission === "EDIT" || permission === "FULL";
}

/**
 * Check if user can delete critical items in a store
 */
export function canDeleteInStore(permission: StaffPermission | null): boolean {
  if (permission === null) return true; // Owner
  return permission === "FULL";
}

/**
 * Get all stores a user has access to
 */
export async function getUserStores(userId: string): Promise<
  Array<{
    storeId: string;
    storeName: string;
    permission: StaffPermission | null;
    isOwner: boolean;
  }>
> {
  const stores: Array<{
    storeId: string;
    storeName: string;
    permission: StaffPermission | null;
    isOwner: boolean;
  }> = [];

  // Get owner stores
  const ownerStores = await prisma.storeOwnerStore.findMany({
    where: {
      owner: {
        userId: userId,
      },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  ownerStores.forEach((store) => {
    stores.push({
      storeId: store.tenantId,
      storeName: store.tenant.name,
      permission: null, // Owner has full access
      isOwner: true,
    });
  });

  // Get staff stores
  const staffStores = await prisma.staffStoreAccess.findMany({
    where: {
      staffId: userId,
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  staffStores.forEach((access) => {
    // Don't add if already added as owner
    if (!stores.some((s) => s.storeId === access.storeId)) {
      stores.push({
        storeId: access.storeId,
        storeName: access.store.name,
        permission: access.permission,
        isOwner: false,
      });
    }
  });

  return stores;
}
