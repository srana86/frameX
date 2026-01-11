import { JwtPayload } from "jsonwebtoken";

export interface TLoginPayload {
  method: "email" | "phone";
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
}

export interface TRegisterPayload {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  role?: "customer" | "merchant" | "admin";
}

export interface TJwtPayload extends JwtPayload {
  userId: string;
  role: string;
  tenantId: string;
}

export interface TChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface TForgotPasswordPayload {
  email?: string;
  phone?: string;
}

export interface TResetPasswordPayload {
  token: string;
  newPassword: string;
}
