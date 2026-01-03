import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { AuthControllers } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

// Register user
router.post(
  "/register",
  validateRequest(AuthValidation.registerValidationSchema),
  AuthControllers.register
);

// Login user
router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthControllers.login
);

// Logout user
router.post("/logout", AuthControllers.logout);

// Get current user (protected route)
router.get("/me", auth(), AuthControllers.getMe);

// Google OAuth callback
router.get("/google", AuthControllers.googleAuth);

// Change password (protected route)
router.post(
  "/change-password",
  auth(),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthControllers.changePassword
);

// Forgot password
router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthControllers.forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthControllers.resetPassword
);

export const AuthRoutes = router;
