/**
 * Shared Strapi Client Singleton
 * usage: import { getStrapiClient } from './utils/strapi-client';
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { strapi } = require('@strapi/client');
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from root if not already loaded
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let clientInstance: ReturnType<typeof strapi> | null = null;

export function getStrapiClient() {
  if (clientInstance) return clientInstance;

  let baseURL = process.env.VITE_API_URL || 'http://localhost:1337';
  if (!baseURL.endsWith('/api')) baseURL = `${baseURL}/api`;

  const token = process.env.STRAPI_AUDIT_TOKEN;

  if (!token) {
    throw new Error('STRAPI_AUDIT_TOKEN is missing in .env');
  }

  console.log(`[StrapiClient] Initializing connection to ${baseURL}`);

  clientInstance = strapi({
    baseURL,
    auth: token,
  });

  return clientInstance;
}

/**
 * Fetch all records from a collection, handling pagination automatically.
 */
export async function getAll<T>(collection: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const client = getStrapiClient();
  let page = 1;
  const pageSize = 100;
  let allResults: T[] = [];
  let total = 0;

  do {
    const response = await client.collection(collection).find({
      ...params,
      pagination: {
        page,
        pageSize,
      },
    });

    if (response.data) {
      allResults = allResults.concat(response.data);
      total = response.meta?.pagination?.total || 0;
    }

    page++;
  } while (allResults.length < total);

  console.log(`[StrapiClient] Fetched ${allResults.length} records from ${collection}`);
  return allResults;
}

/**
 * Update a specific entity by Document ID (Strapi v5 standard).
 */
export async function updateEntity<T>(collection: string, documentId: string, data: Partial<T>): Promise<T | null> {
  const client = getStrapiClient();
  try {
    const response = await client.collection(collection).update(documentId, data);
    return response.data;
  } catch (error) {
    console.error(`[StrapiClient] Failed to update ${collection} ${documentId}:`, error);
    return null;
  }
}
