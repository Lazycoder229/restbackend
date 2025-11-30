import "reflect-metadata";
import { ROUTE_METADATA, RouteMetadata, HttpMethod } from "../core/metadata";

/**
 * Creates a route decorator for a specific HTTP method
 */
function createMethodDecorator(method: HttpMethod) {
  return (path: string = ""): MethodDecorator => {
    return (target, propertyKey, _descriptor) => {
      const routes: RouteMetadata[] =
        Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];

      routes.push({
        path,
        method,
        methodName: propertyKey as string,
      });

      Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);
    };
  };
}

// HTTP method decorators
export const Get = createMethodDecorator("GET");
export const Post = createMethodDecorator("POST");
export const Put = createMethodDecorator("PUT");
export const Delete = createMethodDecorator("DELETE");
export const Patch = createMethodDecorator("PATCH");
export const Options = createMethodDecorator("OPTIONS");
export const Head = createMethodDecorator("HEAD");
