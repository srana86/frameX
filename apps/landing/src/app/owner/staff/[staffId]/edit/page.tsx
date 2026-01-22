import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditStaffClient } from "./EditStaffClient";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Edit Staff Member",
  description: "Edit staff member details and store access",
};

interface EditStaffPageProps {
  params: Promise<{ staffId: string }>;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
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
 * Fetch staff member for editing from backend API
 */
async function getStaffForEdit(staffId: string) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const [staffResponse, storesResponse] = await Promise.all([
      fetch(
        `${process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1"}/owner/staff/${staffId}`,
        {
          headers: { Cookie: cookieHeader },
          cache: "no-store",
        }
      ),
      fetch(
        `${process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1"}/owner/staff/stores`,
        {
          headers: { Cookie: cookieHeader },
          cache: "no-store",
        }
      ),
    ]);

    if (!staffResponse.ok) {
      return null;
    }

    const staffJson = await staffResponse.json();
    const storesJson = storesResponse.ok ? await storesResponse.json() : { data: [] };

    return {
      staff: staffJson.data as StaffMember,
      ownerStores: (storesJson.data || []) as Store[],
    };
  } catch (error) {
    console.error("Error fetching staff for edit:", error);
    return null;
  }
}

/**
 * Edit Staff Page
 */
export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const { staffId } = await params;

  const data = await getStaffForEdit(staffId);

  if (!data) {
    notFound();
  }

  return (
    <EditStaffClient
      staff={data.staff}
      ownerStores={data.ownerStores}
    />
  );
}
