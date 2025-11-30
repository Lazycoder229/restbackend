import { Injectable } from "../decorators/injectable.decorator";
import { QueryBuilder } from "./query-builder";
import { DatabaseService } from "./database.service";

/**
 * Base Repository class with ORM-like methods
 */
@Injectable()
export abstract class Repository<T> {
  protected abstract tableName: string;

  constructor(protected db: DatabaseService) {}

  /**
   * Create new query builder
   */
  protected query(): QueryBuilder<T> {
    const qb = new QueryBuilder<T>(this.db);
    return qb.table(this.tableName);
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    return await this.query().get();
  }

  /**
   * Find by ID
   */
  async findById(id: number): Promise<T | null> {
    return await this.query().find(id);
  }

  /**
   * Find by field
   */
  async findBy(field: string, value: any): Promise<T[]> {
    return await this.query().where(field, value).get();
  }

  /**
   * Find one by field
   */
  async findOneBy(field: string, value: any): Promise<T | null> {
    return await this.query().where(field, value).first();
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<T> {
    const result = await this.query().insert(data);
    return { id: result.id, ...data } as T;
  }

  /**
   * Create multiple records
   */
  async createMany(records: Partial<T>[]): Promise<{ affectedRows: number }> {
    return await this.query().insertMany(records);
  }

  /**
   * Update a record by ID
   */
  async update(id: number, data: Partial<T>): Promise<number> {
    return await this.query().where("id", id).update(data);
  }

  /**
   * Update records by condition
   */
  async updateBy(field: string, value: any, data: Partial<T>): Promise<number> {
    return await this.query().where(field, value).update(data);
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number): Promise<number> {
    return await this.query().where("id", id).delete();
  }

  /**
   * Delete records by condition
   */
  async deleteBy(field: string, value: any): Promise<number> {
    return await this.query().where(field, value).delete();
  }

  /**
   * Count all records
   */
  async count(): Promise<number> {
    return await this.query().count();
  }

  /**
   * Count by condition
   */
  async countBy(field: string, value: any): Promise<number> {
    return await this.query().where(field, value).count();
  }

  /**
   * Check if record exists
   */
  async exists(id: number): Promise<boolean> {
    return await this.query().where("id", id).exists();
  }

  /**
   * Paginate records
   */
  async paginate(page: number = 1, perPage: number = 15) {
    return await this.query().paginate(page, perPage);
  }

  /**
   * Save (insert or update)
   */
  async save(data: any): Promise<T> {
    if (data.id) {
      const id = data.id;
      delete data.id;
      await this.update(id, data);
      return { id, ...data } as T;
    } else {
      return await this.create(data);
    }
  }
}
