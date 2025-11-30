import "reflect-metadata";
import { CONTROLLER_METADATA } from "../core/metadata";

/**
 * Controller decorator - marks a class as a controller with a base path
 * @param path - Base path for all routes in this controller
 */
export function Controller(path: string = ""): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(CONTROLLER_METADATA, path, target);
  };
}
