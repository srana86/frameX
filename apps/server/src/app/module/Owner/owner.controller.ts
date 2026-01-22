import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { OwnerServices } from "./owner.service";

// Get current user's store owner profile
const getMyOwnerProfile = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;

    const owner = await OwnerServices.getOwnerByUserId(userId);

    if (!owner) {
        // Fallback: If user is an OWNER but profile is missing, create it automatically
        const user = (req as any).user;
        if (user?.role === "OWNER") {
            const newOwner = await OwnerServices.createOwner({
                userId,
                displayName: user.name || user.email?.split("@")[0],
            });
            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Owner profile created automatically",
                data: newOwner,
            });
        }

        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Store owner profile not found. Please create one first.",
            data: null,
        });
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Owner profile retrieved successfully",
        data: owner,
    });
});

// Create store owner profile for current user
const createOwnerProfile = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;

    const result = await OwnerServices.createOwner({
        userId,
        ...req.body,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Store owner profile created successfully",
        data: result,
    });
});

// Update store owner profile
const updateOwnerProfile = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;

    const owner = await OwnerServices.getOwnerByUserId(userId);

    if (!owner) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Store owner profile not found",
            data: null,
        });
    }

    const result = await OwnerServices.updateOwner(owner.id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Owner profile updated successfully",
        data: result,
    });
});

// Get all stores for current owner
const getMyStores = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;

    const owner = await OwnerServices.getOwnerByUserId(userId);

    if (!owner) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Store owner profile not found",
            data: null,
        });
    }

    const stores = await OwnerServices.getOwnerStores(owner.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stores retrieved successfully",
        data: stores,
    });
});

// Create a new store
const createStore = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;

    if (!userId) {
        return sendResponse(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "Unauthorized",
            data: null,
        });
    }

    const owner = await OwnerServices.getOwnerByUserId(userId);

    if (!owner) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Store owner profile not found. Please create one first.",
            data: null,
        });
    }

    const result = await OwnerServices.createStore({
        ownerId: owner.id,
        ...req.body,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Store created successfully",
        data: result,
    });
});

// Get a specific store
const getStoreById = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;
    const { storeId } = req.params;

    if (!userId) {
        return sendResponse(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "Unauthorized",
            data: null,
        });
    }

    const owner = await OwnerServices.getOwnerByUserId(userId);

    if (!owner) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Store owner profile not found",
            data: null,
        });
    }

    const store = await OwnerServices.getStoreById(owner.id, storeId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Store retrieved successfully",
        data: store,
    });
});

// Update a store
const updateStore = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;
    const { storeId } = req.params;

    if (!userId) {
        return sendResponse(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "Unauthorized",
            data: null,
        });
    }

    const owner = await OwnerServices.getOwnerByUserId(userId);

    if (!owner) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Store owner profile not found",
            data: null,
        });
    }

    const result = await OwnerServices.updateStore(owner.id, storeId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Store updated successfully",
        data: result,
    });
});

// Delete a store
const deleteStore = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;
    const { storeId } = req.params;

    if (!userId) {
        return sendResponse(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "Unauthorized",
            data: null,
        });
    }

    const owner = await OwnerServices.getOwnerByUserId(userId);

    if (!owner) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Store owner profile not found",
            data: null,
        });
    }

    const result = await OwnerServices.deleteStore(owner.id, storeId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result,
    });
});

// Get owner invoices
const getMyInvoices = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;

    const owner = await OwnerServices.getOwnerByUserId(userId);

    if (!owner) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Store owner profile not found",
            data: null,
        });
    }

    const invoices = await OwnerServices.getOwnerInvoices(owner.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Invoices retrieved successfully",
        data: invoices,
    });
});

// Soft delete owner account
const deleteMyAccount = catchAsync(async (req, res) => {
    const userId = (req as any).user?.id;

    const result = await OwnerServices.softDeleteOwnerAccount(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const OwnerControllers = {
    getMyOwnerProfile,
    createOwnerProfile,
    updateOwnerProfile,
    getMyStores,
    createStore,
    getStoreById,
    updateStore,
    deleteStore,
    getMyInvoices,
    deleteMyAccount,
};
