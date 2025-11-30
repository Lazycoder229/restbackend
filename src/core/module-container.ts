import "reflect-metadata";
import { Container } from "./container";
import { MODULE_METADATA, ModuleMetadata } from "./metadata";
import { DatabaseService } from "../builtin/database.service";
import { BaseEntity } from "../builtin/base-entity";

/**
 * Module Container - manages modules and their dependencies
 */
export class ModuleContainer {
  private modules = new Map<any, Container>();
  private moduleMetadata = new Map<any, ModuleMetadata>();

  /**
   * Scan and register a module
   */
  async scanModule(module: any): Promise<Container> {
    // Check if already scanned
    if (this.modules.has(module)) {
      return this.modules.get(module)!;
    }

    // Get module metadata
    const metadata: ModuleMetadata = Reflect.getMetadata(
      MODULE_METADATA,
      module
    );
    if (!metadata) {
      throw new Error(`Module ${module.name} is missing @Module() decorator`);
    }

    this.moduleMetadata.set(module, metadata);

    // Create container for this module
    const container = new Container();
    this.modules.set(module, container);

    // Scan imported modules first
    if (metadata.imports) {
      for (const importedModule of metadata.imports) {
        await this.scanModule(importedModule);
      }
    }

    // Register providers
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        container.addProvider(provider);
      }
    }

    // Register controllers as providers
    if (metadata.controllers) {
      for (const controller of metadata.controllers) {
        container.addProvider(controller);
      }
    }

    return container;
  }

  /**
   * Get container for a module
   */
  getModuleContainer(module: any): Container | undefined {
    return this.modules.get(module);
  }

  /**
   * Get all controllers from all modules
   */
  getControllers(): any[] {
    const controllers: any[] = [];

    for (const [_module, metadata] of this.moduleMetadata.entries()) {
      if (metadata.controllers) {
        controllers.push(...metadata.controllers);
      }
    }

    return controllers;
  }

  /**
   * Resolve a provider from appropriate module
   */
  resolve<T>(provider: any, fromModule?: any): T {
    // Try to resolve from specific module first
    if (fromModule && this.modules.has(fromModule)) {
      const container = this.modules.get(fromModule)!;
      if (container.has(provider)) {
        return container.resolve(provider);
      }
    }

    // Search all modules
    for (const container of this.modules.values()) {
      if (container.has(provider)) {
        return container.resolve(provider);
      }
    }

    throw new Error(`Provider ${provider.name} not found in any module`);
  }

  /**
   * Initialize database connection for BaseEntity
   * Should be called after scanModule() if using entities
   */
  initializeDatabase(): void {
    try {
      const db = this.resolve<DatabaseService>(DatabaseService);
      BaseEntity.initializeConnection(db);
    } catch (error) {
      // DatabaseService is optional - only initialize if it exists
      // This allows the framework to work without database
    }
  }
}
