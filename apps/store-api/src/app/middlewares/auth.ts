import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/tokenGenerateFunction";
import config from "../../config";
import catchAsync from "../utils/catchAsync";
import AppError from "../errors/AppError";
import { TJwtPayload } from "../module/Auth/auth.interface";

const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Get token from cookie or Authorization header
    const token = req.cookies?.auth_token || req.headers.authorization?.replace("Bearer ", "");

    // Check if token exists
    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
    }

    // Verify token
    const decoded = verifyToken(
      token,
      config.jwt_access_secret as string
    ) as TJwtPayload;

    // Check if required roles are specified
    if (requiredRoles.length > 0) {
      const userRole = decoded.role.toLowerCase();
      const allowedRoles = requiredRoles.map((role) => role.toLowerCase());

      if (!allowedRoles.includes(userRole)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to access this resource!"
        );
      }
    }

    // Attach user to request
    req.user = decoded;

    next();
  });
};

export default auth;
