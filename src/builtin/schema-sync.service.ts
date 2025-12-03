import { Injectable } from "../decorators/injectable.decorator";
import { DatabaseService } from "./database.service";
import {
  ENTITY_METADATA,
  EntityMetadata,
} from "../decorators/entity.decorator";
import {
  ColumnMetadata,
  IndexMetadata,
  ForeignKeyMetadata,
  INDEX_METADATA,
  FOREIGN_KEY_METADATA,
} from "../decorators/column.decorator";

/**
 * Built-in Schema Synchronization Service
 * Auto-creates and updates database tables based on entity decorators
 * Similar to TypeORM's synchronize or Prisma's migrations
 */
@Injectable()
export class SchemaSyncService {
  constructor(private db: DatabaseService) {}

  /**
   * Synchronize all entity schemas with database
   * WARNING: Use only in development! Can cause data loss in production
   */
  async synchronize(
    entities: any[],
    options?: { dropBeforeSync?: boolean }
  ): Promise<void> {
    console.log("Starting schema synchronization...");

    for (const EntityClass of entities) {
      await this.syncEntity(EntityClass, options);
    }

    console.log("Schema synchronization completed!");
  }

  /**
   * Sync a single entity to database
   */
  private async syncEntity(
    EntityClass: any,
    options?: { dropBeforeSync?: boolean }
  ): Promise<void> {
    const metadata: EntityMetadata = Reflect.getMetadata(
      ENTITY_METADATA,
      EntityClass
    );

    if (!metadata) {
      console.warn(`⚠️  No @Entity metadata found for ${EntityClass.name}`);
      return;
    }

    const tableName = metadata.tableName;
    const columns = metadata.columns || [];
    const indexes: IndexMetadata[] =
      Reflect.getMetadata(INDEX_METADATA, EntityClass) || [];
    const foreignKeys: ForeignKeyMetadata[] =
      Reflect.getMetadata(FOREIGN_KEY_METADATA, EntityClass) || [];
    const primaryKey = metadata.primaryKey || "id";

    console.log(`📝 Syncing table: ${tableName}`);

    // Check if table exists
    const tableExists = await this.checkTableExists(tableName);

    if (options?.dropBeforeSync && tableExists) {
      console.log(`  🗑️  Dropping existing table: ${tableName}`);
      await this.db.query(`DROP TABLE IF EXISTS ${tableName}`);
    }

    if (!tableExists || options?.dropBeforeSync) {
      // Create new table with all constraints
      await this.createTable(
        tableName,
        columns,
        indexes,
        foreignKeys,
        primaryKey
      );
    } else {
      // Update existing table
      await this.updateTable(tableName, columns, indexes, foreignKeys);
    }
  }

  /**
   * Check if table exists
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    const result = await this.db.query<any[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
      [tableName]
    );
    return result.length > 0;
  }

  /**
   * Create a new table with all constraints
   */
  private async createTable(
    tableName: string,
    columns: ColumnMetadata[],
    indexes: IndexMetadata[],
    foreignKeys: ForeignKeyMetadata[],
    primaryKey: string
  ): Promise<void> {
    const parts: string[] = [];

    // Column definitions
    for (const column of columns) {
      parts.push(this.buildColumnDefinition(column, primaryKey));
    }

    // Indexes
    for (const index of indexes) {
      parts.push(this.buildIndexDefinition(index, tableName));
    }

    // Foreign keys
    for (const fk of foreignKeys) {
      parts.push(this.buildForeignKeyDefinition(fk, tableName));
    }

    const sql = `CREATE TABLE ${tableName} (\n  ${parts.join(
      ",\n  "
    )}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

    await this.db.query(sql);
    console.log(`  ✅ Created table: ${tableName}`);
  }

  /**
   * Update existing table (add missing columns, indexes, foreign keys)
   */
  private async updateTable(
    tableName: string,
    columns: ColumnMetadata[],
    indexes: IndexMetadata[],
    foreignKeys: ForeignKeyMetadata[]
  ): Promise<void> {
    // Get existing columns
    const existingColumns = await this.db.query<any[]>(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
      [tableName]
    );
    const existingColumnNames = existingColumns.map((c) => c.COLUMN_NAME);

    // Add missing columns
    for (const column of columns) {
      if (!existingColumnNames.includes(column.propertyName)) {
        const definition = this.buildColumnDefinition(column);
        const sql = `ALTER TABLE ${tableName} ADD COLUMN ${definition}`;
        await this.db.query(sql);
        console.log(`  ➕ Added column: ${tableName}.${column.propertyName}`);
      }
    }

    // Get existing indexes
    const existingIndexes = await this.db.query<any[]>(
      "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME != 'PRIMARY' GROUP BY INDEX_NAME",
      [tableName]
    );
    const existingIndexNames = existingIndexes.map((i) => i.INDEX_NAME);

    // Add missing indexes
    for (const index of indexes) {
      const indexName =
        index.name || `idx_${tableName}_${index.columns.join("_")}`;
      if (!existingIndexNames.includes(indexName)) {
        const sql = `ALTER TABLE ${tableName} ADD ${
          index.isUnique ? "UNIQUE" : ""
        } INDEX ${indexName} (${index.columns.join(", ")})`;
        await this.db.query(sql);
        console.log(`  🔗 Added index: ${indexName}`);
      }
    }

    // Get existing foreign keys
    const existingFKs = await this.db.query<any[]>(
      "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL",
      [tableName]
    );
    const existingFKNames = existingFKs.map((fk) => fk.CONSTRAINT_NAME);

    // Add missing foreign keys
    for (const fk of foreignKeys) {
      const fkName = fk.name || `fk_${tableName}_${fk.column}`;
      if (!existingFKNames.includes(fkName)) {
        const sql = `ALTER TABLE ${tableName} ADD CONSTRAINT ${fkName} FOREIGN KEY (${
          fk.column
        }) REFERENCES ${fk.referencedTable}(${fk.referencedColumn})${
          fk.onDelete ? ` ON DELETE ${fk.onDelete}` : ""
        }${fk.onUpdate ? ` ON UPDATE ${fk.onUpdate}` : ""}`;
        await this.db.query(sql);
        console.log(`  🔗 Added foreign key: ${fkName}`);
      }
    }
  }

  /**
   * Build SQL column definition from metadata
   */
  private buildColumnDefinition(
    column: ColumnMetadata,
    primaryKey?: string
  ): string {
    const parts: string[] = [];

    // Column name
    parts.push(column.propertyName);

    // Data type
    parts.push(this.mapTypeToSQL(column));

    // Unsigned (for numeric types)
    if (column.unsigned && this.isNumericType(column.type || "string")) {
      parts.push("UNSIGNED");
    }

    // Nullable
    if (column.isNullable) {
      parts.push("NULL");
    } else {
      parts.push("NOT NULL");
    }

    // Auto increment (for primary keys)
    if (column.autoIncrement || (column.isPrimary && !column.default)) {
      parts.push("AUTO_INCREMENT");
    }

    // Default value
    if (column.default !== undefined && column.default !== null) {
      if (typeof column.default === "string") {
        parts.push(`DEFAULT '${column.default}'`);
      } else if (typeof column.default === "boolean") {
        parts.push(`DEFAULT ${column.default ? 1 : 0}`);
      } else {
        parts.push(`DEFAULT ${column.default}`);
      }
    }

    // Comment
    if (column.comment) {
      parts.push(`COMMENT '${column.comment.replace(/'/g, "\\'")}'`);
    }

    // Primary key
    if (column.isPrimary || column.propertyName === primaryKey) {
      parts.push("PRIMARY KEY");
    }

    // Unique constraint
    if (column.isUnique && !column.isPrimary) {
      parts.push("UNIQUE");
    }

    return parts.join(" ");
  }

  /**
   * Build index definition
   */
  private buildIndexDefinition(
    index: IndexMetadata,
    tableName: string
  ): string {
    const indexName =
      index.name || `idx_${tableName}_${index.columns.join("_")}`;
    const type = index.isUnique ? "UNIQUE INDEX" : "INDEX";
    return `${type} ${indexName} (${index.columns.join(", ")})`;
  }

  /**
   * Build foreign key definition
   */
  private buildForeignKeyDefinition(
    fk: ForeignKeyMetadata,
    tableName: string
  ): string {
    const fkName = fk.name || `fk_${tableName}_${fk.column}`;
    let definition = `CONSTRAINT ${fkName} FOREIGN KEY (${fk.column}) REFERENCES ${fk.referencedTable}(${fk.referencedColumn})`;

    if (fk.onDelete) {
      definition += ` ON DELETE ${fk.onDelete}`;
    }

    if (fk.onUpdate) {
      definition += ` ON UPDATE ${fk.onUpdate}`;
    }

    return definition;
  }

  /**
   * Check if type is numeric
   */
  private isNumericType(type: string): boolean {
    const numericTypes = [
      "int",
      "tinyint",
      "smallint",
      "mediumint",
      "bigint",
      "number",
      "float",
      "double",
      "decimal",
    ];
    return numericTypes.includes(type.toLowerCase());
  }

  /**
   * Map column metadata to MySQL types with full support
   */
  private mapTypeToSQL(column: ColumnMetadata): string {
    const type = (column.type || "string").toLowerCase();

    // String types
    if (type === "string" || type === "varchar") {
      const length = column.length || 255;
      return `VARCHAR(${length})`;
    }
    if (type === "char") {
      const length = column.length || 1;
      return `CHAR(${length})`;
    }
    if (type === "text") return "TEXT";
    if (type === "tinytext") return "TINYTEXT";
    if (type === "mediumtext") return "MEDIUMTEXT";
    if (type === "longtext") return "LONGTEXT";

    // Numeric types
    if (type === "number" || type === "int" || type === "integer") {
      const length = column.length || 11;
      return `INT(${length})`;
    }
    if (type === "tinyint") {
      const length = column.length || 4;
      return `TINYINT(${length})`;
    }
    if (type === "smallint") {
      const length = column.length || 6;
      return `SMALLINT(${length})`;
    }
    if (type === "mediumint") {
      const length = column.length || 9;
      return `MEDIUMINT(${length})`;
    }
    if (type === "bigint") {
      const length = column.length || 20;
      return `BIGINT(${length})`;
    }
    if (type === "float") return "FLOAT";
    if (type === "double") return "DOUBLE";
    if (type === "decimal" || type === "numeric") {
      const precision = column.precision || 10;
      const scale = column.scale || 2;
      return `DECIMAL(${precision},${scale})`;
    }

    // Boolean
    if (type === "boolean" || type === "bool") return "TINYINT(1)";

    // Date/Time types
    if (type === "date") return "DATE";
    if (type === "datetime") return "DATETIME";
    if (type === "timestamp") return "TIMESTAMP";
    if (type === "time") return "TIME";
    if (type === "year") return "YEAR";

    // Binary types
    if (type === "binary") {
      const length = column.length || 255;
      return `BINARY(${length})`;
    }
    if (type === "varbinary") {
      const length = column.length || 255;
      return `VARBINARY(${length})`;
    }
    if (type === "blob") return "BLOB";
    if (type === "tinyblob") return "TINYBLOB";
    if (type === "mediumblob") return "MEDIUMBLOB";
    if (type === "longblob") return "LONGBLOB";

    // JSON
    if (type === "json") return "JSON";

    // ENUM and SET
    if (type.startsWith("enum")) return type.toUpperCase();
    if (type.startsWith("set")) return type.toUpperCase();

    // Default fallback
    return "VARCHAR(255)";
  }

  /**
   * Generate migration file (for version control)
   */
  async generateMigration(
    entities: any[],
    migrationName: string
  ): Promise<string> {
    const timestamp = new Date().getTime();

    let sql = `-- Migration: ${migrationName} (${timestamp})\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const EntityClass of entities) {
      const metadata: EntityMetadata = Reflect.getMetadata(
        ENTITY_METADATA,
        EntityClass
      );
      if (!metadata) continue;

      const tableName = metadata.tableName;
      const columns = metadata.columns || [];
      const primaryKey = metadata.primaryKey || "id";

      sql += `-- Table: ${tableName}\n`;
      sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

      const columnDefs = columns.map(
        (col) => `  ${this.buildColumnDefinition(col, primaryKey)}`
      );
      sql += columnDefs.join(",\n");
      sql += `\n);\n\n`;
    }

    return sql;
  }
}
