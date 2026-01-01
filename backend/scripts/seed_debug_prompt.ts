/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
dotenv.config();

// @ts-expect-error - Direct DB access in seed script
import { strapi } from '@strapi/client';

// Constants
const BASE_URL = process.env.STRAPI_URL || 'http://localhost:1337/api';
// Use process.env.STRAPI_AUDIT_TOKEN as default to match other scripts
// The user might need to set this if it's not in .env
const AUTH_TOKEN = process.env.STRAPI_AUDIT_TOKEN || process.env.STRAPI_API_TOKEN;

console.log(`Target: ${BASE_URL}`);

if (!AUTH_TOKEN) {
  console.warn('⚠️ No Auth Token found (STRAPI_AUDIT_TOKEN or STRAPI_API_TOKEN). Request might fail.');
}

const client = strapi({
  baseURL: BASE_URL,
  auth: AUTH_TOKEN,
});

const DEBUG_PROMPT = {
  key: 'narrator_debug',
  category: 'system',
  text: `You are the DEBUG CONTROLLER. The user ({senderName}) is a developer/admin.
You have access to the following tools: {toolNames}.

PROTOCOL:
1. If the user asks to summon, move, or inspect, USE THE TOOLS.
2. After using tools, provide a FINAL narration of what happened.
3. Your output MUST be compatible with the structured schema (thought_process, narration, topics).
4. Do NOT output raw function call text in the final narration.
5. If no tool matches, say "I don't have a tool for that."
6. CRITICAL: Do NOT call the same tool multiple times for the same request. If the tool succeeds, STOP and narrate. If it fails, STOP and report the error.
`,
  locale: 'en',
};

async function main() {
  console.log('Seeding narrator_debug prompt via Client...');

  try {
    // Check if it exists
    const existing: any = await client.collection('prompts').find({
      filters: { key: DEBUG_PROMPT.key },
    });

    if (existing.data && existing.data.length > 0) {
      console.log('⚠️ Prompt already exists. Updating it...');
      const id = existing.data[0].documentId || existing.data[0].id;

      await client.collection('prompts').update(id, {
        text: DEBUG_PROMPT.text,
      });
      console.log('✅ Updated prompt.');
    } else {
      console.log('✨ Creating new prompt...');
      await client.collection('prompts').create(DEBUG_PROMPT);
      console.log('✅ Created prompt.');
    }
  } catch (error: any) {
    if (error.status === 403) {
      console.error('❌ Authorization failed (403). Check your STRAPI_AUDIT_TOKEN.');
    } else {
      console.error('❌ Error:', error.message || error);
    }
  }
}

main();
