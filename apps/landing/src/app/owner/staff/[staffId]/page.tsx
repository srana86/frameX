import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/store-auth-helpers";
import { StaffDetailClient } from "./StaffDetailClient";
import { prisma } from "@framex/database";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Staff Details",
  description: "View staff member details and store access",
};

interface StaffDetailPageProps {
  params: Promise<{ staffId: string }>;
}

/**
 * Fetch staff member details
 */
async function getStaffDetails(userId: string, staffId: string) {
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
          slug: true,
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
      createdAt: true,
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
      createdAt: staff.createdAt,
      stores: staffAccessList.map((access) => ({
        storeId: access.storeId,
        storeName: access.store.name,
        storeSlug: access.store.slug,
        permission: access.permission,
      })),
    },
    ownerStores,
  };
}

/**
 * Staff Detail Page
 */
export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { staffId } = await params;
  const user = await requireAuth("owner");

  const data = await getStaffDetails(user.id, staffId);

  if (!data) {
    notFound();
  }

  return (
    <StaffDetailClient
      staff={data.staff}
      ownerStores={data.ownerStores}
    />
  );
}
