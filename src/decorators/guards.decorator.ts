import "reflect-metadata";
import { GUARDS_METADATA } from "../core/metadata";

/**
 * UseGuards decorator - applies guards to routes or controllers
 */
export function UseGuards(...guards: any[]): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        GUARDS_METADATA,
        guards,
        target.constructor,
        propertyKey
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(GUARDS_METADATA, guards, target);
    }
  };
}
