import { Injectable } from "../decorators/injectable.decorator";
import {
  FynixInterceptor,
  ExecutionContext,
  CallHandler,
} from "../common/interfaces";

/**
 * Built-in CORS Interceptor
 */
@Injectable()
export class CorsInterceptor implements FynixInterceptor {
  private allowedOrigins: string[] = ["*"];
  private allowedMethods: string[] = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ];
  private allowedHeaders: string[] = ["Content-Type", "Authorization"];

  configure(options: {
    origins?: string[];
    methods?: string[];
    headers?: string[];
  }) {
    if (options.origins) this.allowedOrigins = options.origins;
    if (options.methods) this.allowedMethods = options.methods;
    if (options.headers) this.allowedHeaders = options.headers;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.getRequest();
    const response = context.getResponse();

    // Set CORS headers
    const origin = this.allowedOrigins.includes("*")
      ? "*"
      : this.allowedOrigins.find((o) => o === request.headers.origin) ||
        this.allowedOrigins[0];

    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader(
      "Access-Control-Allow-Methods",
      this.allowedMethods.join(", ")
    );
    response.setHeader(
      "Access-Control-Allow-Headers",
      this.allowedHeaders.join(", ")
    );
    response.setHeader("Access-Control-Max-Age", "86400");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.end();
      return;
    }

    return await next.handle();
  }
}
