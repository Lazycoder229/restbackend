import "reflect-metadata";

export const COLUMN_METADATA = "column:metadata";
export const INDEX_METADATA = "index:metadata";
export const FOREIGN_KEY_METADATA = "foreignkey:metadata";

/**
 * Column metadata interface
 */
export interface ColumnMetadata {
  propertyName: string;
  type?: string;
  length?: number;
  precision?: number;
  scale?: number;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  default?: any;
  unsigned?: boolean;
  autoIncrement?: boolean;
  comment?: string;
}

/**
 * Index metadata interface
 */
export interface IndexMetadata {
  columns: string[];
  isUnique?: boolean;
  name?: string;
}

/**
 * Foreign key metadata interface
 */
export interface ForeignKeyMetadata {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  name?: string;
}

/**
 * Column decorator - Marks a property as a database column
 *
 * @param options - Column options
 *
 * @example
 * ```typescript
 * @Column({ type: 'varchar', length: 100, isUnique: true })
 * email: string;
 *
 * @Column({ type: 'decimal', precision: 10, scale: 2 })
 * price: number;
 *
 * @Column({ type: 'int', unsigned: true, default: 0 })
 * views: number;
 * ```
 */
export function Column(options?: {
  type?: string;
  length?: number;
  precision?: number;
  scale?: number;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  default?: any;
  unsigned?: boolean;
  autoIncrement?: boolean;
  comment?: string;
}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const columns: ColumnMetadata[] =
      Reflect.getMetadata(COLUMN_METADATA, target.constructor) || [];

    columns.push({
      propertyName: propertyKey as string,
      type: options?.type || "string",
      length: options?.length,
      precision: options?.precision,
      scale: options?.scale,
      isPrimary: options?.isPrimary || false,
      isNullable: options?.isNullable ?? false,
      isUnique: options?.isUnique || false,
      default: options?.default,
      unsigned: options?.unsigned || false,
      autoIncrement: options?.autoIncrement || false,
      comment: options?.comment,
    });

    Reflect.defineMetadata(COLUMN_METADATA, columns, target.constructor);
  };
}

/**
 * PrimaryGeneratedColumn decorator - Marks a property as the primary key with auto-increment
 */
export function PrimaryGeneratedColumn(options?: {
  type?: "int" | "bigint";
}): PropertyDecorator {
  return Column({
    type: options?.type || "int",
    isPrimary: true,
    autoIncrement: true,
    unsigned: true,
  });
}

/**
 * Index decorator - Creates an index on specified columns
 *
 * @example
 * ```typescript
 * @Entity('users')
 * @Index(['email'])
 * @Index(['firstName', 'lastName'], { name: 'name_idx' })
 * export class User extends BaseEntity {}
 * ```
 */
export function Index(
  columns: string[],
  options?: { isUnique?: boolean; name?: string }
): ClassDecorator {
  return (target: any) => {
    const indexes: IndexMetadata[] =
      Reflect.getMetadata(INDEX_METADATA, target) || [];

    indexes.push({
      columns,
      isUnique: options?.isUnique || false,
      name: options?.name,
    });

    Reflect.defineMetadata(INDEX_METADATA, indexes, target);
  };
}

/**
 * Unique index decorator - Shorthand for unique index
 */
export function Unique(columns: string[]): ClassDecorator {
  return Index(columns, { isUnique: true });
}

/**
 * Foreign key decorator - Defines a foreign key relationship
 *
 * @example
 * ```typescript
 * @ForeignKey({
 *   column: 'userId',
 *   referencedTable: 'users',
 *   referencedColumn: 'id',
 *   onDelete: 'CASCADE'
 * })
 * ```
 */
export function ForeignKey(options: {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  onUpdate?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  name?: string;
}): ClassDecorator {
  return (target: any) => {
    const foreignKeys: ForeignKeyMetadata[] =
      Reflect.getMetadata(FOREIGN_KEY_METADATA, target) || [];

    foreignKeys.push(options);

    Reflect.defineMetadata(FOREIGN_KEY_METADATA, foreignKeys, target);
  };
}
