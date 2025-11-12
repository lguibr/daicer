/**
 * @file backend/src/scripts/parse-spells.ts
 * @description Parse raw_spell_book.html into structured JSON with spatial effect categorization
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/* eslint-disable no-underscore-dangle */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/* eslint-enable no-underscore-dangle */

interface ParsedSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: string | null;
  };
  duration: string;
  description: string;
  isRitual: boolean;
  effectShape: string;
  effectDimensions: Record<string, number>;
  higherLevels?: string;
}

/**
 * Extract text content from HTML element
 */
function extractText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Parse level and school from format like "level 3 - evocation" or "level 0 - conjuration"
 */
function parseLevelAndSchool(ecoleText: string): { level: number; school: string; isRitual: boolean } {
  const text = extractText(ecoleText);
  const levelMatch = text.match(/level (\d+)/i);
  const schoolMatch = text.match(/- ([a-z]+)/i);
  const isRitual = text.includes('ritual');

  return {
    level: Number.parseInt(levelMatch?.[1] ?? '0', 10),
    school: schoolMatch?.[1] ?? 'unknown',
    isRitual,
  };
}

/**
 * Parse components from format like "V, S, M (material description)"
 */
function parseComponents(componentText: string): {
  verbal: boolean;
  somatic: boolean;
  material: string | null;
} {
  const text = extractText(componentText);
  const hasVerbal = /\bV\b/.test(text);
  const hasSomatic = /\bS\b/.test(text);
  const materialMatch = text.match(/M \(([^)]+)\)/);

  return {
    verbal: hasVerbal,
    somatic: hasSomatic,
    material: materialMatch?.[1] ?? null,
  };
}

type EffectDimensions = Record<string, number>;

interface EffectContext {
  desc: string;
  rangeText: string;
}

type EffectDetection = (context: EffectContext) => { shape: string; dimensions: EffectDimensions } | null;

const parseFeetValue = (source: string, pattern: RegExp, defaultValue = 0): number => {
  const match = source.match(pattern);
  return Number.parseInt(match?.[1] ?? `${defaultValue}`, 10);
};

/**
 * Categorize spell effect shape based on description keywords
 */
function categorizeEffectShape(description: string, range: string): { shape: string; dimensions: EffectDimensions } {
  const context: EffectContext = {
    desc: description.toLowerCase(),
    rangeText: range.toLowerCase(),
  };

  const detections: EffectDetection[] = [
    ({ rangeText, desc }) => {
      if (rangeText === 'self' && !desc.includes('radius') && !desc.includes('aura') && !desc.includes('cone')) {
        return { shape: 'self_only', dimensions: {} };
      }
      return null;
    },
    ({ rangeText, desc }) => {
      if ((rangeText.includes('self') && desc.includes('radius')) || desc.includes('aura')) {
        return {
          shape: 'self_aura',
          dimensions: { radius: parseFeetValue(desc, /(\d+)[- ]foot[- ]radius/) },
        };
      }
      return null;
    },
    ({ desc }) => {
      if (desc.includes('cone')) {
        return {
          shape: 'cone',
          dimensions: { length: parseFeetValue(desc, /(\d+)[- ]foot[- ]cone/) },
        };
      }
      return null;
    },
    ({ desc }) => {
      if (desc.includes('line') && !desc.includes('line of sight')) {
        return {
          shape: 'line',
          dimensions: {
            length: parseFeetValue(desc, /(\d+)[- ]foot[- ]long/),
            width: parseFeetValue(desc, /(\d+)[- ]foot[- ]wide/, 5),
          },
        };
      }
      return null;
    },
    ({ desc }) => {
      if (desc.includes('radius') && desc.includes('sphere')) {
        return {
          shape: 'sphere',
          dimensions: { radius: parseFeetValue(desc, /(\d+)[- ]foot[- ]radius/) },
        };
      }
      return null;
    },
    ({ desc }) => {
      if (desc.includes('cylinder')) {
        return {
          shape: 'cylinder',
          dimensions: {
            radius: parseFeetValue(desc, /(\d+)[- ]foot[- ]radius/),
            height: parseFeetValue(desc, /(\d+)[- ]foot[- ](high|tall)/),
          },
        };
      }
      return null;
    },
    ({ desc }) => {
      if (desc.includes('cube')) {
        return {
          shape: 'cube',
          dimensions: { size: parseFeetValue(desc, /(\d+)[- ]foot[- ]cube/) },
        };
      }
      return null;
    },
    ({ desc }) => {
      if (desc.includes('wall')) {
        return {
          shape: 'wall',
          dimensions: {
            maxLength: parseFeetValue(desc, /(\d+)[- ]feet long/),
            height: parseFeetValue(desc, /(\d+)[- ]feet (high|tall)/),
            thickness: parseFeetValue(desc, /(\d+)[- ]foot thick/),
          },
        };
      }
      return null;
    },
    ({ rangeText, desc }) => {
      if (rangeText === 'touch' || desc.includes('creature within your reach')) {
        return { shape: 'melee_touch', dimensions: {} };
      }
      return null;
    },
    ({ desc }) => {
      if (desc.includes('ranged spell attack') || desc.includes('make a ranged spell attack')) {
        return { shape: 'ranged_single', dimensions: {} };
      }
      return null;
    },
    ({ rangeText }) => {
      if (rangeText.includes('feet')) {
        return { shape: 'ranged_single', dimensions: {} };
      }
      return null;
    },
  ];

  for (const detect of detections) {
    const result = detect(context);
    if (result) {
      return result;
    }
  }

  return { shape: 'custom', dimensions: {} };
}

/**
 * Generate slug ID from spell name
 */
function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse a single spell card
 */
function parseSpellCard(cardHtml: string): ParsedSpell | null {
  try {
    // Extract name
    const nameMatch = cardHtml.match(/<h1>([^<]+)<\/h1>/);
    if (!nameMatch) return null;
    const name = extractText(nameMatch[1] ?? '');

    // Extract school and level
    const ecoleMatch = cardHtml.match(/<div class="ecole">([^<]+)<\/div>/);
    // eslint-disable-next-line no-continue
    if (!ecoleMatch) return null;
    const { level, school, isRitual } = parseLevelAndSchool(ecoleMatch[1] ?? '');

    // Extract casting time
    const castingTimeMatch = cardHtml.match(/<strong>Casting Time<\/strong>:\s*([^<]+)/);
    const castingTime = extractText(castingTimeMatch?.[1] ?? '');

    // Extract range
    const rangeMatch = cardHtml.match(/<strong>Range<\/strong>:\s*([^<]+)/);
    const range = extractText(rangeMatch?.[1] ?? '');

    // Extract components
    const componentsMatch = cardHtml.match(/<strong>Components<\/strong>:\s*([^<]+(?:<[^>]+>[^<]*<\/[^>]+>)?[^<]*)/);
    const components = parseComponents(componentsMatch?.[1] ?? '');

    // Extract duration
    const durationMatch = cardHtml.match(/<strong>Duration<\/strong>:\s*([^<]+)/);
    const duration = extractText(durationMatch?.[1] ?? '');

    // Extract description
    const descMatch = cardHtml.match(/<div class="description">([\s\S]+?)<\/div>/);
    const description = extractText(descMatch?.[1] ?? '');

    // Extract "At Higher Levels" section
    const higherLevelsMatch = description.match(/At Higher Levels[.\s]+(.*?)$/i);
    const higherLevels = higherLevelsMatch?.[1];

    // Categorize effect shape
    const { shape, dimensions } = categorizeEffectShape(description, range);

    return {
      id: generateId(name),
      name,
      level,
      school,
      castingTime,
      range,
      components,
      duration,
      description,
      isRitual,
      effectShape: shape,
      effectDimensions: dimensions,
      higherLevels,
    };
  } catch (error) {
    console.error('Error parsing spell card:', error);
    return null;
  }
}

/**
 * Main parser function
 */
function parseSpellBook(): void {
  console.log('📚 Parsing spell book...\n');

  // Read HTML file
  const htmlPath = join(__dirname, '../../../seeds/game-data/raw_spell_book.html');
  const html = readFileSync(htmlPath, 'utf-8');

  // Split into individual spell cards - match all blocCarte variants
  const cardMatches = html.matchAll(/<div class="blocCarte[^>]*>([\s\S]*?)(?=<div class="blocCarte|$)/g);

  const spells: ParsedSpell[] = [];
  let skipped = 0;

  for (const match of cardMatches) {
    const spell = parseSpellCard(match[1] ?? '');
    if (spell) {
      spells.push(spell);
      console.log(`✓ Parsed: ${spell.name} (Level ${spell.level}, ${spell.effectShape})`);
    } else {
      skipped++;
    }
  }

  // Write to JSON
  const outputPath = join(__dirname, '../../../seeds/game-data/spells.json');
  writeFileSync(outputPath, JSON.stringify(spells, null, 2), 'utf-8');

  console.log(`\n✅ Parsed ${spells.length} spells`);
  console.log(`⚠️  Skipped ${skipped} cards`);
  console.log(`📄 Output: seeds/game-data/spells.json\n`);

  // Show shape distribution
  const shapeCount: Record<string, number> = {};
  spells.forEach((s) => {
    shapeCount[s.effectShape] = (shapeCount[s.effectShape] || 0) + 1;
  });

  console.log('📊 Effect Shape Distribution:');
  Object.entries(shapeCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([shape, count]) => {
      console.log(`  ${shape}: ${count}`);
    });
}

// Run parser
parseSpellBook();
