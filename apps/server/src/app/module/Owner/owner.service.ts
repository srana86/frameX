import { prisma } from "@framex/database";

export interface IStoreOwnerCreate {
    userId: string;
    displayName?: string;
    companyName?: string;
    phone?: string;
    address?: string;
    billingEmail?: string;
    billingAddress?: string;
    vatNumber?: string;
}

export interface IStoreCreate {
    ownerId: string;
    name: string;
    email: string;
    slug?: string;
    phone?: string;
}

// Get store owner by user ID
const getOwnerByUserId = async (userId: string) => {
    return prisma.storeOwner.findUnique({
        where: { userId },
        include: {
            stores: {
                include: {
                    tenant: {
                        include: {
                            subscriptions: {
                                where: { status: "ACTIVE" },
                                take: 1,
                                include: { plan: true },
                            },
                        },
                    },
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};

// Get store owner by ID
const getOwnerById = async (ownerId: string) => {
    return prisma.storeOwner.findUnique({
        where: { id: ownerId },
        include: {
            stores: {
                include: {
                    tenant: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};

// Create store owner profile for a user
const createOwner = async (data: IStoreOwnerCreate) => {
    // Check if user already has an owner profile
    const existing = await prisma.storeOwner.findUnique({
        where: { userId: data.userId },
    });

    if (existing) {
        throw new Error("User already has a store owner profile");
    }

    return prisma.storeOwner.create({
        data: {
            userId: data.userId,
            displayName: data.displayName,
            companyName: data.companyName,
            phone: data.phone,
            address: data.address,
            billingEmail: data.billingEmail,
            billingAddress: data.billingAddress,
            vatNumber: data.vatNumber,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
};

// Update store owner profile
const updateOwner = async (ownerId: string, data: Partial<IStoreOwnerCreate>) => {
    return prisma.storeOwner.update({
        where: { id: ownerId },
        data: {
            displayName: data.displayName,
            companyName: data.companyName,
            phone: data.phone,
            address: data.address,
            billingEmail: data.billingEmail,
            billingAddress: data.billingAddress,
            vatNumber: data.vatNumber,
        },
    });
};

// Get all stores owned by a store owner
const getOwnerStores = async (ownerId: string) => {
    const stores = await prisma.storeOwnerStore.findMany({
        where: { ownerId },
        include: {
            tenant: {
                include: {
                    subscriptions: {
                        where: { status: "ACTIVE" },
                        take: 1,
                        include: { plan: true },
                    },
                    _count: {
                        select: {
                            orders: true,
                            products: true,
                            customers: true,
                        },
                    },
                },
            },
        },
    });

    return stores.map((store) => {
        const sub = store.tenant.subscriptions[0];
        return {
            id: store.tenant.id,
            name: store.tenant.name,
            slug: store.tenant.slug,
            email: store.tenant.email,
            status: store.tenant.status,
            customDomain: store.tenant.customDomain,
            deploymentUrl: store.tenant.deploymentUrl,
            role: store.role,
            subscription: sub ? {
                ...sub,
                planName: (sub as any).plan?.name
            } : null,
            stats: store.tenant._count,
            createdAt: store.tenant.createdAt,
        };
    });
};

// Create a new store for the owner
const createStore = async (data: IStoreCreate) => {
    // Generate slug if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Create tenant and link to owner in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create the tenant/store
        const tenant = await tx.tenant.create({
            data: {
                name: data.name,
                email: data.email,
                slug,
                phone: data.phone,
                status: "ACTIVE",
            },
        });

        // 2. Create the owner-store link
        const ownerStore = await tx.storeOwnerStore.create({
            data: {
                ownerId: data.ownerId,
                tenantId: tenant.id,
                role: "OWNER",
            },
        });

        // 3. Automated Subdomain Management
        // Detect environment base domain (default to localhost for dev)
        const baseDomain = process.env.BASE_DOMAIN || "localhost";
        const protocol = baseDomain === "localhost" ? "http" : "https";
        const fullDomain = `${slug}.${baseDomain}`;
        const deploymentUrl = `${protocol}://${fullDomain}`;

        // Create the system domain record
        await tx.tenantDomain.create({
            data: {
                tenantId: tenant.id,
                hostname: fullDomain,
                subdomain: slug,
                primaryDomain: fullDomain,
                isPrimary: true,
                verified: true,
                dnsVerified: true,
                status: "ACTIVE",
            },
        });

        // Update tenant with deployment URL
        const updatedTenant = await tx.tenant.update({
            where: { id: tenant.id },
            data: { deploymentUrl },
        });

        return { tenant: updatedTenant, ownerStore };
    });

    return result.tenant;
};

// Get a specific store if owned by the owner
const getStoreById = async (ownerId: string, storeId: string) => {
    const ownerStore = await prisma.storeOwnerStore.findFirst({
        where: {
            ownerId,
            tenantId: storeId,
        },
        include: {
            tenant: {
                include: {
                    subscriptions: {
                        include: { plan: true },
                    },
                    domains: true,
                    _count: {
                        select: {
                            orders: true,
                            products: true,
                            customers: true,
                        },
                    },
                },
            },
        },
    });

    if (!ownerStore) {
        throw new Error("Store not found or not owned by you");
    }

    const { _count, subscriptions, ...tenantData } = ownerStore.tenant;
    const sub = subscriptions[0];

    return {
        ...tenantData,
        stats: _count,
        subscription: sub ? {
            ...sub,
            planName: (sub as any).plan?.name
        } : null,
        role: ownerStore.role,
    };
};

// Update a store owned by the owner
const updateStore = async (
    ownerId: string,
    storeId: string,
    data: { name?: string; slug?: string; phone?: string; customDomain?: string }
) => {
    // Verify ownership
    const ownerStore = await prisma.storeOwnerStore.findFirst({
        where: {
            ownerId,
            tenantId: storeId,
        },
    });

    if (!ownerStore) {
        throw new Error("Store not found or not owned by you");
    }

    return prisma.tenant.update({
        where: { id: storeId },
        data: {
            name: data.name,
            slug: data.slug,
            phone: data.phone,
            customDomain: data.customDomain,
        },
    });
};

// Delete a store (only OWNER role can delete)
const deleteStore = async (ownerId: string, storeId: string) => {
    // Verify ownership with OWNER role
    const ownerStore = await prisma.storeOwnerStore.findFirst({
        where: {
            ownerId,
            tenantId: storeId,
            role: "OWNER",
        },
    });

    if (!ownerStore) {
        throw new Error("Store not found or you don't have permission to delete");
    }

    // Delete in transaction
    await prisma.$transaction([
        prisma.storeOwnerStore.delete({
            where: { id: ownerStore.id },
        }),
        prisma.tenant.delete({
            where: { id: storeId },
        }),
    ]);

    return { success: true, message: "Store deleted successfully" };
};

// Get owner invoices (consolidated view of all store subscriptions)
const getOwnerInvoices = async (ownerId: string) => {
    return prisma.ownerInvoice.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
    });
};

// Soft delete owner account (marks user as deleted, doesn't remove data)
const softDeleteOwnerAccount = async (userId: string) => {
    // Verify the owner exists
    const owner = await prisma.storeOwner.findUnique({
        where: { userId },
        include: { stores: true },
    });

    if (!owner) {
        throw new Error("Store owner profile not found");
    }

    // Soft delete the user account by setting deletedAt and status
    await prisma.user.update({
        where: { id: userId },
        data: {
            deletedAt: new Date(),
            status: "BLOCKED",
        },
    });

    // Invalidate all sessions for this user (ignore errors if none exist)
    try {
        await prisma.session.deleteMany({
            where: { userId },
        });
    } catch (error) {
        // Sessions may already be deleted, that's fine
        console.log(`[softDeleteOwnerAccount] Sessions cleanup: ${error}`);
    }

    return { success: true, message: "Account has been deactivated successfully" };
};

export const OwnerServices = {
    getOwnerByUserId,
    getOwnerById,
    createOwner,
    updateOwner,
    getOwnerStores,
    createStore,
    getStoreById,
    updateStore,
    deleteStore,
    getOwnerInvoices,
    softDeleteOwnerAccount,
};
