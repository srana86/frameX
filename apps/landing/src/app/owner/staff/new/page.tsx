import type { Metadata } from "next";
import { requireAuth } from "@/lib/store-auth-helpers";
import { CreateStaffClient } from "./CreateStaffClient";
import { prisma } from "@framex/database";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Add Staff Member",
  description: "Create a new staff account",
};

/**
 * Fetch owner's stores for assignment
 */
async function getOwnerStores(userId: string) {
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
    return [];
  }

  return owner.stores.map((s) => ({
    id: s.tenant.id,
    name: s.tenant.name,
    slug: s.tenant.slug,
    status: s.tenant.status,
  }));
}

/**
 * Create Staff Page
 */
export default async function CreateStaffPage() {
  const user = await requireAuth("owner");

  const stores = await getOwnerStores(user.id);

  return <CreateStaffClient stores={stores} />;
}
