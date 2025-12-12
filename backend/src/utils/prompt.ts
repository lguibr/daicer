/**
 * Prompt retrieval utility
 * Fetches prompts from Strapi CMS with fallback to defaults
 */

import type { Core } from '@strapi/strapi';
import type { Language } from '../types/index';

declare var strapi: Core.Strapi;

/**
 * Get a prompt by key and locale
 * @param key - Prompt key (UID)
 * @param locale - Language code
 * @param defaultText - Fallback text if prompt not found
 */
export async function getPrompt(key: string, locale: Language, defaultText: string): Promise<string> {
  try {
    const prompts = await strapi.documents('api::prompt.prompt').findMany({
      filters: { key },
      locale: locale,
    });

    if (prompts && prompts.length > 0) {
      const prompt = prompts[0];
      // Strapi v5 document might have localized fields or be localized entry
      // If we query with locale, we get the localized entry
      if (prompt.text) {
        return prompt.text;
      }
    }
  } catch (error) {
    strapi.log.warn(`Failed to fetch prompt '${key}' for locale '${locale}':`, error);
  }

  return defaultText;
}

export async function getPrompts(
  keys: string[],
  locale: Language,
  defaults: Record<string, string>
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  // TODO: Optimize with a single query using 'in' operator if possible,
  // but Strapi v5 document service with locale might be tricky for findMany with multiple keys AND distinct locales mapping.
  // For now, parallel fetching is fine for a few prompts.

  await Promise.all(
    keys.map(async (key) => {
      results[key] = await getPrompt(key, locale, defaults[key] || '');
    })
  );

  return results;
}
