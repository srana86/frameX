import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AssetServices } from "./asset.service";

/**
 * Get all assets for tenant
 */
const getAssets = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
        return sendResponse(res, {
            statusCode: StatusCodes.BAD_REQUEST,
            success: false,
            message: "Tenant identification required",
            data: null,
        });
    }

    const { folder, unused, page, limit } = req.query;
    const result = await AssetServices.getAssets(tenantId, {
        folder: folder as string,
        unused: unused === "true",
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Assets retrieved successfully",
        data: result,
    });
});

/**
 * Get orphaned assets (unused)
 */
const getOrphanedAssets = catchAsync(async (req: Request, res: Response) => {
    const gracePeriodDays = req.query.gracePeriodDays
        ? parseInt(req.query.gracePeriodDays as string)
        : 7;

    const result = await AssetServices.getOrphanedAssets(gracePeriodDays);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Orphaned assets retrieved successfully",
        data: { assets: result, count: result.length },
    });
});

/**
 * Cleanup orphaned assets
 */
const cleanupOrphanedAssets = catchAsync(async (req: Request, res: Response) => {
    const gracePeriodDays = req.body.gracePeriodDays || 7;
    const result = await AssetServices.cleanupOrphanedAssets(gracePeriodDays);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: `Cleanup complete: ${result.deleted} deleted, ${result.failed} failed`,
        data: result,
    });
});

/**
 * Force delete an asset
 */
const deleteAsset = catchAsync(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
        return sendResponse(res, {
            statusCode: StatusCodes.BAD_REQUEST,
            success: false,
            message: "Tenant identification required",
            data: null,
        });
    }

    const { assetId } = req.params;
    const result = await AssetServices.forceDeleteAsset(tenantId, assetId);

    if (!result) {
        return sendResponse(res, {
            statusCode: StatusCodes.NOT_FOUND,
            success: false,
            message: "Asset not found",
            data: null,
        });
    }

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Asset deleted successfully",
        data: result,
    });
});

export const AssetControllers = {
    getAssets,
    getOrphanedAssets,
    cleanupOrphanedAssets,
    deleteAsset,
};
