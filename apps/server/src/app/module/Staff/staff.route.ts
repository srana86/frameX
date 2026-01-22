import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { StaffControllers } from "./staff.controller";
import {
  createStaffValidationSchema,
  updateStaffValidationSchema,
  staffIdParamValidationSchema,
  updateStaffAccessValidationSchema,
  addStoreAccessValidationSchema,
  removeStoreAccessValidationSchema,
} from "./staff.validation";

const router = express.Router();

/**
 * Staff Management Routes (for Store Owners)
 * Base path: /api/v1/owner/staff
 */

// All routes require authentication as OWNER, ADMIN, or SUPER_ADMIN
router.use(auth("OWNER", "ADMIN", "SUPER_ADMIN"));

// Get all staff members
router.get("/", StaffControllers.getOwnerStaff);

// Get owner's stores (for staff assignment UI)
router.get("/stores", StaffControllers.getOwnerStores);

// Get current user's store access (for staff users)
router.get("/access", StaffControllers.getMyStoreAccess);

// Create a new staff member
router.post(
  "/",
  validateRequest(createStaffValidationSchema),
  StaffControllers.createStaff
);

// Get a specific staff member
router.get(
  "/:staffId",
  validateRequest(staffIdParamValidationSchema),
  StaffControllers.getStaffById
);

// Update a staff member
router.put(
  "/:staffId",
  validateRequest(updateStaffValidationSchema),
  StaffControllers.updateStaff
);

// Delete a staff member (removes all access)
router.delete(
  "/:staffId",
  validateRequest(staffIdParamValidationSchema),
  StaffControllers.deleteStaff
);

// Update staff store access (replace all)
router.put(
  "/:staffId/access",
  validateRequest(updateStaffAccessValidationSchema),
  StaffControllers.updateStaffAccess
);

// Add store access for a staff member
router.post(
  "/:staffId/access",
  validateRequest(addStoreAccessValidationSchema),
  StaffControllers.addStoreAccess
);

// Remove store access for a staff member
router.delete(
  "/:staffId/access/:storeId",
  validateRequest(removeStoreAccessValidationSchema),
  StaffControllers.removeStoreAccess
);

export const StaffRoutes = router;
