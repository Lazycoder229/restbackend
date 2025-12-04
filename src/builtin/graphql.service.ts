/**
 * GraphQL support for FynixJS
 */

import "reflect-metadata";

/**
 * GraphQL metadata keys
 */
export const GRAPHQL_RESOLVER = Symbol("graphqlResolver");
export const GRAPHQL_QUERY = Symbol("graphqlQuery");
export const GRAPHQL_MUTATION = Symbol("graphqlMutation");
export const GRAPHQL_FIELD = Symbol("graphqlField");
export const GRAPHQL_ARGS = Symbol("graphqlArgs");

/**
 * Resolver decorator
 *
 * @example
 * ```typescript
 * @Resolver('User')
 * export class UserResolver {
 *   @Query()
 *   async users() {
 *     return await User.findAll();
 *   }
 * }
 * ```
 */
export function Resolver(typeName?: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(GRAPHQL_RESOLVER, typeName || target.name, target);
  };
}

/**
 * Query decorator
 */
export function Query(options?: {
  name?: string;
  description?: string;
  type?: any;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const queries =
      Reflect.getMetadata(GRAPHQL_QUERY, target.constructor) || [];
    queries.push({
      name: options?.name || propertyKey,
      handler: propertyKey,
      description: options?.description,
      type: options?.type,
    });
    Reflect.defineMetadata(GRAPHQL_QUERY, queries, target.constructor);
  };
}

/**
 * Mutation decorator
 */
export function Mutation(options?: {
  name?: string;
  description?: string;
  type?: any;
}): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const mutations =
      Reflect.getMetadata(GRAPHQL_MUTATION, target.constructor) || [];
    mutations.push({
      name: options?.name || propertyKey,
      handler: propertyKey,
      description: options?.description,
      type: options?.type,
    });
    Reflect.defineMetadata(GRAPHQL_MUTATION, mutations, target.constructor);
  };
}

/**
 * Field decorator for GraphQL types
 */
export function Field(options?: {
  type?: any;
  nullable?: boolean;
  description?: string;
}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const fields = Reflect.getMetadata(GRAPHQL_FIELD, target.constructor) || [];
    fields.push({
      name: propertyKey,
      type: options?.type,
      nullable: options?.nullable,
      description: options?.description,
    });
    Reflect.defineMetadata(GRAPHQL_FIELD, fields, target.constructor);
  };
}

/**
 * Args decorator for resolver parameters
 */
export function Args(name?: string): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;

    const args = Reflect.getMetadata(GRAPHQL_ARGS, target, propertyKey) || [];
    args.push({
      index: parameterIndex,
      name: name || `arg${parameterIndex}`,
    });
    Reflect.defineMetadata(GRAPHQL_ARGS, args, target, propertyKey);
  };
}

/**
 * GraphQL schema builder
 */
export class GraphQLSchemaBuilder {
  private types: string[] = [];
  private queries: string[] = [];
  private mutations: string[] = [];
  private resolvers: any = {};

  /**
   * Add resolver
   */
  addResolver(resolverInstance: any): this {
    const resolverClass = resolverInstance.constructor;
    const queries = Reflect.getMetadata(GRAPHQL_QUERY, resolverClass) || [];
    const mutations =
      Reflect.getMetadata(GRAPHQL_MUTATION, resolverClass) || [];

    // Add queries
    for (const query of queries) {
      this.queries.push(`${query.name}: ${query.type || "String"}`);

      if (!this.resolvers.Query) {
        this.resolvers.Query = {};
      }

      this.resolvers.Query[query.name] = async (
        _parent: any,
        args: any,
        context: any
      ) => {
        return resolverInstance[query.handler](args, context);
      };
    }

    // Add mutations
    for (const mutation of mutations) {
      this.mutations.push(`${mutation.name}: ${mutation.type || "String"}`);

      if (!this.resolvers.Mutation) {
        this.resolvers.Mutation = {};
      }

      this.resolvers.Mutation[mutation.name] = async (
        _parent: any,
        args: any,
        context: any
      ) => {
        return resolverInstance[mutation.handler](args, context);
      };
    }

    return this;
  }

  /**
   * Add type
   */
  addType(name: string, fields: Record<string, string>): this {
    let typeDef = `type ${name} {\n`;
    for (const [field, type] of Object.entries(fields)) {
      typeDef += `  ${field}: ${type}\n`;
    }
    typeDef += `}`;
    this.types.push(typeDef);
    return this;
  }

  /**
   * Build schema
   */
  build(): string {
    let schema = "";

    // Add types
    if (this.types.length > 0) {
      schema += this.types.join("\n\n") + "\n\n";
    }

    // Add Query type
    if (this.queries.length > 0) {
      schema += "type Query {\n";
      schema += this.queries.map((q) => `  ${q}`).join("\n");
      schema += "\n}\n\n";
    }

    // Add Mutation type
    if (this.mutations.length > 0) {
      schema += "type Mutation {\n";
      schema += this.mutations.map((m) => `  ${m}`).join("\n");
      schema += "\n}\n";
    }

    return schema;
  }

  /**
   * Get resolvers
   */
  getResolvers(): any {
    return this.resolvers;
  }
}

/**
 * Simple GraphQL executor (without external dependencies)
 */
export class GraphQLExecutor {
  constructor(_schema: string, private resolvers: any) {}

  /**
   * Execute GraphQL query
   */
  async execute(query: string, variables?: any, context?: any): Promise<any> {
    try {
      // Parse query (simplified)
      const { operation, field, args } = this.parseQuery(query);

      if (operation === "query" && this.resolvers.Query?.[field]) {
        const result = await this.resolvers.Query[field](
          null,
          this.parseArgs(args, variables),
          context
        );
        return { data: { [field]: result } };
      }

      if (operation === "mutation" && this.resolvers.Mutation?.[field]) {
        const result = await this.resolvers.Mutation[field](
          null,
          this.parseArgs(args, variables),
          context
        );
        return { data: { [field]: result } };
      }

      return { errors: [{ message: `Unknown field: ${field}` }] };
    } catch (error: any) {
      return { errors: [{ message: error.message }] };
    }
  }

  /**
   * Parse GraphQL query (simplified)
   */
  private parseQuery(query: string): {
    operation: string;
    field: string;
    args: string;
  } {
    const match = query.match(/(query|mutation)\s*\{?\s*(\w+)(?:\((.*?)\))?/);

    if (!match) {
      throw new Error("Invalid query format");
    }

    return {
      operation: match[1],
      field: match[2],
      args: match[3] || "",
    };
  }

  /**
   * Parse arguments
   */
  private parseArgs(argsStr: string, variables: any = {}): any {
    if (!argsStr) return {};

    const args: any = {};
    const pairs = argsStr.split(",").map((s) => s.trim());

    for (const pair of pairs) {
      const [key, value] = pair.split(":").map((s) => s.trim());

      if (value.startsWith("$")) {
        // Variable reference
        args[key] = variables[value.substring(1)];
      } else if (value.startsWith('"') && value.endsWith('"')) {
        // String
        args[key] = value.slice(1, -1);
      } else if (!isNaN(Number(value))) {
        // Number
        args[key] = Number(value);
      } else {
        // Boolean or other
        args[key] = value === "true" ? true : value === "false" ? false : value;
      }
    }

    return args;
  }
}

/**
 * GraphQL HTTP handler
 */
export class GraphQLHandler {
  constructor(private executor: GraphQLExecutor) {}

  /**
   * Handle GraphQL request
   */
  async handle(req: any, res: any): Promise<void> {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    try {
      const body = req.body || {};
      const { query, variables } = body;

      if (!query) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Query required" }));
        return;
      }

      const result = await this.executor.execute(query, variables, {
        req,
        res,
      });

      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    } catch (error: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ errors: [{ message: error.message }] }));
    }
  }
}

/**
 * Create GraphQL schema builder
 */
export function createGraphQLSchema(): GraphQLSchemaBuilder {
  return new GraphQLSchemaBuilder();
}

/**
 * Create GraphQL executor
 */
export function createGraphQLExecutor(
  schema: string,
  resolvers: any
): GraphQLExecutor {
  return new GraphQLExecutor(schema, resolvers);
}

/**
 * Create GraphQL handler
 */
export function createGraphQLHandler(
  executor: GraphQLExecutor
): GraphQLHandler {
  return new GraphQLHandler(executor);
}
