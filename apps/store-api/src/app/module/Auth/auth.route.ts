import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { AuthControllers } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { tenantMiddleware } from "../../middlewares/tenant";

const router = express.Router();

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

// Logout user
router.post("/logout", tenantMiddleware, AuthControllers.logout);

// Refresh Token
router.post("/refresh-token", tenantMiddleware, AuthControllers.refreshToken);

// Get current user (protected route)
router.get("/me", auth(), tenantMiddleware, AuthControllers.getMe);

// Google OAuth callback
router.get("/google", tenantMiddleware, AuthControllers.googleAuth);

// Change password (protected route)
router.post(
  "/change-password",
  auth(),
  tenantMiddleware,
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthControllers.changePassword
);

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

export const AuthRoutes = router;
