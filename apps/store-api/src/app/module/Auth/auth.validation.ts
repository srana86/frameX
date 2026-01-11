import { z } from "zod";
import { USER_ROLE } from "../User/user.constant";

/**
 * Strong password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - Maximum 50 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string({
    required_error: "Password is required",
    invalid_type_error: "Password must be string",
  })
  .min(8, { message: "Password must be at least 8 characters" })
  .max(50, { message: "Password cannot be more than 50 characters" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/, {
    message: "Password must contain at least one special character",
  });

/**
 * Phone number validation schema
 * Allows international format with optional + prefix
 */
const phoneSchema = z
  .string({
    invalid_type_error: "Phone must be string",
  })
  .min(10, { message: "Phone number must be at least 10 digits" })
  .max(15, { message: "Phone number cannot be more than 15 digits" })
  .regex(/^\+?[0-9]+$/, {
    message: "Phone number can only contain digits and optional + prefix",
  })
  .optional();

/**
 * Email validation schema with normalization
 */
const emailSchema = z
  .string({
    invalid_type_error: "Email must be string",
  })
  .email({ message: "Invalid email format" })
  .max(255, { message: "Email cannot be more than 255 characters" })
  .transform((val) => val.toLowerCase().trim())
  .optional();

// Login validation schema
const loginValidationSchema = z.object({
  body: z
    .object({
      method: z.enum(["email", "phone"], {
        required_error: "Method is required",
        invalid_type_error: "Method must be either 'email' or 'phone'",
      }),
      email: emailSchema,
      phone: phoneSchema,
      password: z
        .string({
          required_error: "Password is required",
          invalid_type_error: "Password must be string",
        })
        .min(1, { message: "Password is required" }),
      rememberMe: z.boolean().optional(),
    })
    .refine(
      (data) => {
        if (data.method === "email") {
          return !!data.email;
        }
        if (data.method === "phone") {
          return !!data.phone;
        }
        return false;
      },
      {
        message: "Email or phone is required based on method",
      }
    ),
});

// Register validation schema
const registerValidationSchema = z.object({
  body: z
    .object({
      fullName: z
        .string({
          required_error: "Full name is required",
          invalid_type_error: "Full name must be string",
        })
        .min(2, { message: "Full name must be at least 2 characters" })
        .max(100, { message: "Full name cannot be more than 100 characters" })
        .transform((val) => val.trim()),
      email: emailSchema,
      phone: phoneSchema,
      password: passwordSchema,
      role: z
        .enum([USER_ROLE.customer, USER_ROLE.merchant, USER_ROLE.admin] as [
          string,
          ...string[],
        ])
        .optional()
        .default(USER_ROLE.customer),
    })
    .refine(
      (data) => {
        return !!(data.email || data.phone);
      },
      {
        message: "Either email or phone must be provided",
      }
    ),
});

// Change password validation schema
const changePasswordValidationSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({
        required_error: "Current password is required",
        invalid_type_error: "Current password must be string",
      })
      .min(1, { message: "Current password is required" }),
    newPassword: passwordSchema,
  }),
});

// Forgot password validation schema
const forgotPasswordValidationSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      phone: phoneSchema,
    })
    .refine(
      (data) => {
        return !!(data.email || data.phone);
      },
      {
        message: "Either email or phone must be provided",
      }
    ),
});

// Reset password validation schema
const resetPasswordValidationSchema = z.object({
  body: z.object({
    token: z
      .string({
        required_error: "Reset token is required",
        invalid_type_error: "Token must be string",
      })
      .min(1, { message: "Reset token is required" }),
    newPassword: passwordSchema,
  }),
});

export const AuthValidation = {
  loginValidationSchema,
  registerValidationSchema,
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  passwordSchema,
};
