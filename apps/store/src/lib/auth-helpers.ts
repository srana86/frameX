import { getCurrentUser, type CurrentUser } from "./auth";
import { redirect } from "next/navigation";

export type UserRole = "customer" | "staff" | "tenant" | "admin" | "super_admin";

/**
 * Check if user has required role
 */
export function hasRole(
  user: CurrentUser | null,
  requiredRole: UserRole
): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    customer: 1,
    staff: 2,
    tenant: 3,
    admin: 4,
    super_admin: 5,
  };

  // Normalize role to lowercase in case it wasn't normalized earlier
  const userRole = user.role.toLowerCase() as UserRole;
  const normalizedRequiredRole = requiredRole.toLowerCase() as UserRole;

  return (
    (roleHierarchy[userRole] || 0) >=
    (roleHierarchy[normalizedRequiredRole] || 0)
  );
}

/**
 * Require authentication and optionally a specific role
 * Redirects to login if not authenticated
 * Redirects to appropriate page if role doesn't match
 */
export async function requireAuth(
  requiredRole?: UserRole
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    // Redirect based on user's actual role (normalize to lowercase)
    const userRole = user.role.toLowerCase();
    if (userRole === "customer") {
      redirect("/account");
    } else if (userRole === "tenant") {
      redirect("/tenant");
    } else if (userRole === "admin") {
      redirect("/admin");
    }
    redirect("/");
  }

  return user;
}

/**
 * Get redirect URL based on user role
 */
export function getRoleRedirectUrl(role: UserRole): string {
  switch (role) {
    case "customer":
      return "/account";
    case "tenant":
      return "/tenant";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}
