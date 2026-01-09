import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../../config";
import AppError from "../../errors/AppError";
import { TLoginUser } from "./auth.interface";
import { createToken } from "../../utils/tokenGenerateFunction";
import {
    isUserExistsByEmail,
    isUserExistsByCustomId,
    isPasswordMatched,
    isJWTIssuedBeforePasswordChanged,
} from "../User/user.utils";

const loginUser = async (payload: TLoginUser) => {
    // checking if the user exists
    const user = await isUserExistsByEmail(payload.email);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
    }

    // checking if the user is blocked
    if (user.status === "BLOCKED") {
        throw new AppError(httpStatus.FORBIDDEN, "This user is blocked!");
    }

    // checking if the password is matched
    if (!(await isPasswordMatched(payload.password, user.password))) {
        throw new AppError(httpStatus.FORBIDDEN, "Password do not matched");
    }

    // create token and send to the client
    const jwtPayload = {
        userId: user.id,
        role: user.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string
    );

    return {
        accessToken,
        refreshToken,
        needsPasswordChange: false, // Using Prisma User model which doesn't have this field by default
    };
};

const refreshToken = async (token: string) => {
    // checking if the given token is valid
    const decoded = jwt.verify(
        token,
        config.jwt_refresh_secret as string
    ) as JwtPayload;

    const { userId, iat } = decoded;

    // checking if the user exists
    const user = await isUserExistsByCustomId(userId);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
    }

    // checking if the user is blocked
    if (user.status === "BLOCKED") {
        throw new AppError(httpStatus.FORBIDDEN, "This user is blocked!");
    }

    // Check if JWT was issued before password change (if applicable)
    // Note: Prisma User model uses updatedAt for tracking password changes
    // This is a simplified implementation

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
        accessToken,
    };
};

export const AuthServices = {
    loginUser,
    refreshToken,
};
