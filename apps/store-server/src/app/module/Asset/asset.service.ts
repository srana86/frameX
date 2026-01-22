/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import { v2 as cloudinary } from "cloudinary";

// ============================================================
// ASSET CRUD
// ============================================================

/**
 * Create an asset record after Cloudinary upload
 */
const createAsset = async (
    tenantId: string,
    cloudinaryResult: {
        public_id: string;
        secure_url: string;
        url?: string;
        format?: string;
        width?: number;
        height?: number;
        bytes?: number;
        resource_type?: string;
        folder?: string;
    }
) => {
    // Extract folder from public_id if not provided
    const folder = cloudinaryResult.folder ||
        cloudinaryResult.public_id.includes('/')
        ? cloudinaryResult.public_id.split('/').slice(0, -1).join('/')
        : null;

    return prisma.asset.create({
        data: {
            tenantId,
            publicId: cloudinaryResult.public_id,
            url: cloudinaryResult.url || cloudinaryResult.secure_url,
            secureUrl: cloudinaryResult.secure_url,
            folder,
            format: cloudinaryResult.format,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            bytes: cloudinaryResult.bytes,
            resourceType: cloudinaryResult.resource_type || "image",
            refCount: 0,
        },
    });
};

/**
 * Get asset by URL or publicId
 */
const getAssetByUrl = async (tenantId: string, url: string) => {
    return prisma.asset.findFirst({
        where: {
            tenantId,
            OR: [
                { url },
                { secureUrl: url },
                { publicId: url },
            ],
        },
    });
};

/**
 * Get all assets for a tenant
 */
const getAssets = async (tenantId: string, options?: {
    folder?: string;
    unused?: boolean;
    page?: number;
    limit?: number;
}) => {
    const { folder, unused, page = 1, limit = 50 } = options || {};

    const where: any = { tenantId };
    if (folder) where.folder = folder;
    if (unused) where.refCount = 0;

    const [assets, total] = await Promise.all([
        prisma.asset.findMany({
            where,
            include: { references: true },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.asset.count({ where }),
    ]);

    return { assets, total, page, limit };
};

// ============================================================
// REFERENCE MANAGEMENT
// ============================================================

/**
 * Add a reference to an asset (increments refCount)
 */
const addReference = async (
    assetId: string,
    entityType: string,
    entityId: string,
    field: string
) => {
    // Create reference (upsert to handle duplicates)
    await prisma.assetReference.upsert({
        where: {
            assetId_entityType_entityId_field: {
                assetId,
                entityType,
                entityId,
                field,
            },
        },
        update: {}, // No update needed, just ensure it exists
        create: {
            assetId,
            entityType,
            entityId,
            field,
        },
    });

    // Increment refCount and clear markedUnusedAt
    await prisma.asset.update({
        where: { id: assetId },
        data: {
            refCount: { increment: 1 },
            markedUnusedAt: null,
        },
    });
};

/**
 * Remove a reference from an asset (decrements refCount)
 */
const removeReference = async (
    assetId: string,
    entityType: string,
    entityId: string,
    field: string
) => {
    // Delete the reference
    const deleted = await prisma.assetReference.deleteMany({
        where: { assetId, entityType, entityId, field },
    });

    if (deleted.count > 0) {
        // Decrement refCount
        const asset = await prisma.asset.update({
            where: { id: assetId },
            data: { refCount: { decrement: 1 } },
        });

        // If refCount is now 0, mark as unused
        if (asset.refCount <= 0) {
            await prisma.asset.update({
                where: { id: assetId },
                data: {
                    refCount: 0,
                    markedUnusedAt: new Date(),
                },
            });
        }
    }
};

/**
 * Sync references for an entity - compares old URLs with new URLs
 * and updates references accordingly
 */
const syncReferences = async (
    tenantId: string,
    entityType: string,
    entityId: string,
    oldUrls: Record<string, string | string[] | null>,
    newUrls: Record<string, string | string[] | null>
) => {
    // Flatten URLs with their field names
    const flatten = (urls: Record<string, string | string[] | null>): { field: string; url: string }[] => {
        const result: { field: string; url: string }[] = [];
        for (const [field, value] of Object.entries(urls)) {
            if (Array.isArray(value)) {
                value.forEach((url, index) => {
                    if (url) result.push({ field: `${field}[${index}]`, url });
                });
            } else if (value) {
                result.push({ field, url: value });
            }
        }
        return result;
    };

    const oldFlat = flatten(oldUrls);
    const newFlat = flatten(newUrls);

    // Find removed URLs
    for (const old of oldFlat) {
        const stillExists = newFlat.some(n => n.url === old.url && n.field === old.field);
        if (!stillExists) {
            const asset = await getAssetByUrl(tenantId, old.url);
            if (asset) {
                await removeReference(asset.id, entityType, entityId, old.field);
            }
        }
    }

    // Find added URLs
    for (const newItem of newFlat) {
        const wasExisting = oldFlat.some(o => o.url === newItem.url && o.field === newItem.field);
        if (!wasExisting) {
            const asset = await getAssetByUrl(tenantId, newItem.url);
            if (asset) {
                await addReference(asset.id, entityType, entityId, newItem.field);
            }
        }
    }
};

// ============================================================
// CLEANUP
// ============================================================

/**
 * Get orphaned assets (refCount = 0) older than grace period
 */
const getOrphanedAssets = async (gracePeriodDays: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);

    return prisma.asset.findMany({
        where: {
            refCount: 0,
            markedUnusedAt: {
                not: null,
                lte: cutoffDate,
            },
        },
    });
};

/**
 * Delete an asset from Cloudinary and database
 */
const deleteAsset = async (assetId: string) => {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return null;

    // Delete from Cloudinary
    try {
        await cloudinary.uploader.destroy(asset.publicId, {
            resource_type: asset.resourceType as any,
        });
    } catch (error) {
        console.error(`Failed to delete from Cloudinary: ${asset.publicId}`, error);
        // Continue with DB deletion even if Cloudinary fails
    }

    // Delete from database (cascades to references)
    return prisma.asset.delete({ where: { id: assetId } });
};

/**
 * Cleanup orphaned assets
 */
const cleanupOrphanedAssets = async (gracePeriodDays: number = 7) => {
    const orphans = await getOrphanedAssets(gracePeriodDays);
    const results = {
        total: orphans.length,
        deleted: 0,
        failed: 0,
        errors: [] as string[],
    };

    for (const asset of orphans) {
        try {
            await deleteAsset(asset.id);
            results.deleted++;
        } catch (error: any) {
            results.failed++;
            results.errors.push(`${asset.id}: ${error.message}`);
        }
    }

    return results;
};

/**
 * Force delete an asset (bypasses refCount check)
 */
const forceDeleteAsset = async (tenantId: string, assetId: string) => {
    const asset = await prisma.asset.findFirst({
        where: { id: assetId, tenantId },
    });
    if (!asset) return null;
    return deleteAsset(assetId);
};

export const AssetServices = {
    // CRUD
    createAsset,
    getAssetByUrl,
    getAssets,
    // References
    addReference,
    removeReference,
    syncReferences,
    // Cleanup
    getOrphanedAssets,
    deleteAsset,
    cleanupOrphanedAssets,
    forceDeleteAsset,
};
