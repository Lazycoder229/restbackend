import "reflect-metadata";
import { RestApplication } from "./rest-application";

/**
 * RestFactory - Bootstrap the application
 */
export class RestFactory {
  /**
   * Create a Rest application instance
   * @param module - Root module class
   */
  static async create(module: any): Promise<RestApplication> {
    const app = new RestApplication(module);
    return app;
  }
}
