import "reflect-metadata";
import { FynixApplication } from "./fynix-application";

/**
 * FynixFactory - Bootstrap the application
 */
export class FynixFactory {
  /**
   * Create a Fynix application instance
   * @param module - Root module class
   */
  static async create(module: any): Promise<FynixApplication> {
    const app = new FynixApplication(module);
    return app;
  }
}
