import "reflect-metadata";

/**
 * API version metadata key
 */
export const API_VERSION_METADATA = Symbol("apiVersion");

/**
 * API version options
 */
export interface ApiVersionOptions {
  /**
   * Version number or array of versions
   */
  version: string | string[];

  /**
   * Deprecated flag
   */
  deprecated?: boolean;
}

/**
 * Version decorator for controllers
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * @ApiVersion('1')
 * export class UsersV1Controller {}
 *
 * @Controller('/users')
 * @ApiVersion('2')
 * export class UsersV2Controller {}
 *
 * // Multiple versions
 * @Controller('/posts')
 * @ApiVersion(['1', '2'])
 * export class PostsController {}
 * ```
 */
export function ApiVersion(
  version: string | string[],
  options: { deprecated?: boolean } = {}
): ClassDecorator {
  return (target: any) => {
    const versions = Array.isArray(version) ? version : [version];

    Reflect.defineMetadata(
      API_VERSION_METADATA,
      {
        version: versions,
        deprecated: options.deprecated || false,
      },
      target
    );
  };
}

/**
 * Get API version from controller
 */
export function getApiVersion(target: any): string[] | undefined {
  const metadata = Reflect.getMetadata(API_VERSION_METADATA, target);
  return metadata?.version;
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(target: any): boolean {
  const metadata = Reflect.getMetadata(API_VERSION_METADATA, target);
  return metadata?.deprecated || false;
}

/**
 * Version extractor types
 */
export enum VersionExtractor {
  URI = "uri",
  HEADER = "header",
  QUERY = "query",
  MEDIA_TYPE = "mediaType",
}

/**
 * Version configuration
 */
export interface VersionConfig {
  /**
   * Extractor type
   */
  type: VersionExtractor;

  /**
   * Header name (for HEADER type)
   */
  header?: string;

  /**
   * Query parameter name (for QUERY type)
   */
  queryParam?: string;

  /**
   * Default version
   */
  defaultVersion?: string;

  /**
   * URI prefix (for URI type)
   */
  prefix?: string;
}

/**
 * Version manager
 */
export class VersionManager {
  private config: VersionConfig;

  constructor(config: VersionConfig) {
    this.config = {
      header: "X-API-Version",
      queryParam: "version",
      prefix: "/v",
      ...config,
    };
  }

  /**
   * Extract version from request
   */
  extractVersion(req: any): string | undefined {
    switch (this.config.type) {
      case VersionExtractor.URI:
        return this.extractFromUri(req.url);

      case VersionExtractor.HEADER:
        return this.extractFromHeader(req.headers);

      case VersionExtractor.QUERY:
        return this.extractFromQuery(req.query || {});

      case VersionExtractor.MEDIA_TYPE:
        return this.extractFromMediaType(req.headers);

      default:
        return this.config.defaultVersion;
    }
  }

  /**
   * Extract version from URI
   */
  private extractFromUri(url: string): string | undefined {
    const match = url.match(new RegExp(`${this.config.prefix}(\\d+)`));
    return match ? match[1] : this.config.defaultVersion;
  }

  /**
   * Extract version from header
   */
  private extractFromHeader(headers: any): string | undefined {
    const headerName = this.config.header!.toLowerCase();
    return headers[headerName] || this.config.defaultVersion;
  }

  /**
   * Extract version from query
   */
  private extractFromQuery(query: any): string | undefined {
    return query[this.config.queryParam!] || this.config.defaultVersion;
  }

  /**
   * Extract version from media type
   */
  private extractFromMediaType(headers: any): string | undefined {
    const accept = headers.accept || headers.Accept || "";
    const match = accept.match(/application\/vnd\.api\+json; version=(\d+)/);
    return match ? match[1] : this.config.defaultVersion;
  }

  /**
   * Strip version from URL (for URI type)
   */
  stripVersion(url: string): string {
    if (this.config.type === VersionExtractor.URI) {
      return url.replace(new RegExp(`${this.config.prefix}\\d+`), "");
    }
    return url;
  }

  /**
   * Check if controller matches version
   */
  matchesVersion(controllerClass: any, requestedVersion: string): boolean {
    const versions = getApiVersion(controllerClass);

    if (!versions || versions.length === 0) {
      return true; // No version constraint
    }

    return versions.includes(requestedVersion);
  }
}

/**
 * Version interceptor
 */
export class VersionInterceptor {
  constructor(private manager: VersionManager) {}

  async intercept(req: any, res: any, next: () => Promise<any>): Promise<any> {
    const version = this.manager.extractVersion(req);

    // Store version in request
    req.apiVersion = version;

    // Add version header to response
    if (version) {
      res.setHeader("X-API-Version", version);
    }

    return next();
  }
}

/**
 * Create version manager
 */
export function createVersionManager(config: VersionConfig): VersionManager {
  return new VersionManager(config);
}

/**
 * Create version interceptor
 */
export function createVersionInterceptor(
  manager: VersionManager
): VersionInterceptor {
  return new VersionInterceptor(manager);
}
