import { z } from "zod";
import { USER_ROLE } from "./user.constant";

// Create user validation schema
const createUserValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    fullName: z.string({ message: "Full name is required" }),
    email: z
      .string({ message: "Email must be a valid string" })
      .email({ message: "Invalid email format" })
      .optional(),
    phone: z
      .string({ message: "Phone must be a valid string" })
      .optional(),
    password: z
      .string({ message: "Password is required" })
      .min(6, { message: "Password must be at least 6 characters" })
      .max(50, { message: "Password cannot be more than 50 characters" }),
    role: z
      .enum([USER_ROLE.customer, USER_ROLE.merchant, USER_ROLE.admin] as [
        string,
        ...string[],
      ])
      .optional(),
  }),
});

// Update user validation schema
const updateUserValidationSchema = z.object({
  body: z.object({
    fullName: z
      .string({
        message: "Full name must be string",
      })
      .optional(),
    email: z
      .string({
        message: "Email must be string",
      })
      .email({ message: "Invalid email format" })
      .optional(),
    phone: z
      .string({
        message: "Phone must be string",
      })
      .optional(),
    password: z
      .string({
        message: "Password must be string",
      })
      .min(6, { message: "Password must be at least 6 characters" })
      .max(50, { message: "Password cannot be more than 50 characters" })
      .optional(),
    role: z
      .enum([USER_ROLE.customer, USER_ROLE.merchant, USER_ROLE.admin] as [
        string,
        ...string[],
      ])
      .optional(),
  }),
});

// Change status validation schema
const changeStatusValidationSchema = z.object({
  body: z.object({
    needsPasswordChange: z.boolean().optional(),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
  changeStatusValidationSchema,
};
