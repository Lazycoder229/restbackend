# GraphQL Service Documentation

## Overview

The GraphQLService provides GraphQL support with schema generation, resolvers, subscriptions, and integration with Fynix's dependency injection system.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  GraphQLService,
  Resolver,
  Query,
  Mutation,
} from "./builtin/graphql.service";
```

---

## Configuration

```typescript
const graphql = new GraphQLService({
  typePaths: ["**/*.graphql"],
  playground: true,
  introspection: true,
  context: ({ req }) => ({ user: req.user }),
});
```

---

## API Reference

### `@Resolver(typeName)`

Define GraphQL resolver class.

### `@Query(returnType)`

Define query resolver.

### `@Mutation(returnType)`

Define mutation resolver.

### `@Subscription(returnType)`

Define subscription resolver.

---

## Examples

### GraphQL Schema

```graphql
# schema.graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
}

type Query {
  users: [User!]!
  user(id: ID!): User
  posts: [Post!]!
}

type Mutation {
  createUser(name: String!, email: String!): User!
  createPost(title: String!, content: String!, authorId: ID!): Post!
}
```

### Resolvers

```typescript
@Resolver("User")
export class UserResolver {
  @Query(() => [User])
  async users() {
    return await User.findAll();
  }

  @Query(() => User)
  async user(@Args("id") id: string) {
    return await User.findById(id);
  }

  @Mutation(() => User)
  async createUser(@Args("name") name: string, @Args("email") email: string) {
    return await User.create({ name, email });
  }

  @ResolveField(() => [Post])
  async posts(@Parent() user: User) {
    return await Post.findByUserId(user.id);
  }
}
```

### Setup GraphQL

```typescript
@Module({
  providers: [GraphQLService, UserResolver, PostResolver],
})
export class AppModule {}

const app = await FynixFactory.create(AppModule);

const graphql = app.get(GraphQLService);
graphql.enableGraphQL(app, "/graphql");

await app.listen(3000);

// GraphQL Playground: http://localhost:3000/graphql
```

---

## Related Documentation

- [WebSocket Service](./WEBSOCKET_SERVICE.md)
- [Controllers](./CONTROLLER_DECORATOR.md)

---

**Last Updated**: December 4, 2025
