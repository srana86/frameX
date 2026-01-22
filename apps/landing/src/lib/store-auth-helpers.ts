/**
 * Store Access Authentication Helpers
 * Server-side utilities for verifying store access and permissions
 */

import { getCurrentUser, type CurrentUser } from "./auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

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
 * Verify store access for a user via backend API
 * Returns access information including permission level
 */
export async function verifyStoreAccess(
  userId: string,
  storeId: string
): Promise<StoreAccessInfo> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1"}/store-access/${storeId}`,
      {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        hasAccess: false,
        permission: null,
        isOwner: false,
      };
    }

    const json = await response.json();
    return json.data as StoreAccessInfo;
  } catch (error) {
    console.error("Error verifying store access:", error);
    return {
      hasAccess: false,
      permission: null,
      isOwner: false,
    };
  }
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
 * Get all stores a user has access to via backend API
 */
export async function getUserStores(userId: string): Promise<
  Array<{
    storeId: string;
    storeName: string;
    storeSlug?: string | null;
    permission: StaffPermission | null;
    isOwner: boolean;
  }>
> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1"}/store-access/my-stores`,
      {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return [];
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching user stores:", error);
    return [];
  }
}
