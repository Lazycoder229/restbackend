import "reflect-metadata";

/**
 * OpenAPI metadata keys
 */
export const OPENAPI_METADATA = Symbol("openapi");
export const OPENAPI_OPERATION = Symbol("operation");
export const OPENAPI_PARAMETER = Symbol("parameter");
export const OPENAPI_RESPONSE = Symbol("response");

/**
 * OpenAPI specification
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

/**
 * API documentation decorator
 *
 * @example
 * ```typescript
 * @Controller('/users')
 * @ApiTags('Users')
 * export class UsersController {
 *   @Get('/')
 *   @ApiOperation({ summary: 'Get all users' })
 *   @ApiResponse({ status: 200, description: 'Success' })
 *   async findAll() {}
 * }
 * ```
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return (target: any) => {
    const existing = Reflect.getMetadata(OPENAPI_METADATA, target) || {};
    Reflect.defineMetadata(OPENAPI_METADATA, { ...existing, tags }, target);
  };
}

/**
 * API operation decorator
 */
export function ApiOperation(options: {
  summary?: string;
  description?: string;
  operationId?: string;
  deprecated?: boolean;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existing =
      Reflect.getMetadata(OPENAPI_OPERATION, target, propertyKey) || {};
    Reflect.defineMetadata(
      OPENAPI_OPERATION,
      { ...existing, ...options },
      target,
      propertyKey
    );
  };
}

/**
 * API response decorator
 */
export function ApiResponse(options: {
  status: number;
  description: string;
  type?: any;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const responses =
      Reflect.getMetadata(OPENAPI_RESPONSE, target, propertyKey) || [];
    responses.push(options);
    Reflect.defineMetadata(OPENAPI_RESPONSE, responses, target, propertyKey);
  };
}

/**
 * API parameter decorator
 */
export function ApiParam(options: {
  name: string;
  description?: string;
  required?: boolean;
  type?: string;
  in?: "path" | "query" | "header" | "cookie";
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const parameters =
      Reflect.getMetadata(OPENAPI_PARAMETER, target, propertyKey) || [];
    parameters.push(options);
    Reflect.defineMetadata(OPENAPI_PARAMETER, parameters, target, propertyKey);
  };
}

/**
 * API query parameter decorator
 */
export function ApiQuery(options: {
  name: string;
  description?: string;
  required?: boolean;
  type?: string;
}): MethodDecorator {
  return ApiParam({ ...options, in: "query" });
}

/**
 * API bearer auth decorator
 */
export function ApiBearerAuth(name: string = "bearer"): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existing =
      Reflect.getMetadata(OPENAPI_OPERATION, target, propertyKey) || {};
    const security = existing.security || [];
    security.push({ [name]: [] });
    Reflect.defineMetadata(
      OPENAPI_OPERATION,
      { ...existing, security },
      target,
      propertyKey
    );
  };
}

/**
 * API property decorator for DTOs
 */
export function ApiProperty(options: {
  description?: string;
  type?: string;
  required?: boolean;
  example?: any;
}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const properties =
      Reflect.getMetadata(OPENAPI_METADATA, target.constructor) || {};

    if (!properties.properties) {
      properties.properties = {};
    }

    properties.properties[propertyKey as string] = options;

    Reflect.defineMetadata(OPENAPI_METADATA, properties, target.constructor);
  };
}

/**
 * OpenAPI document builder
 */
export class OpenAPIBuilder {
  private spec: OpenAPISpec;

  constructor(info: { title: string; version: string; description?: string }) {
    this.spec = {
      openapi: "3.0.0",
      info,
      paths: {},
    };
  }

  /**
   * Add server
   */
  addServer(url: string, description?: string): this {
    if (!this.spec.servers) {
      this.spec.servers = [];
    }
    this.spec.servers.push({ url, description });
    return this;
  }

  /**
   * Add security scheme
   */
  addSecurity(name: string, scheme: any): this {
    if (!this.spec.components) {
      this.spec.components = {};
    }
    if (!this.spec.components.securitySchemes) {
      this.spec.components.securitySchemes = {};
    }
    this.spec.components.securitySchemes[name] = scheme;
    return this;
  }

  /**
   * Add bearer auth
   */
  addBearerAuth(name: string = "bearer"): this {
    return this.addSecurity(name, {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  }

  /**
   * Add API key auth
   */
  addApiKey(name: string = "apiKey", headerName: string = "X-API-Key"): this {
    return this.addSecurity(name, {
      type: "apiKey",
      in: "header",
      name: headerName,
    });
  }

  /**
   * Add controller
   */
  addController(
    controllerClass: any,
    basePath: string,
    routes: Array<{
      method: string;
      path: string;
      handler: string;
    }>
  ): this {
    const tags = Reflect.getMetadata(OPENAPI_METADATA, controllerClass)?.tags;

    for (const route of routes) {
      const fullPath = `${basePath}${route.path}`.replace(/\/$/, "");
      const method = route.method.toLowerCase();

      if (!this.spec.paths[fullPath]) {
        this.spec.paths[fullPath] = {};
      }

      const operation = Reflect.getMetadata(
        OPENAPI_OPERATION,
        controllerClass.prototype,
        route.handler
      );

      const responses = Reflect.getMetadata(
        OPENAPI_RESPONSE,
        controllerClass.prototype,
        route.handler
      );

      const parameters = Reflect.getMetadata(
        OPENAPI_PARAMETER,
        controllerClass.prototype,
        route.handler
      );

      this.spec.paths[fullPath][method] = {
        ...(operation || {}),
        tags: tags || [],
        responses: this.formatResponses(responses || []),
        parameters: parameters || [],
      };
    }

    return this;
  }

  /**
   * Format responses
   */
  private formatResponses(responses: any[]): Record<string, any> {
    const formatted: Record<string, any> = {};

    for (const response of responses) {
      formatted[response.status] = {
        description: response.description,
      };
    }

    return formatted;
  }

  /**
   * Build spec
   */
  build(): OpenAPISpec {
    return this.spec;
  }

  /**
   * Generate JSON
   */
  toJSON(): string {
    return JSON.stringify(this.spec, null, 2);
  }
}

/**
 * Swagger UI options
 */
export interface SwaggerUIOptions {
  /**
   * UI title
   */
  title?: string;

  /**
   * Custom CSS
   */
  customCss?: string;

  /**
   * Custom JS
   */
  customJs?: string;

  /**
   * Explorer enabled
   */
  explorer?: boolean;
}

/**
 * Swagger UI HTML generator
 */
export class SwaggerUI {
  /**
   * Generate Swagger UI HTML
   */
  static generateHTML(specUrl: string, options: SwaggerUIOptions = {}): string {
    const title = options.title || "API Documentation";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  ${options.customCss ? `<style>${options.customCss}</style>` : ""}
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true,
        filter: ${options.explorer !== false}
      });
    };
  </script>
  ${options.customJs ? `<script>${options.customJs}</script>` : ""}
</body>
</html>
    `;
  }
}

/**
 * Create OpenAPI builder
 */
export function createOpenAPIBuilder(info: {
  title: string;
  version: string;
  description?: string;
}): OpenAPIBuilder {
  return new OpenAPIBuilder(info);
}
