import { prisma } from "@framex/database";

export type StaffPermission = "VIEW" | "EDIT" | "FULL";

export interface StoreAccessInfo {
  hasAccess: boolean;
  permission: StaffPermission | null;
  isOwner: boolean;
}

/**
 * Verify store access for a user
 * Returns access information including permission level
 */
const verifyStoreAccess = async (
  userId: string,
  storeId: string
): Promise<StoreAccessInfo> => {
  // Get user to check role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return {
      hasAccess: false,
      permission: null,
      isOwner: false,
    };
  }

  // Super admins and platform admins have access to all stores
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return {
      hasAccess: true,
      permission: "FULL",
      isOwner: false,
    };
  }

  // Check if user is owner (via StoreOwner relationship)
  const ownerStore = await prisma.storeOwnerStore.findFirst({
    where: {
      tenantId: storeId,
      owner: {
        userId: userId,
      },
    },
  });

  if (ownerStore) {
    return {
      hasAccess: true,
      permission: null, // null = owner (full access)
      isOwner: true,
    };
  }

  // Check if TENANT user - they have full access to their associated store
  if (user.role === "TENANT") {
    // TENANT role users typically manage one specific store
    return {
      hasAccess: true,
      permission: null, // TENANT has full access to their store
      isOwner: true,
    };
  }

  // Check if user is staff with access
  const staffAccess = await prisma.staffStoreAccess.findUnique({
    where: {
      staffId_storeId: {
        staffId: userId,
        storeId: storeId,
      },
    },
  });

  if (staffAccess) {
    return {
      hasAccess: true,
      permission: staffAccess.permission,
      isOwner: false,
    };
  }

  return {
    hasAccess: false,
    permission: null,
    isOwner: false,
  };
};

/**
 * Get all stores a user has access to
 */
const getUserStores = async (
  userId: string
): Promise<
  Array<{
    storeId: string;
    storeName: string;
    storeSlug: string | null;
    permission: StaffPermission | null;
    isOwner: boolean;
  }>
> => {
  const stores: Array<{
    storeId: string;
    storeName: string;
    storeSlug: string | null;
    permission: StaffPermission | null;
    isOwner: boolean;
  }> = [];

  // Get owner stores
  const ownerStores = await prisma.storeOwnerStore.findMany({
    where: {
      owner: {
        userId: userId,
      },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  ownerStores.forEach((store) => {
    stores.push({
      storeId: store.tenantId,
      storeName: store.tenant.name,
      storeSlug: store.tenant.slug,
      permission: null, // Owner has full access
      isOwner: true,
    });
  });

  // Get staff stores
  const staffStores = await prisma.staffStoreAccess.findMany({
    where: {
      staffId: userId,
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

  staffStores.forEach((access) => {
    // Don't add if already added as owner
    if (!stores.some((s) => s.storeId === access.storeId)) {
      stores.push({
        storeId: access.storeId,
        storeName: access.store.name,
        storeSlug: access.store.slug,
        permission: access.permission,
        isOwner: false,
      });
    }
  });

  return stores;
};

export const StoreAccessServices = {
  verifyStoreAccess,
  getUserStores,
};
