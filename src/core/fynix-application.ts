import "reflect-metadata";
import * as http from "http";
import { ModuleContainer } from "./module-container";
import {
  CONTROLLER_METADATA,
  ROUTE_METADATA,
  PARAM_METADATA,
  RouteMetadata,
  ParameterMetadata,
  GUARDS_METADATA,
  INTERCEPTORS_METADATA,
} from "./metadata";
import {
  ExecutionContext,
  CanActivate,
  FynixInterceptor,
} from "../common/interfaces";
import { GlobalExceptionFilter } from "../builtin/logger";
import { HotReloadManager, HotReloadOptions } from "./hot-reload";

/**
 * Fynix Application instance
 */
interface CompiledRoute {
  controller: any;
  method: string;
  methodName: string;
  pattern: RegExp;
  paramNames: string[];
  hasGuards: boolean;
  hasInterceptors: boolean;
  guards: any[];
  interceptors: any[];
  handler: Function;
  pathSegments?: string[];
  paramIndices?: number[];
  isSimpleParam: boolean;
}

export class FynixApplication {
  private server: http.Server;
  private moduleContainer: ModuleContainer;
  private globalPrefix: string = "";
  private globalInterceptors: FynixInterceptor[] = [];
  private exceptionFilter: GlobalExceptionFilter;
  private routeCache: Map<string, CompiledRoute[]> = new Map();
  private paramMetadataCache: Map<string, ParameterMetadata[]> = new Map();
  private hotReloadManager: HotReloadManager | null = null;
  private hotReloadOptions: HotReloadOptions = { enabled: false };
  private shutdownHooks: Array<() => Promise<void>> = [];
  private isShuttingDown: boolean = false;
  private static readonly NOT_FOUND_RESPONSE = Buffer.from(
    '{"message":"Not Found","statusCode":404}'
  );
  private static readonly FORBIDDEN_RESPONSE = Buffer.from(
    '{"message":"Forbidden"}'
  );
  private static readonly JSON_TYPE = "application/json";

  constructor(private rootModule: any) {
    this.moduleContainer = new ModuleContainer();
    this.exceptionFilter = new GlobalExceptionFilter();
    this.setupGracefulShutdown();
  }

  /**
   * Get a provider instance from the DI container
   */
  get<T>(token: any): T {
    return this.moduleContainer.resolve(token) as T;
  }

  /**
   * Register global interceptors
   */
  useGlobalInterceptors(...interceptors: FynixInterceptor[]): void {
    this.globalInterceptors.push(...interceptors);
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    // Scan modules and build DI container
    await this.moduleContainer.scanModule(this.rootModule);

    // Initialize BaseEntity with database connection if available
    this.moduleContainer.initializeDatabase();

    // Pre-compile routes for faster lookup
    this.compileRoutes();
  }

  /**
   * Compile routes into optimized structure
   */
  private compileRoutes(): void {
    const controllers = this.moduleContainer.getControllers();

    for (const ControllerClass of controllers) {
      const basePath =
        Reflect.getMetadata(CONTROLLER_METADATA, ControllerClass) || "";
      const fullBasePath = this.globalPrefix + basePath;
      const routes: RouteMetadata[] =
        Reflect.getMetadata(ROUTE_METADATA, ControllerClass) || [];
      const controllerInstance = this.moduleContainer.resolve(ControllerClass);

      for (const route of routes) {
        const fullPath = this.joinPaths(fullBasePath, route.path);
        const { pattern, paramNames } = this.compileRoutePattern(fullPath);

        const classGuards: any[] =
          Reflect.getMetadata(GUARDS_METADATA, ControllerClass) || [];
        const methodGuards: any[] =
          Reflect.getMetadata(
            GUARDS_METADATA,
            ControllerClass,
            route.methodName
          ) || [];
        const guards = [...classGuards, ...methodGuards];

        const classInterceptors: any[] =
          Reflect.getMetadata(INTERCEPTORS_METADATA, ControllerClass) || [];
        const methodInterceptors: any[] =
          Reflect.getMetadata(
            INTERCEPTORS_METADATA,
            ControllerClass,
            route.methodName
          ) || [];
        const interceptors = [
          ...this.globalInterceptors,
          ...classInterceptors,
          ...methodInterceptors,
        ];

        // Detect simple param routes for fast path
        const pathSegments = fullPath.split("/").filter(Boolean);
        const paramIndices: number[] = [];
        const isSimpleParam = pathSegments.every((seg, idx) => {
          if (seg.startsWith(":")) {
            paramIndices.push(idx);
            return true;
          }
          return !seg.includes("*") && !seg.includes("?");
        });

        const compiled: CompiledRoute = {
          controller: controllerInstance,
          method: route.method,
          methodName: route.methodName,
          pattern,
          paramNames,
          hasGuards: guards.length > 0,
          hasInterceptors: interceptors.length > 0,
          guards,
          interceptors,
          handler: (controllerInstance as any)[route.methodName],
          pathSegments: isSimpleParam ? pathSegments : undefined,
          paramIndices:
            isSimpleParam && paramIndices.length > 0 ? paramIndices : undefined,
          isSimpleParam,
        };

        const key = route.method;
        if (!this.routeCache.has(key)) {
          this.routeCache.set(key, []);
        }
        this.routeCache.get(key)!.push(compiled);

        // Cache parameter metadata
        const cacheKey = `${ControllerClass.name}:${route.methodName}`;
        if (!this.paramMetadataCache.has(cacheKey)) {
          const paramMetadata: ParameterMetadata[] =
            Reflect.getMetadata(
              PARAM_METADATA,
              ControllerClass,
              route.methodName
            ) || [];
          this.paramMetadataCache.set(cacheKey, paramMetadata);
        }
      }
    }
  }

  /**
   * Compile route pattern to regex
   */
  private compileRoutePattern(path: string): {
    pattern: RegExp;
    paramNames: string[];
  } {
    const paramNames: string[] = [];
    const regexPattern = path
      .split("/")
      .map((part) => {
        if (part.startsWith(":")) {
          paramNames.push(part.slice(1));
          return "([^/]+)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");

    return {
      pattern: new RegExp(`^${regexPattern}$`),
      paramNames,
    };
  }

  /**
   * Set a global route prefix
   */
  setGlobalPrefix(prefix: string): void {
    this.globalPrefix = prefix;
  }

  /**
   * Enable hot reload for development
   */
  enableHotReload(options?: HotReloadOptions): void {
    this.hotReloadOptions = {
      enabled: true,
      watchPaths: options?.watchPaths || ["src"],
      ignore: options?.ignore,
      debounceMs: options?.debounceMs,
      onReload: options?.onReload,
    };
  }

  /**
   * Start listening on a port
   */
  async listen(port: number): Promise<void> {
    await this.init();

    this.server = http.createServer(async (req, res) => {
      try {
        await this.handleRequest(req, res);
      } catch (error) {
        this.exceptionFilter.catch(error as Error, req, res);
      }
    });

    return new Promise((resolve) => {
      this.server.listen(port, () => {
        // Start hot reload if enabled
        if (this.hotReloadOptions.enabled) {
          this.hotReloadManager = new HotReloadManager(
            this.hotReloadOptions,
            () => {
              console.log("Restarting server due to file changes...");
              this.server.close(() => {
                process.exit(0);
              });
            }
          );
          this.hotReloadManager.start();
        }

        resolve();
      });
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const method = req.method!;
    const url = req.url!;

    // Execute global interceptors first (for static files, etc.)
    if (this.globalInterceptors.length > 0) {
      const context: ExecutionContext = {
        getRequest: () => req as any,
        getResponse: () => res as any,
        getHandler: () => () => {},
        getClass: () => Object,
        switchToHttp: () => ({
          getRequest: () => req as any,
          getResponse: () => res as any,
        }),
      };

      for (const interceptor of this.globalInterceptors) {
        await interceptor.intercept(context, {
          handle: async () => null,
        });
        // If interceptor handled the response (e.g., served static file), stop here
        if (res.writableEnded || res.headersSent) {
          return;
        }
      }
    }

    // Find matching route from cache first
    const routes = this.routeCache.get(method);
    if (!routes) {
      res.statusCode = 404;
      res.setHeader("Content-Type", FynixApplication.JSON_TYPE);
      res.end(FynixApplication.NOT_FOUND_RESPONSE);
      return;
    }

    const queryIndex = url.indexOf("?");
    const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex);

    // Try to match route
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const match = route.pattern.exec(pathname);
      if (!match) continue;

      // Parse query only if needed
      (req as any).query =
        queryIndex !== -1
          ? this.parseQueryString(url.slice(queryIndex + 1))
          : {};

      // Fast param extraction - pre-allocate and directly assign
      const paramCount = route.paramNames.length;
      if (paramCount > 0) {
        const params: any = {};
        // Unroll for common cases
        if (paramCount === 1) {
          params[route.paramNames[0]] = match[1];
        } else if (paramCount === 2) {
          params[route.paramNames[0]] = match[1];
          params[route.paramNames[1]] = match[2];
        } else {
          for (let j = 0; j < paramCount; j++) {
            params[route.paramNames[j]] = match[j + 1];
          }
        }
        (req as any).params = params;
      } else {
        (req as any).params = {};
      }

      (req as any).path = pathname;

      // Parse body for POST/PUT/PATCH
      if (method === "POST" || method === "PUT" || method === "PATCH") {
        await this.parseBody(req);
      }

      await this.executeRouteHandler(route, req, res);
      return;
    }

    // No route found
    res.statusCode = 404;
    res.setHeader("Content-Type", FynixApplication.JSON_TYPE);
    res.end(FynixApplication.NOT_FOUND_RESPONSE);
  }

  /**
   * Execute route handler with optimizations
   */
  private async executeRouteHandler(
    route: CompiledRoute,
    req: any,
    res: http.ServerResponse
  ): Promise<void> {
    // Super fast path: no guards, interceptors
    if (!route.hasGuards && !route.hasInterceptors) {
      const paramMetadata = this.paramMetadataCache.get(
        `${route.controller.constructor.name}:${route.methodName}`
      );

      if (!paramMetadata || paramMetadata.length === 0) {
        // No parameters - ultra fast direct call
        res.statusCode = 200;
        res.setHeader("Content-Type", FynixApplication.JSON_TYPE);
        const result = await route.handler.call(route.controller);
        res.end(
          typeof result === "object" ? JSON.stringify(result) : String(result)
        );
        return;
      }

      // Fast inline parameter extraction and call
      const len = paramMetadata.length;
      if (len === 1) {
        const p = paramMetadata[0];
        const arg =
          p.type === "param"
            ? p.data
              ? req.params[p.data]
              : req.params
            : p.type === "query"
            ? p.data
              ? req.query[p.data]
              : req.query
            : p.type === "body"
            ? p.data
              ? req.body?.[p.data]
              : req.body
            : p.type === "req"
            ? req
            : res;
        res.statusCode = 200;
        res.setHeader("Content-Type", FynixApplication.JSON_TYPE);
        const result = await route.handler.call(route.controller, arg);
        res.end(
          typeof result === "object" ? JSON.stringify(result) : String(result)
        );
        return;
      }

      const args = this.extractParametersInline(paramMetadata, req, res);
      res.statusCode = 200;
      res.setHeader("Content-Type", FynixApplication.JSON_TYPE);
      const result = await route.handler.apply(route.controller, args);
      res.end(
        typeof result === "object" ? JSON.stringify(result) : String(result)
      );
      return;
    }

    // Execute guards
    if (route.hasGuards) {
      const canActivate = await this.executeGuardsFast(route.guards, req, res);
      if (!canActivate) {
        res.statusCode = 403;
        res.setHeader("Content-Type", FynixApplication.JSON_TYPE);
        res.end(FynixApplication.FORBIDDEN_RESPONSE);
        return;
      }
    }

    // Get method parameters
    const paramMetadata = this.paramMetadataCache.get(
      `${route.controller.constructor.name}:${route.methodName}`
    );
    const args = paramMetadata
      ? this.extractParametersInline(paramMetadata, req, res)
      : [];

    // Execute interceptors and handler
    const result = route.hasInterceptors
      ? await this.executeInterceptorsFast(route.interceptors, req, res, () =>
          route.handler.apply(route.controller, args)
        )
      : await route.handler.apply(route.controller, args);

    // Check if response was already sent by an interceptor
    if (res.writableEnded || res.headersSent) {
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", FynixApplication.JSON_TYPE);
    res.end(
      typeof result === "object" ? JSON.stringify(result) : String(result)
    );
  }

  /**
   * Fast query string parser
   */
  private parseQueryString(queryString: string): Record<string, string> {
    const query: Record<string, string> = {};
    if (!queryString) return query;

    let start = 0;
    let eq = -1;
    const len = queryString.length;

    for (let i = 0; i <= len; i++) {
      if (i === len || queryString[i] === "&") {
        if (eq === -1) {
          if (i > start) {
            query[decodeURIComponent(queryString.slice(start, i))] = "";
          }
        } else {
          query[decodeURIComponent(queryString.slice(start, eq))] =
            decodeURIComponent(queryString.slice(eq + 1, i));
        }
        start = i + 1;
        eq = -1;
      } else if (queryString[i] === "=" && eq === -1) {
        eq = i;
      }
    }
    return query;
  }

  /**
   * Parse request body
   */
  private async parseBody(req: http.IncomingMessage): Promise<void> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        try {
          if (chunks.length === 0) {
            (req as any).body = {};
          } else {
            const buffer = Buffer.concat(chunks);
            (req as any).body = JSON.parse(buffer.toString());
          }
        } catch {
          (req as any).body = {};
        }
        resolve();
      });
    });
  }

  /**
   * Inline parameter extraction for maximum performance
   */
  private extractParametersInline(
    paramMetadata: ParameterMetadata[],
    req: any,
    res: any
  ): any[] {
    const len = paramMetadata.length;
    const args: any[] = new Array(len);

    for (let i = 0; i < len; i++) {
      const param = paramMetadata[i];
      const idx = param.index;

      switch (param.type) {
        case "param":
          args[idx] = param.data ? req.params[param.data] : req.params;
          break;
        case "query":
          args[idx] = param.data ? req.query[param.data] : req.query;
          break;
        case "body":
          args[idx] = param.data ? req.body?.[param.data] : req.body;
          break;
        case "headers":
          args[idx] = param.data
            ? req.headers[param.data.toLowerCase()]
            : req.headers;
          break;
        case "req":
          args[idx] = req;
          break;
        case "res":
          args[idx] = res;
          break;
      }
    }
    return args;
  }

  /**
   * Fast guard execution with pre-resolved guards
   */
  private async executeGuardsFast(
    guards: any[],
    req: any,
    res: any
  ): Promise<boolean> {
    const context: ExecutionContext = {
      getRequest: () => req,
      getResponse: () => res,
      getHandler: () => () => {},
      getClass: () => Object,
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    };

    for (const GuardClass of guards) {
      const guard: CanActivate = this.moduleContainer.resolve(GuardClass);
      const canActivate = await guard.canActivate(context);
      if (!canActivate) {
        return false;
      }
    }
    return true;
  }

  /**
   * Fast interceptor execution with pre-resolved interceptors
   */
  private async executeInterceptorsFast(
    interceptors: any[],
    req: any,
    res: any,
    handler: () => Promise<any>
  ): Promise<any> {
    const context: ExecutionContext = {
      getRequest: () => req,
      getResponse: () => res,
      getHandler: () => () => {},
      getClass: () => Object,
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    };

    let finalHandler = handler;
    for (const InterceptorClass of interceptors.slice().reverse()) {
      // Check if it's already an instance or a class reference
      const interceptor: FynixInterceptor =
        typeof InterceptorClass === "function"
          ? this.moduleContainer.resolve(InterceptorClass)
          : InterceptorClass;
      const currentHandler = finalHandler;
      finalHandler = async () => {
        return await interceptor.intercept(context, { handle: currentHandler });
      };
    }

    return await finalHandler();
  }

  /**
   * Join path segments
   */
  private joinPaths(...paths: string[]): string {
    return (
      "/" +
      paths
        .filter(Boolean)
        .map((p) => p.replace(/^\/+|\/+$/g, ""))
        .filter(Boolean)
        .join("/")
    );
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT", "SIGUSR2"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        if (this.isShuttingDown) return;

        console.log(
          `\n[FynixJS] Received ${signal}, starting graceful shutdown...`
        );
        this.isShuttingDown = true;

        try {
          await this.shutdown();
          console.log("[FynixJS] Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          console.error("[FynixJS] Error during shutdown:", error);
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("[FynixJS] Uncaught Exception:", error);
      this.shutdown().then(() => process.exit(1));
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error(
        "[FynixJS] Unhandled Rejection at:",
        promise,
        "reason:",
        reason
      );
    });
  }

  /**
   * Register a shutdown hook
   */
  onShutdown(hook: () => Promise<void>): void {
    this.shutdownHooks.push(hook);
  }

  /**
   * Perform graceful shutdown
   */
  private async shutdown(): Promise<void> {
    console.log("[FynixJS] Running shutdown hooks...");

    // Execute all shutdown hooks
    for (const hook of this.shutdownHooks) {
      try {
        await hook();
      } catch (error) {
        console.error("[FynixJS] Error in shutdown hook:", error);
      }
    }

    // Stop accepting new connections
    if (this.server) {
      await this.close();
    }

    // Stop hot reload watcher
    if (this.hotReloadManager) {
      this.hotReloadManager = null;
    }

    console.log("[FynixJS] Server closed");
  }

  /**
   * Close the server
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Enable graceful shutdown (already enabled by default)
   */
  enableShutdownHooks(): void {
    // Already enabled in constructor
    console.log("[FynixJS] Graceful shutdown hooks are enabled");
  }
}
