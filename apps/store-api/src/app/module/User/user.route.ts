import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// Get all users with pagination, filter, and search
router.get("/", UserControllers.getAllUsers);

// Get single user by ID
router.get("/:id", UserControllers.getSingleUser);

// Create user
router.post(
  "/",
  validateRequest(UserValidation.createUserValidationSchema),
  UserControllers.createUser
);

// Update user
router.put(
  "/:id",
  validateRequest(UserValidation.updateUserValidationSchema),
  UserControllers.updateUser
);

// Delete user (soft delete)
router.delete("/:id", UserControllers.deleteUser);

// Change user status
router.patch(
  "/:id/status",
  validateRequest(UserValidation.changeStatusValidationSchema),
  UserControllers.changeStatus
);

export const UserRoutes = router;
