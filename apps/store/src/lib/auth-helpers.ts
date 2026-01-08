import { getCurrentUser, type CurrentUser } from "./auth";
import { redirect } from "next/navigation";

export type UserRole = "customer" | "merchant" | "admin";

/**
 * Check if user has required role
 */
export function hasRole(user: CurrentUser | null, requiredRole: UserRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    customer: 1,
    merchant: 2,
    admin: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Require authentication and optionally a specific role
 * Redirects to login if not authenticated
 * Redirects to appropriate page if role doesn't match
 */
export async function requireAuth(requiredRole?: UserRole): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    // Redirect based on user's actual role
    if (user.role === "customer") {
      redirect("/account");
    } else if (user.role === "merchant") {
      redirect("/merchant");
    } else if (user.role === "admin") {
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
    case "merchant":
      return "/merchant";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}

