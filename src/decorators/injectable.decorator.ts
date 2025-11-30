import "reflect-metadata";
import { INJECTABLE_METADATA, ProviderMetadata, Scope } from "../core/metadata";

/**
 * Injectable decorator - marks a class as a provider that can be injected
 * @param options - Provider options including scope
 */
export function Injectable(options?: ProviderMetadata): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(
      INJECTABLE_METADATA,
      options || { scope: Scope.DEFAULT },
      target
    );
  };
}
