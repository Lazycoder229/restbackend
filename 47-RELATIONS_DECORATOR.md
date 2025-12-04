# Relations Decorator Documentation

## Overview

The Relations decorator provides ORM relationship definitions (OneToOne, OneToMany, ManyToOne, ManyToMany) for entity associations in Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Relation Types](#relation-types)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import {
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from "./builtin/relations.decorator";
```

---

## Relation Types

### One-to-One

One entity relates to exactly one other entity.

### One-to-Many

One entity relates to many other entities.

### Many-to-One

Many entities relate to one entity (inverse of One-to-Many).

### Many-to-Many

Many entities relate to many other entities (requires join table).

---

## API Reference

### `@OneToOne(type, options)`

Define one-to-one relationship.

### `@OneToMany(type, inverseSide)`

Define one-to-many relationship.

### `@ManyToOne(type, inverseSide)`

Define many-to-one relationship.

### `@ManyToMany(type, options)`

Define many-to-many relationship.

---

## Examples

### One-to-One Relationship

```typescript
@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "int", primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @OneToOne(() => Profile, (profile) => profile.user)
  @JoinColumn()
  profile: Profile;
}

@Entity("profiles")
export class Profile extends BaseEntity {
  @Column({ type: "int", primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: "text" })
  bio: string;

  @OneToOne(() => User, (user) => user.profile)
  user: User;
}
```

### One-to-Many / Many-to-One

```typescript
@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "int", primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}

@Entity("posts")
export class Post extends BaseEntity {
  @Column({ type: "int", primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: "author_id" })
  author: User;
}
```

### Many-to-Many Relationship

```typescript
@Entity("posts")
export class Post extends BaseEntity {
  @Column({ type: "int", primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable({
    name: "post_tags",
    joinColumn: "post_id",
    inverseJoinColumn: "tag_id",
  })
  tags: Tag[];
}

@Entity("tags")
export class Tag extends BaseEntity {
  @Column({ type: "int", primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: "varchar", length: 50 })
  name: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
```

### Using Relations

```typescript
// Load with relations
const user = await User.findById(1, {
  relations: ["posts", "profile"],
});

console.log(user.posts);
console.log(user.profile);

// Create with relations
const post = await Post.create({
  title: "My Post",
  author: user,
  tags: [tag1, tag2],
});
```

---

## Related Documentation

- [Entity Decorator](./ENTITY_DECORATOR.md)
- [Column Decorator](./COLUMN_DECORATOR.md)
- [Repository](./REPOSITORY.md)

---

**Last Updated**: December 4, 2025
