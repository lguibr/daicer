# Strapi Architecture and Usage Rules

This document serves as the single source of truth for Strapi usage, project structure, and API interactions within the Daicer project.

## Project Structure

The following structure defines the organization of the Strapi backend.

```
. # root of the application
├──── .strapi # auto-generated folder — do not update manually
│     └──── client # files used by bundlers to render the application
│           ├ index.html
│           └ app.js
├──── .tmp
├──── config # API configurations
│     ├ admin.ts
│     ├ api.ts
│     ├ cron-tasks.ts # optional, only if you created CRON tasks
│     ├ database.ts
│     ├ middlewares.ts
│     ├ plugins.ts
│     └ server.ts
├──── database
│     └──── migrations
├──── dist # build of the backend
│     └──── build # build of the admin panel
├──── node_modules # npm packages used by the project
├──── public # files accessible to the outside world
│     ├──── uploads
│     └ robots.txt
├──── src
│     ├──── admin # admin customization files
│     │     ├──── extensions # optional, files to extend the admin panel
│     │     ├──── app.example.tsx
│     │     ├──── webpack.config.example.js
|     |     ├──── tsconfig.json
│     ├──── api # business logic of the project split into subfolders per API
│     │     └──── (api-name)
│     │           ├──── content-types
│     │           │     └──── (content-type-name)
│     │           │           ├ lifecycles.ts
│     │           │           └ schema.json
│     │           ├──── controllers
│     │           ├──── middlewares
│     │           ├──── policies
│     │           ├──── routes
│     │           ├──── services
│     │           └ index.ts
│     ├──── components
│     │     └──── (category-name)
│     │           ├ (componentA).json
│     │           └ (componentB).json
│     ├──── extensions # files to extend installed plugins
│     │     └──── (plugin-to-be-extended)
│     │           ├──── content-types
│     │           │     └──── (content-type-name)
│     │           │           └ schema.json
│     │           └ strapi-server.js
│     ├──── middlewares
│     │     └──── (middleware-name)
│     │           ├ defaults.json
│     │           └ index.ts
│     ├──── plugins # local plugins files
│     │     └──── (plugin-name)
│     │           ├──── admin
│     │           │     └──── src
│     │           │           └ index.tsx
│     │           │           └ pluginId.ts
│     │           ├──── server
│     │           │     ├──── content-types
│     │           │     ├──── controllers
│     │           │     └──── policies
│     │           ├ package.json
│     │           ├ strapi-admin.js
│     │           └ strapi-server.js
│     ├─── policies

│     └ index.ts # include register(), bootstrap() and destroy() functions
├──── types
│     └──── generated
│           ├ components.d.ts # generated types for your components
│           └ contentTypes.d.ts # generated types for content-types
├ .env
├ .strapi-updater.json # used to track if users need to update their application
├ favicon.png
├ package.json
└ tsconfig.json
```

---

## Content Manager

The Content Manager is Strapi’s interface for browsing and editing entries. It allows writing content in fields, components, dynamic zones, and relational fields.

---

## Internationalization (i18n)

Internationalization manages content in multiple locales directly from the admin panel.

**Key Features:**

- **Locales**: Manage content in different languages.
- **Configuration**: Enable per content-type or field in Content-type Builder.
- **Settings**: Add/manage locales in _Settings > Global Settings > Internationalization_.
- **Usage**: Switch locales in Content Manager. Content is managed one locale at a time.
- **AI Translations**: Available if configured.

**Code-based Configuration:**
`STRAPI_PLUGIN_I18N_INIT_LOCALE_CODE` can set the default locale.

---

## GraphQL API

We prefer GraphQL over REST for frontend data fetching.

### Prerequisites

`@strapi/plugin-graphql` must be installed. Endpoint: `/graphql`.

### Key Concepts & Rules

1.  **Document ID**: Use `documentId` instead of numeric `id` for querying and mutations (except for media files which still use `id` in mutations currently).
2.  **Shadow CRUD**: The plugin automatically generates queries and mutations for content types.
3.  **Media Upload**: Not supported directly in GraphQL (use REST `/upload`). Updates/Deletes use numeric `id`.

### Queries

**Fetching a single document:**

```graphql
query {
  restaurant(documentId: "a1b2c3d4e5d6f7g8h9i0jkl") {
    name
    description
  }
}
```

**Fetching multiple documents:**
Use flat queries or Relay-style connections (`_connection`).

_Flat:_

```graphql
query {
  restaurants {
    documentId
    title
  }
}
```

_Relay-style (for pagination):_

```graphql
{
  restaurants_connection {
    nodes {
      documentId
      title
    }
    pageInfo {
      page
      pageSize
      total
    }
  }
}
```

**Relations:**

```graphql
{
  restaurants {
    documentId
    categories {
      documentId
      name
    }
  }
}
```

**Dynamic Zones:**
Use fragments `...on ComponentCategoryName` with `__typename`.

```graphql
{
  restaurants {
    dz {
      __typename
      ... on ComponentDefaultClosingperiod {
        label
      }
    }
  }
}
```

### Filters

Syntax: `filters: { field: { operator: value } }`

**Common Operators:**

- `eq`, `ne`, `lt`, `gt`
- `contains`, `startsWith`
- `in`, `notIn`
- `null`, `notNull`
- `and`, `or`, `not`

Example:

```graphql
{
  restaurants(filters: { name: { contains: "Pizzeria" } }) {
    name
  }
}
```

### Sorting

Syntax: `sort: "field:order"` (asc/desc)

```graphql
{
  restaurants(sort: ["name:asc", "averagePrice:desc"]) {
    documentId
    name
  }
}
```

### Pagination

Using `pagination` in connection queries.

- **Page/PageSize**: `{ page: 1, pageSize: 10 }`
- **Start/Limit**: `{ start: 0, limit: 10 }`

### Mutations

**Create:**

```graphql
mutation CreateRestaurant($data: RestaurantInput!) {
  createRestaurant(data: { name: "New Place" }) {
    documentId
    name
  }
}
```

**Update:**

```graphql
mutation UpdateRestaurant($documentId: ID!, $data: RestaurantInput!) {
  updateRestaurant(documentId: "...", data: { name: "Updated" }) {
    documentId
  }
}
```

**Delete:**

```graphql
mutation DeleteRestaurant($documentId: ID!) {
  deleteRestaurant(documentId: "...") {
    documentId
  }
}
```

**Localization in Mutations:**
Pass `locale` argument to create/update localized versions.

**Media Mutations:**
Use numeric `id`.

```graphql
mutation UpdateFile {
  updateUploadFile(id: 3, info: { alternativeText: "New Alt" }) {
    url
  }
}
```

---

## Document Concept (Strapi 5)

A **Document** represents all variations (locales, draft/published) of a content entry.

- **Document ID**: Unique identifier for the document container.
- **Variations**: Draft vs Published, English vs French, etc.

To interact with documents:

- **Backend**: Use Document Service API.
- **Frontend**: Query specific variations via REST/GraphQL (e.g., `status: DRAFT`, `locale: "fr"`).
