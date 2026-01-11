import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { UserControllers } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// Get all users with pagination, filter, and search (admin/merchant only)
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "merchant"),
  UserControllers.getAllUsers
);

// Get single user by ID (admin/merchant only)
router.get(
  "/:id",
  tenantMiddleware,
  auth("admin", "merchant"),
  UserControllers.getSingleUser
);

// Create user (admin only - regular users should use auth/register)
router.post(
  "/",
  tenantMiddleware,
  auth("admin"),
  validateRequest(UserValidation.createUserValidationSchema),
  UserControllers.createUser
);

// Update user (admin/merchant only)
router.put(
  "/:id",
  tenantMiddleware,
  auth("admin", "merchant"),
  validateRequest(UserValidation.updateUserValidationSchema),
  UserControllers.updateUser
);

// Delete user (soft delete - admin only)
router.delete(
  "/:id",
  tenantMiddleware,
  auth("admin"),
  UserControllers.deleteUser
);

// Change user status (admin/merchant only)
router.patch(
  "/:id/status",
  tenantMiddleware,
  auth("admin", "merchant"),
  validateRequest(UserValidation.changeStatusValidationSchema),
  UserControllers.changeStatus
);

export const UserRoutes = router;
