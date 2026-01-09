// FrameX Database Package
// Shared Prisma client and utilities for multi-tenant system

export { prisma, default as db } from "./client";

// Re-export all Prisma types
export * from "@prisma/client";

// Tenant-scoped query helpers
export { withTenant, getTenantById, getTenantByDomain } from "./tenant";

// Query Builder for Prisma (replaces Mongoose QueryBuilder)
export { PrismaQueryBuilder, type PaginationMeta, type QueryParams } from "./PrismaQueryBuilder";


// Export Decimal from Prisma namespace
import { Prisma } from "@prisma/client";
export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;
