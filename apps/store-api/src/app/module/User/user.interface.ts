/* eslint-disable no-unused-vars */
import { Model } from "mongoose";
import { USER_ROLE } from "./user.constant";

export interface TUser {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  password?: string;
  googleId?: string;
  role: "customer" | "merchant" | "admin";
  status?: "in-progress" | "blocked";
  needsPasswordChange?: boolean;
  passwordChangedAt?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserModel extends Model<TUser> {
  //instance methods for checking if the user exist
  isUserExistsByCustomId(id: string): Promise<TUser>;
  isUserExistsByEmail(email: string): Promise<TUser>;
  isUserExistsByPhone(phone: string): Promise<TUser>;
  //instance methods for checking if passwords are matched
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number
  ): boolean;
}

export type TUserRole = keyof typeof USER_ROLE;
