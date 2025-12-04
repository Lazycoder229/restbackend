/**
 * Pagination utilities for API endpoints
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PaginationQuery {
  page: string;
  limit: string;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Pagination Service
 */
export class PaginationService {
  /**
   * Parse pagination parameters from query
   */
  static parsePaginationQuery(query: any): PaginationOptions {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const sortBy = query.sortBy as string;
    const sortOrder =
      (query.sortOrder as string)?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)), // Max 100 items per page
      sortBy,
      sortOrder,
    };
  }

  /**
   * Create paginated result
   */
  static paginate<T>(
    data: T[],
    totalItems: number,
    options: PaginationOptions
  ): PaginationResult<T> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Apply pagination to array
   */
  static paginateArray<T>(
    items: T[],
    options: PaginationOptions
  ): PaginationResult<T> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    let sortedItems = [...items];

    // Apply sorting if specified
    if (options.sortBy) {
      sortedItems = this.sortArray(
        sortedItems,
        options.sortBy,
        options.sortOrder
      );
    }

    const paginatedData = sortedItems.slice(startIndex, endIndex);

    return this.paginate(paginatedData, items.length, options);
  }

  /**
   * Sort array by property
   */
  static sortArray<T>(
    items: T[],
    sortBy: string,
    sortOrder: "ASC" | "DESC" = "ASC"
  ): T[] {
    return items.sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      else if (aValue < bValue) comparison = -1;

      return sortOrder === "DESC" ? -comparison : comparison;
    });
  }

  /**
   * Get SQL LIMIT and OFFSET for pagination
   */
  static getSqlPagination(options: PaginationOptions): {
    limit: number;
    offset: number;
  } {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    return { limit, offset };
  }

  /**
   * Get SQL ORDER BY clause
   */
  static getSqlOrderBy(options: PaginationOptions): string {
    if (!options.sortBy) return "";

    const sortOrder = options.sortOrder || "ASC";
    // Sanitize sortBy to prevent SQL injection
    const sanitizedSortBy = options.sortBy.replace(/[^a-zA-Z0-9_]/g, "");

    return `ORDER BY ${sanitizedSortBy} ${sortOrder}`;
  }
}

/**
 * Pagination decorator parameter metadata
 */
const PAGINATION_METADATA = Symbol("pagination:metadata");

/**
 * @Paginate decorator - Extract pagination parameters from query
 */
export function Paginate(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const metadata =
      Reflect.getMetadata(PAGINATION_METADATA, target, propertyKey) || [];
    metadata.push({ index: parameterIndex });
    Reflect.defineMetadata(PAGINATION_METADATA, metadata, target, propertyKey);
  };
}

/**
 * Get pagination metadata
 */
export function getPaginationMetadata(
  target: any,
  propertyKey: string | symbol
): any[] {
  return Reflect.getMetadata(PAGINATION_METADATA, target, propertyKey) || [];
}

/**
 * Pagination Pipe - Transform query to PaginationOptions
 */
export class PaginationPipe {
  transform(value: any): PaginationOptions {
    return PaginationService.parsePaginationQuery(value);
  }
}

/**
 * Helper: Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  return PaginationService.paginate(data, total, { page, limit });
}

/**
 * Repository helper for pagination
 */
export class PaginationHelper {
  /**
   * Apply pagination to query builder
   */
  static applyPagination(query: string, options: PaginationOptions): string {
    let paginatedQuery = query;

    // Add ORDER BY
    const orderBy = PaginationService.getSqlOrderBy(options);
    if (orderBy) {
      paginatedQuery += ` ${orderBy}`;
    }

    // Add LIMIT and OFFSET
    const { limit, offset } = PaginationService.getSqlPagination(options);
    paginatedQuery += ` LIMIT ${limit} OFFSET ${offset}`;

    return paginatedQuery;
  }

  /**
   * Get total count query
   */
  static getCountQuery(baseQuery: string): string {
    // Remove ORDER BY, LIMIT, OFFSET from count query
    let countQuery = baseQuery
      .replace(/ORDER BY .+?(?=LIMIT|OFFSET|$)/gi, "")
      .replace(/LIMIT \d+/gi, "")
      .replace(/OFFSET \d+/gi, "")
      .trim();

    // Wrap in COUNT query
    return `SELECT COUNT(*) as total FROM (${countQuery}) as count_query`;
  }
}

/**
 * Pagination interceptor - Auto-parse pagination from query
 */
export class PaginationInterceptor {
  async intercept(context: any, next: any): Promise<any> {
    const request = context.getRequest();
    const query = (request as any).query || {};

    // Parse pagination parameters
    const pagination = PaginationService.parsePaginationQuery(query);

    // Attach to request
    (request as any).pagination = pagination;

    return await next.handle();
  }
}
