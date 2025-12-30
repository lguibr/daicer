/**
 * Shared Strapi Client Singleton
 * usage: import { getStrapiClient } from './utils/strapi-client';
 */

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
