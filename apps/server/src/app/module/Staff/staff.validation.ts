import { z } from "zod";

/**
 * Staff Permission Enum
 */
export const StaffPermissionEnum = z.enum(["VIEW", "EDIT", "FULL"]);

/**
 * Store Assignment Schema
 */
export const storeAssignmentSchema = z.object({
  storeId: z.string().uuid(),
  permission: StaffPermissionEnum,
});

/**
 * Create Staff Validation Schema
 */
export const createStaffValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    storeAssignments: z
      .array(storeAssignmentSchema)
      .min(1, "At least one store assignment is required"),
  }),
});

/**
 * Update Staff Validation Schema
 */
export const updateStaffValidationSchema = z.object({
  params: z.object({
    staffId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  }),
});

/**
 * Staff ID Parameter Validation
 */
export const staffIdParamValidationSchema = z.object({
  params: z.object({
    staffId: z.string().uuid(),
  }),
});

/**
 * Update Staff Store Access Validation Schema
 */
export const updateStaffAccessValidationSchema = z.object({
  params: z.object({
    staffId: z.string().uuid(),
  }),
  body: z.object({
    storeAssignments: z.array(storeAssignmentSchema),
  }),
});

/**
 * Add Store Access Validation Schema
 */
export const addStoreAccessValidationSchema = z.object({
  params: z.object({
    staffId: z.string().uuid(),
  }),
  body: storeAssignmentSchema,
});

/**
 * Remove Store Access Validation Schema
 */
export const removeStoreAccessValidationSchema = z.object({
  params: z.object({
    staffId: z.string().uuid(),
    storeId: z.string().uuid(),
  }),
});
