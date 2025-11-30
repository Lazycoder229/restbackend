import "reflect-metadata";
import { MODULE_METADATA, ModuleMetadata } from "../core/metadata";

/**
 * Module decorator - defines a module with its dependencies
 * @param metadata - Module configuration
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target);
  };
}
