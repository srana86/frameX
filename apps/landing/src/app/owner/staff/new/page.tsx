import type { Metadata } from "next";
import { CreateStaffClient } from "./CreateStaffClient";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Add Staff Member",
  description: "Create a new staff account",
};

interface Store {
  id: string;
  name: string;
  slug: string | null;
  status: string;
}

/**
 * Fetch owner's stores from backend API
 */
async function getOwnerStores(): Promise<Store[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1"}/owner/staff/stores`,
      {
        headers: { Cookie: cookieHeader },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch stores");
      return [];
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
}

/**
 * Create Staff Page
 */
export default async function CreateStaffPage() {
  const stores = await getOwnerStores();

  return <CreateStaffClient stores={stores} />;
}
