import "reflect-metadata";

export const ENTITY_METADATA = "entity:metadata";

/**
 * Entity metadata interface
 */
export interface EntityMetadata {
  tableName: string;
  primaryKey?: string;
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
    const metadata: EntityMetadata = {
      tableName,
      primaryKey: options?.primaryKey || "id",
    };

    Reflect.defineMetadata(ENTITY_METADATA, metadata, target);

    // Store table name on the class itself for easy access
    target.tableName = tableName;
    target.primaryKey = options?.primaryKey || "id";
  };
}
