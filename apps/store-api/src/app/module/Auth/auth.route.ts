import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { AuthControllers } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { tenantMiddleware } from "../../middlewares/tenant";

const router = express.Router();

// Public routes (no auth required)

// Register user
router.post(
  "/register",
  tenantMiddleware,
  validateRequest(AuthValidation.registerValidationSchema),
  AuthControllers.register
);

// Login user
router.post(
  "/login",
  tenantMiddleware,
  validateRequest(AuthValidation.loginValidationSchema),
  AuthControllers.login
);

// Google OAuth callback
router.get("/google", tenantMiddleware, AuthControllers.googleAuth);

// Forgot password
router.post(
  "/forgot-password",
  tenantMiddleware,
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthControllers.forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  tenantMiddleware,
  validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthControllers.resetPassword
);

// Refresh Token (uses refresh_token cookie, not auth middleware)
router.post("/refresh-token", tenantMiddleware, AuthControllers.refreshToken);

// Protected routes (auth required) - tenantMiddleware MUST come before auth
// so that auth can validate the user belongs to the tenant

// Logout user (protected to ensure we're clearing the right user's tokens)
router.post("/logout", tenantMiddleware, auth(), AuthControllers.logout);

// Get current user
router.get("/me", tenantMiddleware, auth(), AuthControllers.getMe);

// Change password
router.post(
  "/change-password",
  tenantMiddleware,
  auth(),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthControllers.changePassword
);

export const AuthRoutes = router;
