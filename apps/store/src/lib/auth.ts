import { cookies, headers } from "next/headers";
import { authClient } from "./auth-client";

export interface CurrentUser {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: "customer" | "staff" | "tenant" | "admin" | "super_admin";
  tenantId?: string;
  tenantId?: string;
  createdAt: string;
}

/**
 * Get current user from BetterAuth session (server-side)
 * Uses the authClient with manually forwarded cookies/headers
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();

    // Call BetterAuth's getSession via the client, forwarding cookies and headers
    const { data: sessionData } = await authClient.getSession({
      fetchOptions: {
        headers: {
          Cookie: cookieStore.toString(),
          "x-domain": headersList.get("host") || "localhost",
        }
      }
    });

    if (!sessionData?.user) {
      return null;
    }

    const user = sessionData.user;

    // Normalize role to lowercase
    const normalizedRole = ((user as any).role || "CUSTOMER").toLowerCase() as
      | "customer"
      | "staff"
      | "tenant"
      | "admin"
      | "super_admin";

    return {
      id: user.id,
      fullName: user.name || "",
      email: user.email,
      phone: (user as any).phone,
      role: normalizedRole,
      tenantId: (user as any).tenantId,
      tenantId: (user as any).tenantId,
      createdAt: user.createdAt.toString(),
    };
  } catch (error) {
    console.error("Error getting current user from BetterAuth:", error);
    return null;
  }
}
