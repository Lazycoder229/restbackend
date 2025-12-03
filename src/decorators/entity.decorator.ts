import "reflect-metadata";
import { COLUMN_METADATA, ColumnMetadata } from "./column.decorator";

export const ENTITY_METADATA = "entity:metadata";

/**
 * Entity metadata interface
 */
export interface EntityMetadata {
  tableName: string;
  primaryKey?: string;
  columns?: ColumnMetadata[];
}

/**
 * Entity decorator - Marks a class as a database entity/model
 * Similar to NestJS TypeORM's @Entity()
 *
 * @param tableName - The database table name
 * @param options - Additional entity options
 *
 * @example
 * ```typescript
 * @Entity('users')
 * export class User extends BaseEntity {
 *   id?: number;
 *   name: string;
 *   email: string;
 * }
 * ```
 */
export function Entity(
  tableName: string,
  options?: { primaryKey?: string }
): ClassDecorator {
  return (target: any) => {
    // Get column metadata from @Column decorators
    const columns: ColumnMetadata[] =
      Reflect.getMetadata(COLUMN_METADATA, target) || [];

    const metadata: EntityMetadata = {
      tableName,
      primaryKey: options?.primaryKey || "id",
      columns,
    };

    Reflect.defineMetadata(ENTITY_METADATA, metadata, target);

    // Store table name and columns on the class itself for easy access
    target.tableName = tableName;
    target.primaryKey = options?.primaryKey || "id";
    target.columns = columns;
  };
}
