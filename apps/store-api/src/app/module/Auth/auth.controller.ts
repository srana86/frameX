import { StatusCodes } from "http-status-codes";
import { Response, Request } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";
import config from "../../../config";
import AppError from "../../errors/AppError";

// Login user
const login = catchAsync(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Tenant ID is missing");
  }
  const result = await AuthServices.loginUser(req.tenantId, req.body);

  // Set httpOnly cookie
  res.cookie("auth_token", result.accessToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Set refresh token cookie
  res.cookie("refresh_token", result.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken, // Included as per request
    },
  });
});

// Register user
const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.registerUser(req.tenantId, req.body);

  // Set httpOnly cookie
  res.cookie("auth_token", result.accessToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Set refresh token cookie
  res.cookie("refresh_token", result.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User registered successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

// Logout user
const logout = catchAsync(async (req: Request, res: Response) => {
  // Clear both auth token and refresh token cookies
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Logout successful",
    data: null,
  });
});

// Get current user
const getMe = catchAsync(async (req: Request, res: Response) => {
  // userId should be attached by auth middleware
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const result = await AuthServices.getCurrentUser(req.tenantId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

// Google OAuth callback
const googleAuth = catchAsync(async (req: Request, res: Response) => {
  const { code, redirectUri } = req.query;

  if (!code) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Authorization code is required"
    );
  }

  if (!redirectUri) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Redirect URI is required");
  }

  try {
    const result = await AuthServices.googleLogin(
      req.tenantId,
      code as string,
      redirectUri as string
    );

    // Set cookie and redirect or send response
    res.cookie("auth_token", result.accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set refresh token cookie
    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Google authentication successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error: any) {
    // Handle not implemented error gracefully
    if (error.statusCode === StatusCodes.NOT_IMPLEMENTED) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_IMPLEMENTED,
        success: false,
        message: error.message,
        data: null,
      });
    } else {
      throw error;
    }
  }
});

// Change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const result = await AuthServices.changePassword(
    req.tenantId,
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

// Forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data:
      process.env.NODE_ENV === "development"
        ? {
            resetToken: result.resetToken,
            resetLink: result.resetLink,
          }
        : null,
  });
});

// Reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.resetPassword(req.tenantId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

// Refresh Token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refresh_token } = req.cookies;

  if (!refresh_token) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Refresh token is missing");
  }

  const result = await AuthServices.refreshToken(refresh_token);

  // Set the new access token as httpOnly cookie
  res.cookie("auth_token", result.accessToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
});

export const AuthControllers = {
  login,
  register,
  logout,
  getMe,
  googleAuth,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
};
