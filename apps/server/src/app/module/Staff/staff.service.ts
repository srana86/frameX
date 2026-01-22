import { prisma } from "@framex/database";
import bcrypt from "bcrypt";

export type StaffPermission = "VIEW" | "EDIT" | "FULL";

export interface IStaffCreate {
  name: string;
  email: string;
  password: string;
  phone?: string;
  storeAssignments: Array<{
    storeId: string;
    permission: StaffPermission;
  }>;
}

export interface IStaffUpdate {
  name?: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

/**
 * Get all staff members for an owner
 * Returns staff who have access to any of the owner's stores
 */
const getOwnerStaff = async (userId: string) => {
  // Get owner's stores
  const owner = await prisma.storeOwner.findUnique({
    where: { userId },
    include: {
      stores: {
        select: { tenantId: true },
      },
    },
  });

  if (!owner) {
    throw new Error("Owner profile not found");
  }

  const storeIds = owner.stores.map((s) => s.tenantId);

  // Get all staff with access to these stores
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
          phone: true,
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

  // Group by staff member
  const staffMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      phone: string | null;
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
        phone: access.staff.phone,
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

  return Array.from(staffMap.values());
};

/**
 * Get a specific staff member's details
 */
const getStaffById = async (userId: string, staffId: string) => {
  // Verify the owner has at least one store the staff has access to
  const owner = await prisma.storeOwner.findUnique({
    where: { userId },
    include: {
      stores: {
        select: { tenantId: true },
      },
    },
  });

  if (!owner) {
    throw new Error("Owner profile not found");
  }

  const ownerStoreIds = owner.stores.map((s) => s.tenantId);

  // Check if staff has access to any of owner's stores
  const staffAccess = await prisma.staffStoreAccess.findFirst({
    where: {
      staffId,
      storeId: { in: ownerStoreIds },
    },
  });

  if (!staffAccess) {
    throw new Error("Staff member not found or not accessible");
  }

  // Get full staff details
  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      staffStoreAccess: {
        where: {
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
      },
    },
  });

  if (!staff) {
    throw new Error("Staff member not found");
  }

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    status: staff.status,
    createdAt: staff.createdAt,
    stores: staff.staffStoreAccess.map((access) => ({
      storeId: access.storeId,
      storeName: access.store.name,
      permission: access.permission,
    })),
  };
};

/**
 * Create a new staff member
 */
const createStaff = async (userId: string, data: IStaffCreate) => {
  // Verify owner and get their stores
  const owner = await prisma.storeOwner.findUnique({
    where: { userId },
    include: {
      stores: {
        select: { tenantId: true },
      },
    },
  });

  if (!owner) {
    throw new Error("Owner profile not found");
  }

  const ownerStoreIds = owner.stores.map((s) => s.tenantId);

  // Verify all store assignments are for owner's stores
  const invalidStores = data.storeAssignments.filter(
    (a) => !ownerStoreIds.includes(a.storeId)
  );

  if (invalidStores.length > 0) {
    throw new Error("You can only assign staff to your own stores");
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user and store access in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create staff user
    const staffUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "STAFF",
        status: "ACTIVE",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create account with password (BetterAuth compatible)
    await tx.account.create({
      data: {
        userId: staffUser.id,
        accountId: staffUser.id,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create store access for each assignment
    await tx.staffStoreAccess.createMany({
      data: data.storeAssignments.map((a) => ({
        staffId: staffUser.id,
        storeId: a.storeId,
        permission: a.permission,
      })),
    });

    return staffUser;
  });

  // Return staff with store access
  return getStaffById(userId, result.id);
};

/**
 * Update staff member details
 */
const updateStaff = async (
  userId: string,
  staffId: string,
  data: IStaffUpdate
) => {
  // Verify access
  await getStaffById(userId, staffId); // This throws if no access

  // Update user
  await prisma.user.update({
    where: { id: staffId },
    data: {
      name: data.name,
      phone: data.phone,
      status: data.status,
      updatedAt: new Date(),
    },
  });

  return getStaffById(userId, staffId);
};

/**
 * Update staff store access (replace all assignments)
 */
const updateStaffAccess = async (
  userId: string,
  staffId: string,
  storeAssignments: Array<{ storeId: string; permission: StaffPermission }>
) => {
  // Verify owner
  const owner = await prisma.storeOwner.findUnique({
    where: { userId },
    include: {
      stores: {
        select: { tenantId: true },
      },
    },
  });

  if (!owner) {
    throw new Error("Owner profile not found");
  }

  const ownerStoreIds = owner.stores.map((s) => s.tenantId);

  // Verify all store assignments are for owner's stores
  const invalidStores = storeAssignments.filter(
    (a) => !ownerStoreIds.includes(a.storeId)
  );

  if (invalidStores.length > 0) {
    throw new Error("You can only assign staff to your own stores");
  }

  // Update in transaction
  await prisma.$transaction(async (tx) => {
    // Remove existing access to owner's stores
    await tx.staffStoreAccess.deleteMany({
      where: {
        staffId,
        storeId: { in: ownerStoreIds },
      },
    });

    // Add new access
    if (storeAssignments.length > 0) {
      await tx.staffStoreAccess.createMany({
        data: storeAssignments.map((a) => ({
          staffId,
          storeId: a.storeId,
          permission: a.permission,
        })),
      });
    }
  });

  return getStaffById(userId, staffId);
};

/**
 * Add store access for a staff member
 */
const addStoreAccess = async (
  userId: string,
  staffId: string,
  storeId: string,
  permission: StaffPermission
) => {
  // Verify owner owns the store
  const owner = await prisma.storeOwner.findUnique({
    where: { userId },
    include: {
      stores: {
        where: { tenantId: storeId },
      },
    },
  });

  if (!owner || owner.stores.length === 0) {
    throw new Error("Store not found or not owned by you");
  }

  // Check if access already exists
  const existing = await prisma.staffStoreAccess.findUnique({
    where: {
      staffId_storeId: {
        staffId,
        storeId,
      },
    },
  });

  if (existing) {
    // Update permission
    await prisma.staffStoreAccess.update({
      where: {
        staffId_storeId: {
          staffId,
          storeId,
        },
      },
      data: { permission },
    });
  } else {
    // Create new access
    await prisma.staffStoreAccess.create({
      data: {
        staffId,
        storeId,
        permission,
      },
    });
  }

  return getStaffById(userId, staffId);
};

/**
 * Remove store access for a staff member
 */
const removeStoreAccess = async (
  userId: string,
  staffId: string,
  storeId: string
) => {
  // Verify owner owns the store
  const owner = await prisma.storeOwner.findUnique({
    where: { userId },
    include: {
      stores: {
        where: { tenantId: storeId },
      },
    },
  });

  if (!owner || owner.stores.length === 0) {
    throw new Error("Store not found or not owned by you");
  }

  // Delete access
  await prisma.staffStoreAccess.delete({
    where: {
      staffId_storeId: {
        staffId,
        storeId,
      },
    },
  });

  // Check if staff still has access to any owner stores
  const remainingAccess = await prisma.staffStoreAccess.findFirst({
    where: {
      staffId,
      storeId: {
        in: owner.stores.map((s) => s.tenantId),
      },
    },
  });

  if (!remainingAccess) {
    return { message: "Staff member no longer has access to any of your stores" };
  }

  return getStaffById(userId, staffId);
};

/**
 * Delete a staff member (removes all access, doesn't delete user)
 */
const deleteStaff = async (userId: string, staffId: string) => {
  // Verify owner
  const owner = await prisma.storeOwner.findUnique({
    where: { userId },
    include: {
      stores: {
        select: { tenantId: true },
      },
    },
  });

  if (!owner) {
    throw new Error("Owner profile not found");
  }

  const ownerStoreIds = owner.stores.map((s) => s.tenantId);

  // Remove all access to owner's stores
  await prisma.staffStoreAccess.deleteMany({
    where: {
      staffId,
      storeId: { in: ownerStoreIds },
    },
  });

  // Check if staff has access to any other stores
  const remainingAccess = await prisma.staffStoreAccess.findFirst({
    where: { staffId },
  });

  // If no remaining access, we could optionally deactivate the account
  if (!remainingAccess) {
    await prisma.user.update({
      where: { id: staffId },
      data: {
        status: "INACTIVE",
        updatedAt: new Date(),
      },
    });
  }

  return { success: true, message: "Staff access removed successfully" };
};

/**
 * Get staff access for current user (for staff users)
 */
const getMyStoreAccess = async (userId: string) => {
  const access = await prisma.staffStoreAccess.findMany({
    where: { staffId: userId },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  return access.map((a) => ({
    storeId: a.storeId,
    storeName: a.store.name,
    storeSlug: a.store.slug,
    storeStatus: a.store.status,
    permission: a.permission,
  }));
};

export const StaffServices = {
  getOwnerStaff,
  getStaffById,
  createStaff,
  updateStaff,
  updateStaffAccess,
  addStoreAccess,
  removeStoreAccess,
  deleteStaff,
  getMyStoreAccess,
};
