/**
 * PrismaQueryBuilder - A Prisma-compatible query builder
 * Replaces Mongoose QueryBuilder functionality for store-api
 */

import { PrismaQueryBuilder as BasePrismaQueryBuilder } from "@framex/database";

// Re-export from the shared package
export default BasePrismaQueryBuilder;
export { BasePrismaQueryBuilder as PrismaQueryBuilder };
