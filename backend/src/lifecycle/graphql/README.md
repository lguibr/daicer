# GraphQL Extension Layer

**Location**: `backend/src/lifecycle/graphql`

This directory bridges the gap between Strapi's core Content API and the specific, complex needs of the Daicer game engine. It serves as the authoritative definition for our custom API layer, strictly enforcing our architectural standards.

## Core Architectural Standards

### 1. GraphQL Over REST

We use **GraphQL** as the primary interface for client-server communication.

- **Why**: flexible data fetching, strong typing, and the ability to aggregate complex engine states (like "Time Frames") in a single round trip.
- **Rule**: All new features must be exposed via GraphQL. REST endpoints should only be used for webhooks or specific streaming cases where GraphQL is unsuitable.

### 2. The `documentId` Standard (Strapi 5)

Reflecting Strapi 5's usage of the **Document Service**, we exclusively use `documentId` for public resource identification.

- **NEVER** expose or use the internal numerical `id` (SQL ID) in the API for business logic.
- **ALWAYS** query, filter, and mutate using `documentId`.
- **Schema**: Ensure all custom types expose `documentId: ID!`.

```graphql
# ✅ Correct
type Room {
  documentId: ID!
  name: String
}

# ❌ Incorrect
type Room {
  id: ID! # This is the internal SQL ID, avoid using it.
}
```

### 3. Custom Resolvers & Business Logic

This directory is where we intercept and customize the default Strapi behavior or add completely new engine capabilities (like "Time Framing").

#### File Structure

- **`index.ts`** (or main entry): Registers the extension using `strapi.plugin('graphql').service('extension')`.
- **`type-defs.ts`**: Contains the Schema Definition Language (SDL) for new types, queries, and mutations.
- **`resolvers.ts`**: Implements `Query` and field-level resolvers (e.g., adding custom logic to `Room.messages`).
- **`mutation-resolvers.ts`**: specific handlers for state-changing operations (Engine actions, AI generation triggers).

#### Implementation Pattern

Resolvers must use the **Document Service** API (`strapi.documents`) rather than the deprecated Entity Service where possible, to ensure draft/publish workflow compatibility (if used) and future-proofing.

```typescript
// Example: Custom Resolver accessing Document Service
permissions: async (parent, args, context) => {
  const { documentId } = parent;
  return strapi.documents('api::resource.resource').findMany({
    filters: {
      related_entity: { documentId: documentId },
    },
  });
};
```

## Security Note

Custom resolvers defined here must explicitly handle authorization if they bypass standard Strapi policy. Use `resolversConfig` to set auth scopes or handle ownership checks manually within the resolver function.
