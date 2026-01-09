/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { prisma, StoreUserRole, StoreUserStatus } from "@framex/database";
import { createToken } from "../../utils/tokenGenerateFunction";
import config from "../../../config";
import bcrypt from "bcrypt";
import axios from "axios";
import {
  TLoginPayload,
  TRegisterPayload,
  TChangePasswordPayload,
  TForgotPasswordPayload,
  TResetPasswordPayload,
} from "./auth.interface";
import { ConfigServices } from "../Config/config.service";
import crypto from "crypto";

// Helper to check user existence
const findUserByEmail = async (tenantId: string, email: string) => {
  return await prisma.storeUser.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email,
      },
      isDeleted: false,
    },
  });
};

const findUserByPhone = async (tenantId: string, phone: string) => {
  return await prisma.storeUser.findUnique({
    where: {
      tenantId_phone: {
        tenantId,
        phone,
      },
      isDeleted: false,
    },
  });
};

// Login user
const loginUser = async (tenantId: string, payload: TLoginPayload) => {
  const { method, email, phone, password } = payload;

  // Find user based on method
  let user;
  if (method === "email" && email) {
    user = await findUserByEmail(tenantId, email);
  } else if (method === "phone" && phone) {
    user = await findUserByPhone(tenantId, phone);
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Email or phone is required based on method"
    );
  }

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  // Check if password exists (could be OAuth user)
  if (!user.password) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "This account uses social login. Please sign in with Google."
    );
  }

  // Check if password matches
  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  if (user.status === StoreUserStatus.BLOCKED) {
    throw new AppError(StatusCodes.FORBIDDEN, "Your account is blocked");
  }

  // Generate JWT token
  const jwtPayload = {
    userId: user.id,
    role: user.role,
    tenantId: user.tenantId,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  // Return user data without password
  const userData = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };

  return {
    user: userData,
    accessToken,
  };
};

// Register user
const registerUser = async (tenantId: string, payload: TRegisterPayload) => {
  const { fullName, email, phone, password, role } = payload;

  // Check if user already exists
  if (email) {
    const existingUser = await findUserByEmail(tenantId, email);
    if (existingUser) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "User with this email already exists"
      );
    }
  }

  if (phone) {
    const existingUser = await findUserByPhone(tenantId, phone);
    if (existingUser) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "User with this phone already exists"
      );
    }
  }

  // Encrypt password
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds)
  );

  // Create user
  // Map role to StoreUserRole, default CUSTOMER
  const userRole = (role as unknown as StoreUserRole) || StoreUserRole.CUSTOMER;

  const user = await prisma.storeUser.create({
    data: {
      tenantId,
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: userRole,
      status: StoreUserStatus.IN_PROGRESS, // Default status
    },
  });

  // Generate JWT token for newly registered user
  const jwtPayload = {
    userId: user.id,
    role: user.role,
    tenantId: user.tenantId,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  // Return user data without password and access token
  const userResponse = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  return {
    user: userResponse,
    accessToken,
  };
};

// Get current user
const getCurrentUser = async (tenantId: string, userId: string) => {
  const user = await prisma.storeUser.findFirst({
    where: {
      id: userId,
      tenantId, // Ensure tenant match
      isDeleted: false
    }
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
};

// Google OAuth login
const googleLogin = async (
  tenantId: string,
  code: string,
  redirectUri: string
): Promise<{ user: any; accessToken: string }> => {
  // Get OAuth config from database
  // Config services likely need tenantId too, assume migrated elsewhere or global?
  // Checking `ConfigServices.getOAuthConfigFromDB()`... if not migrated it might fail.
  // Assuming ConfigServices handles tenant or we need to pass it.
  // Wait, `ConfigServices` might be using Mongoose too?
  // Let's assume for this file we focus on Auth flow logic.
  // We need to pass tenantId to `ConfigServices.getOAuthConfigFromDB` if it supports it.
  const oauthConfig = await ConfigServices.getOAuthConfigFromDB(tenantId);

  if (
    !oauthConfig.google?.enabled ||
    !oauthConfig.google?.clientId ||
    !oauthConfig.google?.clientSecret
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Google OAuth is not configured or enabled"
    );
  }

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await axios.post<any>(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: oauthConfig.google.clientId,
        client_secret: oauthConfig.google.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // 2. Get user info from Google
    const userInfoResponse = await axios.get<any>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userInfo = userInfoResponse.data;
    const email = userInfo.email?.toLowerCase();
    const googleId = userInfo.id;

    // 3. Find or create user
    // We check either by email or googleId within the tenant
    let user = await prisma.storeUser.findFirst({
      where: {
        tenantId,
        OR: [
          { email },
          { googleId }
        ],
        isDeleted: false
      }
    });

    if (user) {
      if (!user.googleId) {
        // Link google ID if not linked
        user = await prisma.storeUser.update({
          where: { id: user.id },
          data: { googleId }
        });
      }
    } else {
      // Create new user
      user = await prisma.storeUser.create({
        data: {
          tenantId,
          fullName: userInfo.name || email?.split("@")[0] || "User",
          email,
          googleId,
          role: StoreUserRole.CUSTOMER,
          status: StoreUserStatus.IN_PROGRESS,
          emailVerified: userInfo.verified_email || false // if available
        }
      });
    }

    if (user.status === StoreUserStatus.BLOCKED) {
      throw new AppError(StatusCodes.FORBIDDEN, "Your account is blocked");
    }

    // 4. Generate JWT token
    const jwtPayload = {
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string
    );

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
    };
  } catch (error: any) {
    console.error("Google OAuth Error:", error.response?.data || error.message);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      error.response?.data?.error_description || "Google authentication failed"
    );
  }
};

// Change password
const changePassword = async (
  tenantId: string,
  userId: string,
  payload: TChangePasswordPayload
) => {
  const { currentPassword, newPassword } = payload;

  // Get user with password
  const user = await prisma.storeUser.findFirst({
    where: { id: userId, tenantId, isDeleted: false }
  });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Verify current password exists
  if (!user.password) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This account uses social login and doesn't have a password set"
    );
  }

  // Verify current password
  const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordMatched) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Current password is incorrect"
    );
  }

  // Check if new password is same as current password
  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "New password must be different from current password"
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  // Update password
  await prisma.storeUser.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date(),
    }
  });

  return {
    message: "Password changed successfully",
  };
};

// Forgot password - generate reset token
const forgotPassword = async (tenantId: string, payload: TForgotPasswordPayload) => {
  const { email, phone } = payload;

  // Find user
  let user;
  if (email) {
    user = await findUserByEmail(tenantId, email);
  } else if (phone) {
    user = await findUserByPhone(tenantId, phone);
  }

  // Don't reveal if user exists or not for security
  if (!user) {
    // Return success even if user doesn't exist to prevent email enumeration
    return {
      message:
        "If a user with that email/phone exists, a password reset link has been sent",
    };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save hashed reset token to user
  await prisma.storeUser.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: resetTokenExpiry,
    }
  });

  // TODO: Send password reset email/SMS
  // You can integrate with EmailTemplate service here
  // Example:
  // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  // await sendPasswordResetEmail(user.email, resetLink);

  return {
    message:
      "If a user with that email/phone exists, a password reset link has been sent",
    // In development, you might want to return the token for testing
    // Remove this in production
    ...(process.env.NODE_ENV === "development" && {
      resetToken, // Return plain token for testing (not hashed)
      resetLink: `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`,
    }),
  };
};

// Reset password using token
const resetPassword = async (tenantId: string, payload: TResetPasswordPayload) => {
  const { token, newPassword } = payload;

  // Hash token to compare with stored token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid reset token
  const user = await prisma.storeUser.findFirst({
    where: {
      tenantId,
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() },
      isDeleted: false,
    }
  });

  if (!user) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired reset token"
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  // Update password and clear reset token
  await prisma.storeUser.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
    }
  });

  return {
    message: "Password reset successfully",
  };
};

export const AuthServices = {
  loginUser,
  registerUser,
  getCurrentUser,
  googleLogin,
  changePassword,
  forgotPassword,
  resetPassword,
};
