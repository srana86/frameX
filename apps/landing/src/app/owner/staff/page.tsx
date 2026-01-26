import type { Metadata } from "next";
import { StaffListClient } from "./StaffListClient";
import { api } from "@/lib/api-client";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Staff Management",
  description: "Manage staff accounts and store access",
};

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  stores: Array<{
    storeId: string;
    storeName: string;
    permission: string;
  }>;
}

interface Store {
  id: string;
  name: string;
  slug: string | null;
  status: string;
}

/**
 * Fetch staff members from backend API
 */
async function getStaffData() {
  try {
    // Get cookies to pass auth
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const [staffResponse, storesResponse] = await Promise.all([
      fetch(`${process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1"}/owner/staff`, {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      }),
      fetch(`${process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1"}/owner/staff/stores`, {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      }),
    ]);

    if (!staffResponse.ok || !storesResponse.ok) {
      console.error("Failed to fetch staff data");
      return { staff: [], stores: [] };
    }

    const staffJson = await staffResponse.json();
    const storesJson = await storesResponse.json();

    return {
      staff: (staffJson.data || []) as StaffMember[],
      stores: (storesJson.data || []) as Store[],
    };
  } catch (error) {
    console.error("Error fetching staff data:", error);
    return { staff: [], stores: [] };
  }
}

/**
 * Staff Management Page
 */
export default async function StaffPage() {
  const { staff, stores } = await getStaffData();
  console.log(staff, stores);

  return <StaffListClient initialStaff={staff} stores={stores} />;
}
