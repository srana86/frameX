import type { Metadata } from "next";
import { requireAuth } from "@/lib/store-auth-helpers";
import { StaffListClient } from "./StaffListClient";
import { prisma } from "@framex/database";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Staff Management",
  description: "Manage staff accounts and store access",
};

/**
 * Fetch staff members and their store access
 */
async function getStaffData(userId: string) {
  // Get owner profile
  const owner = await prisma.storeOwner.findUnique({
    where: { userId },
    include: {
      stores: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!owner) {
    return { staff: [], stores: [] };
  }

  const storeIds = owner.stores.map((s) => s.tenantId);

  // Get all staff with access to owner's stores
  const staffAccess = await prisma.staffStoreAccess.findMany({
    where: {
      storeId: { in: storeIds },
    },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      },
      store: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Group staff by user ID
  const staffMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      status: string;
      createdAt: Date;
      stores: Array<{
        storeId: string;
        storeName: string;
        permission: string;
      }>;
    }
  >();

  staffAccess.forEach((access) => {
    const existing = staffMap.get(access.staffId);
    if (existing) {
      existing.stores.push({
        storeId: access.storeId,
        storeName: access.store.name,
        permission: access.permission,
      });
    } else {
      staffMap.set(access.staffId, {
        id: access.staff.id,
        name: access.staff.name,
        email: access.staff.email,
        status: access.staff.status,
        createdAt: access.staff.createdAt,
        stores: [
          {
            storeId: access.storeId,
            storeName: access.store.name,
            permission: access.permission,
          },
        ],
      });
    }
  });

  const staff = Array.from(staffMap.values());
  const stores = owner.stores.map((s) => ({
    id: s.tenant.id,
    name: s.tenant.name,
    slug: s.tenant.slug,
    status: s.tenant.status,
  }));

  return { staff, stores };
}

/**
 * Staff Management Page
 */
export default async function StaffPage() {
  const user = await requireAuth("owner");

  const { staff, stores } = await getStaffData(user.id);

  return <StaffListClient initialStaff={staff} stores={stores} />;
}
