import "reflect-metadata";
import { Scope, INJECTABLE_METADATA, ProviderMetadata } from "./metadata";

export type Provider = any;

/**
 * Dependency Injection Container
 * Manages provider instances and resolves dependencies
 */
export class Container {
  private providers = new Map<any, any>();
  private instances = new Map<any, any>();

  /**
   * Register a provider in the container
   */
  addProvider(provider: Provider): void {
    this.providers.set(provider, provider);
  }

  /**
   * Get or create an instance of a provider
   */
  resolve<T>(provider: Provider): T {
    // Check if already instantiated (singleton)
    if (this.instances.has(provider)) {
      return this.instances.get(provider) as T;
    }

    // Get provider metadata
    const metadata: ProviderMetadata =
      Reflect.getMetadata(INJECTABLE_METADATA, provider) || {};

    // If transient scope, always create new instance
    if (metadata.scope === Scope.TRANSIENT) {
      return this.createInstance<T>(provider);
    }

    // Default: singleton - create and cache
    const instance = this.createInstance<T>(provider);
    this.instances.set(provider, instance);
    return instance as T;
  }

  /**
   * Create an instance and inject dependencies
   */
  private createInstance<T>(provider: Provider): T {
    // Get constructor parameter types
    const paramTypes: any[] =
      Reflect.getMetadata("design:paramtypes", provider) || [];

    // Resolve dependencies recursively
    const dependencies = paramTypes.map((paramType) => {
      if (!paramType || paramType === Object) {
        return undefined;
      }
      return this.resolve(paramType);
    });

    // Create instance with dependencies
    return new provider(...dependencies) as T;
  }

  /**
   * Check if provider is registered
   */
  has(provider: Provider): boolean {
    return this.providers.has(provider);
  }

  /**
   * Clear all instances (useful for testing)
   */
  clear(): void {
    this.instances.clear();
    this.providers.clear();
  }

  /**
   * Get all registered providers
   */
  getProviders(): Provider[] {
    return Array.from(this.providers.keys());
  }
}
