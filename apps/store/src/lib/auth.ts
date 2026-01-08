import { cookies } from "next/headers";
import { serverSideApiClient } from "./api-client";

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

    const client = serverSideApiClient(token);
    const response = await client.get("/auth/me");

    if (response.data && response.data.success !== false) {
      // Backend might return user directly or inside a user property
      const userData = response.data.user || response.data;
      return {
        id: userData.id || userData._id,
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role || "customer",
        merchantId: userData.merchantId,
        createdAt: userData.createdAt,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting current user from backend:", error);
    return null;
  }
}
