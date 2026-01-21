import express from "express";
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

export const OwnerRoutes = router;
