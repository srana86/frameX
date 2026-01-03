import { z } from "zod";
import { USER_ROLE } from "../User/user.constant";

// Login validation schema
const loginValidationSchema = z.object({
  body: z
    .object({
      method: z.enum(["email", "phone"], {
        required_error: "Method is required",
        invalid_type_error: "Method must be either 'email' or 'phone'",
      }),
      email: z
        .string({
          invalid_type_error: "Email must be string",
        })
        .email({ message: "Invalid email format" })
        .optional(),
      phone: z
        .string({
          invalid_type_error: "Phone must be string",
        })
        .optional(),
      password: z.string({
        required_error: "Password is required",
        invalid_type_error: "Password must be string",
      }),
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
      fullName: z.string({
        required_error: "Full name is required",
        invalid_type_error: "Full name must be string",
      }),
      email: z
        .string({
          invalid_type_error: "Email must be string",
        })
        .email({ message: "Invalid email format" })
        .optional(),
      phone: z
        .string({
          invalid_type_error: "Phone must be string",
        })
        .optional(),
      password: z
        .string({
          required_error: "Password is required",
          invalid_type_error: "Password must be string",
        })
        .min(6, { message: "Password must be at least 6 characters" })
        .max(50, { message: "Password cannot be more than 50 characters" }),
      role: z
        .enum([USER_ROLE.customer, USER_ROLE.merchant, USER_ROLE.admin] as [
          string,
          ...string[],
        ])
        .optional(),
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
    currentPassword: z.string({
      required_error: "Current password is required",
      invalid_type_error: "Current password must be string",
    }),
    newPassword: z
      .string({
        required_error: "New password is required",
        invalid_type_error: "New password must be string",
      })
      .min(6, { message: "New password must be at least 6 characters" })
      .max(50, { message: "New password cannot be more than 50 characters" }),
  }),
});

// Forgot password validation schema
const forgotPasswordValidationSchema = z.object({
  body: z
    .object({
      email: z
        .string({
          invalid_type_error: "Email must be string",
        })
        .email({ message: "Invalid email format" })
        .optional(),
      phone: z
        .string({
          invalid_type_error: "Phone must be string",
        })
        .optional(),
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
    token: z.string({
      required_error: "Reset token is required",
      invalid_type_error: "Token must be string",
    }),
    newPassword: z
      .string({
        required_error: "New password is required",
        invalid_type_error: "New password must be string",
      })
      .min(6, { message: "New password must be at least 6 characters" })
      .max(50, { message: "New password cannot be more than 50 characters" }),
  }),
});

export const AuthValidation = {
  loginValidationSchema,
  registerValidationSchema,
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
};
