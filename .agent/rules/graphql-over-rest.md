# GraphQL Over REST Rule

> **Rule**: USE GRAPHQL FOR ALL BACKEND INTERACTIONS. DO NOT USE REST API.

## 1. Core Principle

We strictly enforce the use of **GraphQL** for all data fetching and mutations within the Daicer application. This ensures type safety, prevents over-fetching, and maintains a consistent API interaction pattern across the monorepo.

**Why?**

- **Type Safety**: GraphQL schemas provide a single source of truth for types.
- **Efficiency**: Fetch exactly what you need, nothing more.
- **Consistency**: Unified error handling and response structure.
- **Development Experience**: Better tooling integration (Apollo, Codegen).

## 2. Critical Implementation Details

### 🔑 documentId vs id

**ALWAYS use `documentId`** for identifying and referencing entities in Strapi v5+.

- ❌ `id`: Legacy numerical ID. Do not use for lookups or mutations.
- ✅ `documentId`: The public-facing string identifier for documents.

### 📦 Input Types

Use strongly typed inputs defined in the schema (e.g., `RoomInput`, `createRoomInput`). Avoid raw JSON arguments unless specifically required by a dynamic field.

### 🧼 Clean Code Standards

- **Naming**: Use `SCREAMING_SNAKE_CASE` for exported query/mutation constants (e.g., `GET_ROOM_QUERY`, `CREATE_ROOM_MUTATION`).
- **Operation Names**: Always name your operations in the query definition (e.g., `query GetRoom(...)`).
- **Colocation**: Define queries close to where they are used, or in centralized `graphql/` modules if shared.

## 3. Examples

### ✅ Query Example: Fetching a Room

Notice the use of `documentId` and specific field selection.

```graphql
query GetRoom($documentId: ID!) {
  room(documentId: $documentId) {
    documentId
    roomId
    code
    phase
    settings
    owner {
      documentId
      username
    }
    players {
      documentId
      name
      isReady
      character {
        documentId
        name
        baseStats {
          strength
          dexterity
        }
      }
    }
  }
}
```

### ✅ Mutation Example: Creating a Room

Passing a structured `data` object.

```graphql
mutation CreateRoom($data: RoomInput!) {
  createRoom(data: $data) {
    documentId
    roomId
    code
    players {
      documentId
    }
  }
}
```

### ✅ Component Implementation (Apollo Client)

```typescript
import { useQuery } from '@apollo/client';
import { GET_ROOM_QUERY } from '@/graphql/queries';

const { data, loading, error } = useQuery(GET_ROOM_QUERY, {
  variables: { documentId: 'doc-123' },
});
```

## 4. Migration Guide

If you encounter legacy REST calls (`axios.get('/api/rooms/...')`):

1. **Identify**: Locate the endpoint and required data.
2. **Translate**: Write the equivalent GraphQL query/mutation.
3. **Replace**: Switch to `useQuery` or `useMutation`.
4. **Verify**: Ensure all fields (especially relation depths) are correctly populated.
