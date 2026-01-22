import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/store-auth-helpers";
import { EditStaffClient } from "./EditStaffClient";
import { prisma } from "@framex/database";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Edit Staff Member",
  description: "Edit staff member details and store access",
};

interface EditStaffPageProps {
  params: Promise<{ staffId: string }>;
}

/**
 * Fetch staff member for editing
 */
async function getStaffForEdit(userId: string, staffId: string) {
  // Get owner's stores
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
    return null;
  }

  const ownerStoreIds = owner.stores.map((s) => s.tenantId);

  // Get staff's access to owner's stores
  const staffAccessList = await prisma.staffStoreAccess.findMany({
    where: {
      staffId,
      storeId: { in: ownerStoreIds },
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (staffAccessList.length === 0) {
    return null;
  }

  // Get staff user details
  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
    },
  });

  if (!staff) {
    return null;
  }

  const ownerStores = owner.stores.map((s) => ({
    id: s.tenant.id,
    name: s.tenant.name,
    slug: s.tenant.slug,
    status: s.tenant.status,
  }));

  return {
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      status: staff.status,
      stores: staffAccessList.map((access) => ({
        storeId: access.storeId,
        storeName: access.store.name,
        permission: access.permission,
      })),
    },
    ownerStores,
  };
}

/**
 * Edit Staff Page
 */
export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const { staffId } = await params;
  const user = await requireAuth("owner");

  const data = await getStaffForEdit(user.id, staffId);

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
