import "reflect-metadata";
import { INTERCEPTORS_METADATA } from "../core/metadata";

/**
 * UseInterceptors decorator - applies interceptors to routes or controllers
 */
export function UseInterceptors(
  ...interceptors: any[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        INTERCEPTORS_METADATA,
        interceptors,
        target.constructor,
        propertyKey
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(INTERCEPTORS_METADATA, interceptors, target);
    }
  };
}
