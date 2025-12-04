import "reflect-metadata";

/**
 * Relationship metadata keys
 */
export const RELATION_METADATA = Symbol("relation");
export const SOFT_DELETE_METADATA = Symbol("softDelete");

/**
 * Relation types
 */
export enum RelationType {
  ONE_TO_ONE = "oneToOne",
  ONE_TO_MANY = "oneToMany",
  MANY_TO_ONE = "manyToOne",
  MANY_TO_MANY = "manyToMany",
}

/**
 * Relation metadata
 */
export interface RelationMetadata {
  type: RelationType;
  target: () => any;
  propertyKey: string;
  inverseSide?: string;
  joinColumn?: string;
  joinTable?: string;
  eager?: boolean;
  cascade?: boolean;
}

/**
 * OneToOne relation decorator
 *
 * @example
 * ```typescript
 * @Entity('users')
 * class User {
 *   @OneToOne(() => Profile, 'user')
 *   profile: Profile;
 * }
 *
 * @Entity('profiles')
 * class Profile {
 *   @ManyToOne(() => User, 'profile')
 *   @Column({ type: 'int' })
 *   user_id: number;
 *
 *   user?: User;
 * }
 * ```
 */
export function OneToOne(
  target: () => any,
  inverseSide?: string,
  options: { eager?: boolean; cascade?: boolean; joinColumn?: string } = {}
): PropertyDecorator {
  return (targetClass: any, propertyKey: string | symbol) => {
    const relations: RelationMetadata[] =
      Reflect.getMetadata(RELATION_METADATA, targetClass.constructor) || [];

    relations.push({
      type: RelationType.ONE_TO_ONE,
      target,
      propertyKey: propertyKey as string,
      inverseSide,
      eager: options.eager,
      cascade: options.cascade,
      joinColumn: options.joinColumn,
    });

    Reflect.defineMetadata(
      RELATION_METADATA,
      relations,
      targetClass.constructor
    );
  };
}

/**
 * OneToMany relation decorator
 *
 * @example
 * ```typescript
 * @Entity('users')
 * class User {
 *   @OneToMany(() => Post, 'user')
 *   posts: Post[];
 * }
 *
 * @Entity('posts')
 * class Post {
 *   @ManyToOne(() => User, 'posts')
 *   @Column({ type: 'int' })
 *   user_id: number;
 *
 *   user?: User;
 * }
 * ```
 */
export function OneToMany(
  target: () => any,
  inverseSide?: string,
  options: { eager?: boolean; cascade?: boolean } = {}
): PropertyDecorator {
  return (targetClass: any, propertyKey: string | symbol) => {
    const relations: RelationMetadata[] =
      Reflect.getMetadata(RELATION_METADATA, targetClass.constructor) || [];

    relations.push({
      type: RelationType.ONE_TO_MANY,
      target,
      propertyKey: propertyKey as string,
      inverseSide,
      eager: options.eager,
      cascade: options.cascade,
    });

    Reflect.defineMetadata(
      RELATION_METADATA,
      relations,
      targetClass.constructor
    );
  };
}

/**
 * ManyToOne relation decorator
 *
 * @example
 * ```typescript
 * @Entity('posts')
 * class Post {
 *   @ManyToOne(() => User, 'posts', { eager: true })
 *   @Column({ type: 'int' })
 *   user_id: number;
 *
 *   user?: User;
 * }
 * ```
 */
export function ManyToOne(
  target: () => any,
  inverseSide?: string,
  options: { eager?: boolean; cascade?: boolean; joinColumn?: string } = {}
): PropertyDecorator {
  return (targetClass: any, propertyKey: string | symbol) => {
    const relations: RelationMetadata[] =
      Reflect.getMetadata(RELATION_METADATA, targetClass.constructor) || [];

    relations.push({
      type: RelationType.MANY_TO_ONE,
      target,
      propertyKey: propertyKey as string,
      inverseSide,
      eager: options.eager,
      cascade: options.cascade,
      joinColumn: options.joinColumn,
    });

    Reflect.defineMetadata(
      RELATION_METADATA,
      relations,
      targetClass.constructor
    );
  };
}

/**
 * ManyToMany relation decorator
 *
 * @example
 * ```typescript
 * @Entity('posts')
 * class Post {
 *   @ManyToMany(() => Tag, 'posts', { joinTable: 'post_tags' })
 *   tags: Tag[];
 * }
 *
 * @Entity('tags')
 * class Tag {
 *   @ManyToMany(() => Post, 'tags')
 *   posts: Post[];
 * }
 * ```
 */
export function ManyToMany(
  target: () => any,
  inverseSide?: string,
  options: {
    eager?: boolean;
    cascade?: boolean;
    joinTable?: string;
  } = {}
): PropertyDecorator {
  return (targetClass: any, propertyKey: string | symbol) => {
    const relations: RelationMetadata[] =
      Reflect.getMetadata(RELATION_METADATA, targetClass.constructor) || [];

    relations.push({
      type: RelationType.MANY_TO_MANY,
      target,
      propertyKey: propertyKey as string,
      inverseSide,
      eager: options.eager,
      cascade: options.cascade,
      joinTable: options.joinTable,
    });

    Reflect.defineMetadata(
      RELATION_METADATA,
      relations,
      targetClass.constructor
    );
  };
}

/**
 * Get relations metadata
 */
export function getRelations(target: any): RelationMetadata[] {
  return Reflect.getMetadata(RELATION_METADATA, target) || [];
}

/**
 * Soft delete decorator
 * Marks entity for soft deletion support
 *
 * @example
 * ```typescript
 * @Entity('posts')
 * @SoftDelete()
 * class Post {
 *   @Column({ type: 'timestamp', nullable: true })
 *   deleted_at?: Date;
 * }
 * ```
 */
export function SoftDelete(columnName: string = "deleted_at"): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(SOFT_DELETE_METADATA, columnName, target);
  };
}

/**
 * Check if entity uses soft deletes
 */
export function usesSoftDelete(target: any): string | undefined {
  return Reflect.getMetadata(SOFT_DELETE_METADATA, target);
}

/**
 * Relation loader helper
 */
export class RelationLoader {
  /**
   * Load eager relations for entity
   */
  static async loadEagerRelations<T>(
    entity: T,
    entityClass: any,
    loader: (relation: RelationMetadata) => Promise<any>
  ): Promise<T> {
    const relations = getRelations(entityClass);
    const eagerRelations = relations.filter((r) => r.eager);

    for (const relation of eagerRelations) {
      const data = await loader(relation);
      (entity as any)[relation.propertyKey] = data;
    }

    return entity;
  }

  /**
   * Load specific relation
   */
  static async loadRelation<T>(
    entity: T,
    relationName: string,
    entityClass: any,
    loader: (relation: RelationMetadata) => Promise<any>
  ): Promise<T> {
    const relations = getRelations(entityClass);
    const relation = relations.find((r) => r.propertyKey === relationName);

    if (!relation) {
      throw new Error(`Relation ${relationName} not found`);
    }

    const data = await loader(relation);
    (entity as any)[relation.propertyKey] = data;

    return entity;
  }
}

/**
 * Soft delete query helper
 */
export class SoftDeleteHelper {
  /**
   * Add soft delete condition to query
   */
  static addSoftDeleteCondition(
    query: string,
    entityClass: any,
    includeDeleted: boolean = false
  ): string {
    if (includeDeleted) {
      return query;
    }

    const columnName = usesSoftDelete(entityClass);
    if (!columnName) {
      return query;
    }

    if (query.toLowerCase().includes("where")) {
      return `${query} AND ${columnName} IS NULL`;
    } else {
      return `${query} WHERE ${columnName} IS NULL`;
    }
  }

  /**
   * Soft delete entity
   */
  static getSoftDeleteQuery(
    tableName: string,
    entityClass: any,
    id: any
  ): string {
    const columnName = usesSoftDelete(entityClass);
    if (!columnName) {
      throw new Error("Entity does not support soft deletes");
    }

    return `UPDATE ${tableName} SET ${columnName} = NOW() WHERE id = ${id}`;
  }

  /**
   * Restore soft deleted entity
   */
  static getRestoreQuery(tableName: string, entityClass: any, id: any): string {
    const columnName = usesSoftDelete(entityClass);
    if (!columnName) {
      throw new Error("Entity does not support soft deletes");
    }

    return `UPDATE ${tableName} SET ${columnName} = NULL WHERE id = ${id}`;
  }

  /**
   * Force delete (permanent)
   */
  static getForceDeleteQuery(tableName: string, id: any): string {
    return `DELETE FROM ${tableName} WHERE id = ${id}`;
  }
}
