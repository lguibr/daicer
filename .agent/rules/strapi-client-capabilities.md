---
trigger: always_on
---

# Strapi Client Capabilities

## Some Tasks Not All Could Use It To Retrieve Hot Data From the DB and Strapi instance.

This document defines the rules and capabilities for using the `@strapi/client` library within the application. It serves as a reference for implementing data fetching, mutations, and file management with the Strapi backend.

## 1. Client Initialization

Always initialize the client with the base API URL. For authenticated requests, include the `auth` token.

```typescript
import { strapi } from '@strapi/client';

// Public Client
const publicClient = strapi({ baseURL: 'http://localhost:1337/api' });

// Authenticated Client
const authClient = strapi({
  baseURL: 'http://localhost:1337/api',
  auth: process.env.API_TOKEN_SALT,
});
```

---

## 2. Capability Rules

### Rule 1: Retrieving Prompts (Paginated & Descending)

**Goal**: Fetch all prompts efficiently using pagination, sorted by newest first.
**Pattern**: Use a `do...while` or `while` loop with `page` and `pageSize` control.

```typescript
/**
 * Retrieves all prompts from the backend, handling pagination automatically.
 * Returns a flattened array of all prompt entities.
 */
async function getAllPrompts() {
  const client = strapi({ baseURL: 'http://localhost:1337/api' });
  const promptsCollection = client.collection('api::prompt.prompt');

  const allPrompts = [];
  let page = 1;
  const pageSize = 25; // Adjust based on expected data volume
  let hasMore = true;

  while (hasMore) {
    // Fetch a single page
    const response = await promptsCollection.find({
      sort: ['createdAt:desc'], // Descending order
      pagination: {
        page,
        pageSize,
      },
      populate: '*', // Ensure we get all fields (e.g. dynamic zones components)
    });

    const { data, meta } = response;

    // Add current page results to main list
    allPrompts.push(...data);

    // Check pagination metadata to determine if we need to continue
    if (meta?.pagination) {
      const { page: currentPage, pageCount } = meta.pagination;
      if (currentPage >= pageCount) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      // Fallback safety if meta is missing
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  return allPrompts;
}
```

### Rule 2: Ordered Room State Filtering

**Goal**: Get a list of rooms, filtered by status and valid sorting, including specific fields.
**Pattern**: Combine `filters`, `sort`, and `fields` in the query parameters.

```typescript
/**
 * Fetch active rooms sorted by creation date (newest first).
 * Useful for lobby or spectator views.
 */
async function getActiveRooms() {
  const client = strapi({ baseURL: 'http://localhost:1337/api' });
  const rooms = client.collection('api::room.room');

  const response = await rooms.find({
    // Filter: Only 'active' rooms
    filters: {
      status: { $eq: 'active' },
      isPrivate: { $eq: false }, // Example: Only public rooms
    },
    // Sort: Newest first
    sort: ['createdAt:desc'],
    // Optimization: Select only necessary fields
    fields: ['name', 'playerCount', 'maxPlayers', 'createdAt'],
    // Populate: Include host info if needed
    populate: {
      host: {
        fields: ['username', 'avatar'],
      },
    },
  });

  return response.data; // Returns list of room entities
}
```

### Rule 3: Single Type Configuration

**Goal**: Fetch global settings or singleton configs (e.g., Game Settings).
**Pattern**: Use `client.single`.

```typescript
async function getGameSettings() {
  const client = strapi({ baseURL: 'http://localhost:1337/api' });
  const settings = client.single('api::global-setting.global-setting');

  // No ID needed for single types
  const result = await settings.find({
    populate: ['defaultRules', 'maintenanceMode'],
  });

  return result.data.attributes;
}
```

---

## 3. Advanced Query Capabilities

### Filtering Syntax

The Strapi Client passes filters directly to the API. Use standard Strapi operators:

- `$eq`: Equal
- `$ne`: Not equal
- `$lt` / `$lte`: Less than / Less than or equal
- `$gt` / `$gte`: Greater than / Greater than or equal
- `$contains`: Case-sensitive string contains
- `$in`: value is in array

**Example: Complex Filter**

```typescript
const complexQuery = await client.collection('products').find({
  filters: {
    category: { $eq: 'tech' },
    price: { $gte: 100 },
    tags: { $in: ['new', 'featured'] },
  },
});
```

### Pagination

Using `pagination` parameters to handle large datasets.

```typescript
const page2 = await client.collection('logs').find({
  pagination: {
    page: 2,
    pageSize: 25,
  },
});
```

---

## 4. File Management Rules

### Uploading Assets

Always use `files.upload` with `fileInfo` for better metadata.

```typescript
async function uploadAvatar(fileBlob: Blob, userId: string) {
  const client = strapi({ baseURL: '...', auth: '...' });

  const uploaded = await client.files.upload(fileBlob, {
    fileInfo: {
      name: `avatar-${userId}.png`,
      alternativeText: `Avatar for user ${userId}`,
      caption: 'User uploaded avatar',
    },
  });

  return uploaded[0];
}
```

### Filtering Files

You can search the Media Library just like collections.

```typescript
const pdfs = await client.files.find({
  filters: {
    mime: { $contains: 'application/pdf' },
  },
  sort: ['createdAt:desc'],
});
```
