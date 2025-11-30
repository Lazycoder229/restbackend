import "reflect-metadata";
import { PIPES_METADATA } from "../core/metadata";

/**
 * UsePipes decorator - applies pipes to routes, parameters, or controllers
 */
export function UsePipes(...pipes: any[]): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        PIPES_METADATA,
        pipes,
        target.constructor,
        propertyKey
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(PIPES_METADATA, pipes, target);
    }
  };
}
