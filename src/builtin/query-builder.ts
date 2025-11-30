import { Injectable } from "../decorators/injectable.decorator";
import { DatabaseService } from "./database.service";

/**
 * Query Builder for fluent SQL queries
 */
@Injectable()
export class QueryBuilder<T = any> {
  private tableName: string = "";
  private selectFields: string[] = ["*"];
  private whereConditions: Array<{
    field: string;
    operator: string;
    value: any;
  }> = [];
  private orderByField: string = "";
  private orderByDirection: "ASC" | "DESC" = "ASC";
  private limitValue: number = 0;
  private offsetValue: number = 0;
  private joinClauses: string[] = [];

  constructor(private db: DatabaseService) {}

  /**
   * Set table name
   */
  table(name: string): this {
    this.tableName = name;
    return this;
  }

  /**
   * Select specific fields
   */
  select(...fields: string[]): this {
    this.selectFields = fields;
    return this;
  }

  /**
   * WHERE clause
   */
  where(field: string, operator: string, value: any): this;
  where(field: string, value: any): this;
  where(field: string, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      // Two parameter version: where('id', 1)
      this.whereConditions.push({
        field,
        operator: "=",
        value: operatorOrValue,
      });
    } else {
      // Three parameter version: where('age', '>', 18)
      this.whereConditions.push({ field, operator: operatorOrValue, value });
    }
    return this;
  }

  /**
   * WHERE IN clause
   */
  whereIn(field: string, values: any[]): this {
    this.whereConditions.push({ field, operator: "IN", value: values });
    return this;
  }

  /**
   * WHERE LIKE clause
   */
  whereLike(field: string, value: string): this {
    this.whereConditions.push({ field, operator: "LIKE", value: `%${value}%` });
    return this;
  }

  /**
   * ORDER BY clause
   */
  orderBy(field: string, direction: "ASC" | "DESC" = "ASC"): this {
    this.orderByField = field;
    this.orderByDirection = direction;
    return this;
  }

  /**
   * LIMIT clause
   */
  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  /**
   * OFFSET clause
   */
  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  /**
   * INNER JOIN
   */
  join(table: string, field1: string, field2: string): this {
    this.joinClauses.push(`INNER JOIN ${table} ON ${field1} = ${field2}`);
    return this;
  }

  /**
   * LEFT JOIN
   */
  leftJoin(table: string, field1: string, field2: string): this {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${field1} = ${field2}`);
    return this;
  }

  /**
   * Execute SELECT query
   */
  async get(): Promise<T[]> {
    const { sql, params } = this.buildSelectQuery();
    return await this.db.query<T[]>(sql, params);
  }

  /**
   * Get first result
   */
  async first(): Promise<T | null> {
    this.limit(1);
    const results = await this.get();
    return results[0] || null;
  }

  /**
   * Find by ID
   */
  async find(id: number): Promise<T | null> {
    return this.where("id", id).first();
  }

  /**
   * Count records
   */
  async count(): Promise<number> {
    const originalSelect = this.selectFields;
    this.selectFields = ["COUNT(*) as count"];
    const result: any = await this.first();
    this.selectFields = originalSelect;
    return result?.count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * INSERT query
   */
  async insert(
    data: Partial<T>
  ): Promise<{ id: number; affectedRows: number }> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => "?").join(", ");

    const sql = `INSERT INTO ${this.tableName} (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;
    const result: any = await this.db.query(sql, values);

    return {
      id: result.insertId,
      affectedRows: result.affectedRows,
    };
  }

  /**
   * INSERT multiple records
   */
  async insertMany(records: Partial<T>[]): Promise<{ affectedRows: number }> {
    if (records.length === 0) return { affectedRows: 0 };

    const fields = Object.keys(records[0]);
    const placeholders = records
      .map(() => `(${fields.map(() => "?").join(", ")})`)
      .join(", ");
    const values = records.flatMap((record) => Object.values(record));

    const sql = `INSERT INTO ${this.tableName} (${fields.join(
      ", "
    )}) VALUES ${placeholders}`;
    const result: any = await this.db.query(sql, values);

    return { affectedRows: result.affectedRows };
  }

  /**
   * UPDATE query
   */
  async update(data: Partial<T>): Promise<number> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map((f) => `${f} = ?`).join(", ");

    const { whereClause, whereParams } = this.buildWhereClause();
    const sql = `UPDATE ${this.tableName} SET ${setClause}${whereClause}`;

    const result: any = await this.db.query(sql, [...values, ...whereParams]);
    return result.affectedRows;
  }

  /**
   * DELETE query
   */
  async delete(): Promise<number> {
    const { whereClause, whereParams } = this.buildWhereClause();
    const sql = `DELETE FROM ${this.tableName}${whereClause}`;

    const result: any = await this.db.query(sql, whereParams);
    return result.affectedRows;
  }

  /**
   * Paginate results
   */
  async paginate(
    page: number = 1,
    perPage: number = 15
  ): Promise<{
    data: T[];
    total: number;
    currentPage: number;
    perPage: number;
    lastPage: number;
  }> {
    const total = await this.count();
    const lastPage = Math.ceil(total / perPage);
    const offset = (page - 1) * perPage;

    const data = await this.offset(offset).limit(perPage).get();

    return {
      data,
      total,
      currentPage: page,
      perPage,
      lastPage,
    };
  }

  /**
   * Build SELECT query
   */
  private buildSelectQuery(): { sql: string; params: any[] } {
    const fields = this.selectFields.join(", ");
    let sql = `SELECT ${fields} FROM ${this.tableName}`;

    // Add JOINs
    if (this.joinClauses.length > 0) {
      sql += " " + this.joinClauses.join(" ");
    }

    // Add WHERE
    const { whereClause, whereParams } = this.buildWhereClause();
    sql += whereClause;

    // Add ORDER BY
    if (this.orderByField) {
      sql += ` ORDER BY ${this.orderByField} ${this.orderByDirection}`;
    }

    // Add LIMIT
    if (this.limitValue > 0) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    // Add OFFSET
    if (this.offsetValue > 0) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return { sql, params: whereParams };
  }

  /**
   * Build WHERE clause
   */
  private buildWhereClause(): { whereClause: string; whereParams: any[] } {
    if (this.whereConditions.length === 0) {
      return { whereClause: "", whereParams: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];

    for (const condition of this.whereConditions) {
      if (condition.operator === "IN") {
        const placeholders = condition.value.map(() => "?").join(", ");
        conditions.push(`${condition.field} IN (${placeholders})`);
        params.push(...condition.value);
      } else {
        conditions.push(`${condition.field} ${condition.operator} ?`);
        params.push(condition.value);
      }
    }

    const whereClause = " WHERE " + conditions.join(" AND ");
    return { whereClause, whereParams: params };
  }

  /**
   * Raw query execution
   */
  async raw(sql: string, params: any[] = []): Promise<T[]> {
    return await this.db.query<T[]>(sql, params);
  }
}
