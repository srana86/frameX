import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { OwnerControllers } from "./owner.controller";
import {
    createOwnerValidationSchema,
    updateOwnerValidationSchema,
    createStoreValidationSchema,
    updateStoreValidationSchema,
    storeIdParamValidationSchema,
} from "./owner.validation";

const router = express.Router();

// All owner routes require authentication
router.use(auth("OWNER", "SUPER_ADMIN", "ADMIN"));

// Owner Profile Routes
router.get("/profile", OwnerControllers.getMyOwnerProfile);

router.post(
    "/profile",
    validateRequest(createOwnerValidationSchema),
    OwnerControllers.createOwnerProfile
);

router.put(
    "/profile",
    validateRequest(updateOwnerValidationSchema),
    OwnerControllers.updateOwnerProfile
);

// Owner Stores Routes
router.get("/stores", OwnerControllers.getMyStores);

router.post(
    "/stores",
    validateRequest(createStoreValidationSchema),
    OwnerControllers.createStore
);

router.get(
    "/stores/:storeId",
    validateRequest(storeIdParamValidationSchema),
    OwnerControllers.getStoreById
);

router.put(
    "/stores/:storeId",
    validateRequest(updateStoreValidationSchema),
    OwnerControllers.updateStore
);

router.delete(
    "/stores/:storeId",
    validateRequest(storeIdParamValidationSchema),
    OwnerControllers.deleteStore
);

// Owner Invoices Route
router.get("/invoices", OwnerControllers.getMyInvoices);

// Delete Owner Account (soft delete)
router.delete("/account", OwnerControllers.deleteMyAccount);

export const OwnerRoutes = router;
