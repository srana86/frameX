/**
 * PrismaQueryBuilder - A Prisma-compatible query builder similar to Mongoose QueryBuilder
 * Provides search, filter, sort, and pagination functionality for Prisma queries
 */

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type QueryParams = {
  searchTerm?: string;
  sort?: string;
  limit?: number | string;
  page?: number | string;
  fields?: string;
  [key: string]: unknown;
};

export type PrismaModel = {
  findMany: (args?: any) => Promise<any[]>;
  count: (args?: any) => Promise<number>;
};

interface QueryBuilderOptions<T> {
  model: PrismaModel;
  query: QueryParams;
  searchFields?: string[];
  defaultSort?: string;
}

/**
 * PrismaQueryBuilder for building complex queries with pagination, search, filter, and sort
 *
 * @example
 * const builder = new PrismaQueryBuilder({
 *   model: prisma.user,
 *   query: req.query,
 *   searchFields: ['name', 'email'],
 * });
 * const result = await builder
 *   .addBaseWhere({ tenantId, isDeleted: false })
 *   .search()
 *   .filter()
 *   .sort()
 *   .execute();
 */
export class PrismaQueryBuilder<T = any> {
  private model: PrismaModel;
  private query: QueryParams;
  private searchFields: string[];
  private defaultSort: string;

  private whereConditions: Record<string, any> = {};
  private orderBy: Record<string, "asc" | "desc">[] = [];
  private skip = 0;
  private take = 10;
  private selectFields: Record<string, boolean> | undefined;
  private includeFields: Record<string, any> | undefined;

  constructor(options: QueryBuilderOptions<T>) {
    this.model = options.model;
    this.query = options.query;
    this.searchFields = options.searchFields || [];
    this.defaultSort = options.defaultSort || "-createdAt";
  }

  /**
   * Add base where conditions (e.g., tenantId, isDeleted)
   */
  addBaseWhere(conditions: Record<string, any>): this {
    this.whereConditions = { ...this.whereConditions, ...conditions };
    return this;
  }

  /**
   * Add search functionality - searches across specified fields
   */
  search(fields?: string[]): this {
    const searchTerm = (this.query?.searchTerm || this.query?.q) as string;
    const searchFields = fields || this.searchFields;

    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map((field) => {
        // Handle nested fields (e.g., 'customer.fullName')
        const parts = field.split(".");
        if (parts.length === 1) {
          return {
            [field]: {
              contains: searchTerm as string,
              mode: "insensitive" as const,
            },
          };
        } else {
          // Build nested object for Prisma
          let obj: Record<string, any> = {
            contains: searchTerm as string,
            mode: "insensitive" as const,
          };
          for (let i = parts.length - 1; i >= 0; i--) {
            obj = { [parts[i]]: i === parts.length - 1 ? obj : { ...obj } };
          }
          return obj;
        }
      });

      this.whereConditions = {
        ...this.whereConditions,
        OR: searchConditions,
      };
    }

    return this;
  }

  /**
   * Add filter functionality - filters by query parameters
   */
  filter(): this {
    const queryObj = { ...this.query };
    const excludedFields = [
      "searchTerm",
      "sort",
      "sortBy",
      "sortOrder",
      "order",
      "limit",
      "page",
      "fields",
      "enabled", // Legacy field - use isActive instead
      "newest", // UI filter - not a DB field
      "popular", // UI filter - not a DB field
      "featured", // Handled separately
      "q", // Search term alias
    ];

    excludedFields.forEach((field) => delete queryObj[field]);

    // Convert query params to Prisma where conditions
    Object.entries(queryObj).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        // Handle special operators
        if (typeof value === "string") {
          if (value.startsWith(">=")) {
            this.whereConditions[key] = { gte: parseValue(value.slice(2)) };
          } else if (value.startsWith("<=")) {
            this.whereConditions[key] = { lte: parseValue(value.slice(2)) };
          } else if (value.startsWith(">")) {
            this.whereConditions[key] = { gt: parseValue(value.slice(1)) };
          } else if (value.startsWith("<")) {
            this.whereConditions[key] = { lt: parseValue(value.slice(1)) };
          } else if (value === "true" || value === "false") {
            this.whereConditions[key] = value === "true";
          } else {
            this.whereConditions[key] = value;
          }
        } else {
          this.whereConditions[key] = value;
        }
      }
    });

    return this;
  }

  /**
   * Add sort functionality
   */
  sort(): this {
    const sortParam = (this.query?.sort as string) || this.defaultSort;
    const sortFields = sortParam.split(",");

    this.orderBy = sortFields.map((field) => {
      if (field.startsWith("-")) {
        return { [field.slice(1)]: "desc" as const };
      }
      return { [field]: "asc" as const };
    });

    return this;
  }

  /**
   * Add pagination
   */
  paginate(): this {
    const limit = Number(this.query?.limit) || 10;
    const page = Number(this.query?.page) || 1;

    this.take = limit;
    this.skip = (page - 1) * limit;

    return this;
  }

  /**
   * Select specific fields
   */
  fields(): this {
    const fieldsParam = this.query?.fields as string;

    if (fieldsParam) {
      const fieldList = fieldsParam.split(",");
      this.selectFields = {};

      fieldList.forEach((field) => {
        if (field.startsWith("-")) {
          // Prisma doesn't support field exclusion directly
          // You'd need to specify all fields except the excluded ones
        } else {
          this.selectFields![field] = true;
        }
      });
    }

    return this;
  }
  /**
   * Include related fields/models
   */
  include(includes: Record<string, any>): this {
    this.includeFields = { ...this.includeFields, ...includes };
    return this;
  }

  /**
   * Get the built where conditions
   */
  getWhere(): Record<string, any> {
    return this.whereConditions;
  }

  /**
   * Execute the query and return data with pagination meta
   */
  async execute(): Promise<{ data: T[]; meta: PaginationMeta }> {
    const findArgs: Record<string, any> = {
      where: this.whereConditions,
      orderBy: this.orderBy.length > 0 ? this.orderBy : undefined,
      skip: this.skip,
      take: this.take,
    };

    if (this.selectFields && Object.keys(this.selectFields).length > 0) {
      findArgs.select = this.selectFields;
    }

    if (this.includeFields && Object.keys(this.includeFields).length > 0) {
      findArgs.include = this.includeFields;
    }

    const [data, total] = await Promise.all([
      this.model.findMany(findArgs),
      this.model.count({ where: this.whereConditions }),
    ]);

    const page = Number(this.query?.page) || 1;
    const limit = this.take;
    const totalPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPage,
      },
    };
  }

  /**
   * Execute only count
   */
  async countTotal(): Promise<PaginationMeta> {
    const total = await this.model.count({ where: this.whereConditions });
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }

  /**
   * Get raw query arguments for manual execution
   */
  getRawArgs(): {
    where: Record<string, any>;
    orderBy: Record<string, "asc" | "desc">[];
    skip: number;
    take: number;
    select?: Record<string, boolean>;
    include?: Record<string, any>;
  } {
    return {
      where: this.whereConditions,
      orderBy: this.orderBy,
      skip: this.skip,
      take: this.take,
      select: this.selectFields,
      include: this.includeFields,
    };
  }
}

/**
 * Parse string value to appropriate type
 */
function parseValue(value: string): string | number | boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  const num = Number(value);
  if (!isNaN(num)) return num;
  return value;
}

export default PrismaQueryBuilder;
