/* eslint-disable no-unused-vars */
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

export type TUserRole = keyof typeof USER_ROLE;
