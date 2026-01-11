import { cookies } from "next/headers";
import { getServerClient } from "./server-utils";

export interface CurrentUser {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: "customer" | "merchant" | "admin";
  merchantId?: string;
  createdAt: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return null;
    }

    const client = await getServerClient();
    const response = await client.get("/auth/me");

    if (response.data && response.data.success !== false) {
      // Backend might return user directly or inside a user property or inside data
      const userData =
        response.data.data || response.data.user || response.data;
      // Normalize role to lowercase (backend returns uppercase like "MERCHANT")
      const normalizedRole = (userData.role || "customer").toLowerCase() as
        | "customer"
        | "merchant"
        | "admin";
      return {
        id: userData.id || userData._id,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: normalizedRole,
        merchantId: userData.merchantId || userData.tenantId,
        createdAt: userData.createdAt,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting current user from backend:", error);
    return null;
  }
}
