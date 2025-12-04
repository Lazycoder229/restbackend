import { IncomingMessage, ServerResponse } from "http";
import { FynixApplication } from "../core/fynix-application";

/**
 * Mock request builder
 */
export class MockRequest {
  private req: Partial<IncomingMessage> & { [key: string]: any } = {
    headers: {},
    method: "GET",
    url: "/",
  };

  method(method: string): this {
    this.req.method = method;
    return this;
  }

  url(url: string): this {
    this.req.url = url;
    return this;
  }

  header(name: string, value: string): this {
    (this.req.headers as any)[name.toLowerCase()] = value;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.req.headers = { ...this.req.headers, ...headers };
    return this;
  }

  body(data: any): this {
    this.req.body = data;
    return this;
  }

  query(params: Record<string, any>): this {
    this.req.query = params;
    return this;
  }

  params(params: Record<string, any>): this {
    this.req.params = params;
    return this;
  }

  user(user: any): this {
    this.req.user = user;
    return this;
  }

  set(key: string, value: any): this {
    (this.req as any)[key] = value;
    return this;
  }

  build(): IncomingMessage {
    return this.req as IncomingMessage;
  }
}

/**
 * Mock response builder
 */
export class MockResponse {
  private res: Partial<ServerResponse> & { [key: string]: any } = {
    statusCode: 200,
    headers: {},
    _writableEnded: false,
    _body: null,
  };

  private onEndCallback?: (body: any, statusCode: number) => void;

  constructor() {
    const self = this;

    this.res.setHeader = function (name: string, value: string | number) {
      (self.res.headers as any)[name] = value;
      return self.res as ServerResponse;
    };

    this.res.getHeader = function (name: string) {
      return (self.res.headers as any)[name];
    };

    this.res.write = function (chunk: any) {
      if (!self.res._body) {
        self.res._body = "";
      }
      self.res._body += chunk;
      return true;
    };

    this.res.end = function (data?: any) {
      if (data) {
        if (!self.res._body) {
          self.res._body = "";
        }
        self.res._body += data;
      }
      self.res._writableEnded = true;

      if (self.onEndCallback) {
        self.onEndCallback(self.res._body, self.res.statusCode || 200);
      }
      return self.res as ServerResponse;
    };

    // Add writableEnded getter
    Object.defineProperty(this.res, "writableEnded", {
      get() {
        return self.res._writableEnded || false;
      },
    });
  }

  status(code: number): this {
    this.res.statusCode = code;
    return this;
  }

  header(name: string, value: string): this {
    (this.res.headers as any)[name] = value;
    return this;
  }

  onEnd(callback: (body: any, statusCode: number) => void): this {
    this.onEndCallback = callback;
    return this;
  }

  build(): ServerResponse {
    return this.res as ServerResponse;
  }

  get body(): any {
    return this.res._body;
  }

  get statusCode(): number {
    return this.res.statusCode || 200;
  }

  get headers(): Record<string, any> {
    return this.res.headers as Record<string, any>;
  }
}

/**
 * Test module configuration
 */
export interface TestModuleConfig {
  /**
   * Controllers to test
   */
  controllers?: any[];

  /**
   * Providers to inject
   */
  providers?: any[];

  /**
   * Modules to import
   */
  imports?: any[];

  /**
   * Override providers
   */
  overrides?: Array<{
    provide: any;
    useValue?: any;
    useClass?: any;
    useFactory?: (...args: any[]) => any;
  }>;
}

/**
 * Testing module
 */
export class TestingModule {
  private app?: FynixApplication;
  private instances = new Map<any, any>();

  constructor(private config: TestModuleConfig) {}

  /**
   * Compile the testing module
   */
  async compile(): Promise<this> {
    // Register providers
    if (this.config.providers) {
      for (const provider of this.config.providers) {
        const instance = new provider();
        this.instances.set(provider, instance);
      }
    }

    // Apply overrides
    if (this.config.overrides) {
      for (const override of this.config.overrides) {
        const token = override.provide;

        if (override.useValue !== undefined) {
          this.instances.set(token, override.useValue);
        } else if (override.useClass) {
          const instance = new override.useClass();
          this.instances.set(token, instance);
        } else if (override.useFactory) {
          const instance = override.useFactory();
          this.instances.set(token, instance);
        }
      }
    }

    return this;
  }

  /**
   * Get a provider instance
   */
  get<T = any>(token: string | Function): T {
    return this.instances.get(token) as T;
  }

  /**
   * Create a mock for a provider
   */
  createMock<T = any>(methods: Partial<T> = {}): T {
    return new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop in methods) {
            return (methods as any)[prop];
          }
          return () => undefined;
        },
      }
    ) as T;
  }

  /**
   * Override a provider
   */
  overrideProvider(token: any): {
    useValue: (value: any) => void;
    useClass: (classType: any) => void;
    useFactory: (factory: (...args: any[]) => any) => void;
  } {
    return {
      useValue: (value: any) => {
        this.instances.set(token, value);
      },
      useClass: (classType: any) => {
        const instance = new classType();
        this.instances.set(token, instance);
      },
      useFactory: (factory: (...args: any[]) => any) => {
        const instance = factory();
        this.instances.set(token, instance);
      },
    };
  }

  /**
   * Close the testing module
   */
  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }
}

/**
 * Test builder
 */
export class Test {
  /**
   * Create a testing module
   */
  static createTestingModule(config: TestModuleConfig): TestingModule {
    return new TestingModule(config);
  }

  /**
   * Create a mock request
   */
  static createRequest(): MockRequest {
    return new MockRequest();
  }

  /**
   * Create a mock response
   */
  static createResponse(): MockResponse {
    return new MockResponse();
  }
}

/**
 * HTTP test client for integration testing
 */
export class TestClient {
  constructor(private app: FynixApplication) {}

  private createRequest(
    method: string,
    url: string,
    options: {
      headers?: Record<string, string>;
      body?: any;
      query?: Record<string, any>;
    } = {}
  ): { req: IncomingMessage; res: MockResponse } {
    const mockReq = new MockRequest()
      .method(method)
      .url(url)
      .headers(options.headers || {});

    if (options.body) {
      mockReq.body(options.body);
    }

    if (options.query) {
      mockReq.query(options.query);
    }

    const mockRes = new MockResponse();

    return {
      req: mockReq.build(),
      res: mockRes,
    };
  }

  private async executeRequest(
    req: IncomingMessage,
    mockRes: MockResponse
  ): Promise<{
    status: number;
    body: any;
    headers: Record<string, any>;
  }> {
    return new Promise((resolve) => {
      mockRes.onEnd((body, statusCode) => {
        let parsedBody = body;
        try {
          parsedBody = JSON.parse(body);
        } catch {
          // Keep as string
        }

        resolve({
          status: statusCode,
          body: parsedBody,
          headers: mockRes.headers,
        });
      });

      // Simulate request handling
      const res = mockRes.build();
      (this.app as any).handleRequest(req, res);
    });
  }

  async get(
    url: string,
    options?: { headers?: Record<string, string>; query?: Record<string, any> }
  ) {
    const { req, res } = this.createRequest("GET", url, options);
    return this.executeRequest(req, res);
  }

  async post(
    url: string,
    options?: {
      headers?: Record<string, string>;
      body?: any;
      query?: Record<string, any>;
    }
  ) {
    const { req, res } = this.createRequest("POST", url, options);
    return this.executeRequest(req, res);
  }

  async put(
    url: string,
    options?: {
      headers?: Record<string, string>;
      body?: any;
      query?: Record<string, any>;
    }
  ) {
    const { req, res } = this.createRequest("PUT", url, options);
    return this.executeRequest(req, res);
  }

  async patch(
    url: string,
    options?: {
      headers?: Record<string, string>;
      body?: any;
      query?: Record<string, any>;
    }
  ) {
    const { req, res } = this.createRequest("PATCH", url, options);
    return this.executeRequest(req, res);
  }

  async delete(
    url: string,
    options?: { headers?: Record<string, string>; query?: Record<string, any> }
  ) {
    const { req, res } = this.createRequest("DELETE", url, options);
    return this.executeRequest(req, res);
  }
}

/**
 * Create test client for app
 */
export function createTestClient(app: FynixApplication): TestClient {
  return new TestClient(app);
}
