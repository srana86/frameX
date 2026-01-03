/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { User } from "../User/user.model";
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
import { USER_ROLE } from "../User/user.constant";
import { ConfigServices } from "../Config/config.service";
import crypto from "crypto";

// Login user
const loginUser = async (payload: TLoginPayload) => {
  const { method, email, phone, password } = payload;

  // Find user based on method
  let user;
  if (method === "email" && email) {
    user = await User.isUserExistsByEmail(email);
  } else if (method === "phone" && phone) {
    user = await User.isUserExistsByPhone(phone);
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
  const isPasswordMatched = await User.isPasswordMatched(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  // Generate JWT token
  const jwtPayload = {
    userId: user.id,
    role: user.role,
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
const registerUser = async (payload: TRegisterPayload) => {
  const { fullName, email, phone, password, role } = payload;

  // Check if user already exists
  if (email) {
    const existingUser = await User.isUserExistsByEmail(email);
    if (existingUser) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "User with this email already exists"
      );
    }
  }

  if (phone) {
    const existingUser = await User.isUserExistsByPhone(phone);
    if (existingUser) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "User with this phone already exists"
      );
    }
  }

  // Generate unique ID
  const id = `U${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  // Create user
  const userData = {
    id,
    fullName,
    email,
    phone,
    password,
    role: role || USER_ROLE.customer,
  };

  const user = await User.create(userData);

  // Generate JWT token for newly registered user
  const jwtPayload = {
    userId: user.id,
    role: user.role,
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
const getCurrentUser = async (userId: string) => {
  const user = await User.findOne({ id: userId, isDeleted: false });

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
  code: string,
  redirectUri: string
): Promise<{ user: any; accessToken: string }> => {
  // Get OAuth config from database
  const oauthConfig = await ConfigServices.getOAuthConfigFromDB();

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

    // 3. Find or create user
    let user = await User.findOne({
      $or: [{ email: userInfo.email?.toLowerCase() }, { googleId: userInfo.id }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = userInfo.id;
        await user.save();
      }
    } else {
      // Create new user
      const id = `U${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      user = await User.create({
        id,
        fullName: userInfo.name || userInfo.email?.split("@")[0] || "User",
        email: userInfo.email?.toLowerCase(),
        googleId: userInfo.id,
        role: USER_ROLE.customer,
        status: "in-progress",
      });
    }

    // 4. Generate JWT token
    const jwtPayload = {
      userId: user.id,
      role: user.role,
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
  userId: string,
  payload: TChangePasswordPayload
) => {
  const { currentPassword, newPassword } = payload;

  // Get user with password
  const user = await User.isUserExistsByCustomId(userId);
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
  const isPasswordMatched = await User.isPasswordMatched(
    currentPassword,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Current password is incorrect"
    );
  }

  // Check if new password is same as current password
  const isSamePassword = await User.isPasswordMatched(
    newPassword,
    user.password
  );

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
  await User.findOneAndUpdate(
    { id: userId },
    {
      password: hashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date(),
    },
    { new: true, runValidators: true }
  );

  return {
    message: "Password changed successfully",
  };
};

// Forgot password - generate reset token
const forgotPassword = async (payload: TForgotPasswordPayload) => {
  const { email, phone } = payload;

  // Find user
  let user;
  if (email) {
    user = await User.isUserExistsByEmail(email);
  } else if (phone) {
    user = await User.isUserExistsByPhone(phone);
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
  await User.findOneAndUpdate(
    { id: user.id },
    {
      resetToken: hashedToken,
      resetTokenExpiry: resetTokenExpiry,
    },
    { new: true }
  );

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
const resetPassword = async (payload: TResetPasswordPayload) => {
  const { token, newPassword } = payload;

  // Hash token to compare with stored token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid reset token
  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: new Date() },
    isDeleted: false,
  }).select("+password +resetToken +resetTokenExpiry");

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
  await User.findOneAndUpdate(
    { id: user.id },
    {
      password: hashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date(),
      $unset: { resetToken: "", resetTokenExpiry: "" },
    },
    { new: true, runValidators: true }
  );

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
