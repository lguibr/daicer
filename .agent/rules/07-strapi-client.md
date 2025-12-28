# 🔌 07. Strapi Client (The Data Bridge)

## 1. Zero-Magic Initialization

**Rule**: Always initialize the client explicitly.

- **Backend Scripts**: Use the `@strapi/client` library.
- **Auth**: Always pass `process.env.API_TOKEN_SALT` (or specific token) if accessing protected data.

## 2. The Fetching Standard

**Rule**: Use the Standard Pagination Loop for bulk data.

- **Why**: Strapi limits default responses to 25 items.
- **Pattern**:
  ```typescript
  let page = 1;
  while (hasMore) {
    const res = await client.collection('foo').find({ pagination: { page } });
    // process
    page++;
  }
  ```

## 3. Query Precision

**Rule**: Never fetch `*` unless necessary.

- **Fields**: Specify `fields: ['title', 'slug']`.
- **Populate**: Explicitly populate relations: `populate: { author: { fields: ['username'] } }`.
- **Filters**: Use strict operators (`, `, ``) to avoid over-fetching.

## 4. Type Safety

**Rule**: Interact with strongly-typed collections using the plural name convention.

- **Collections**: `api::room.room` (singular) -> `client.collection('api::room.room')`.
- **Single Types**: `api::global.global` -> `client.single('api::global.global')`.
