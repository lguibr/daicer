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
    level: levelMatch ? parseInt(levelMatch[1], 10) : 0,
    school: schoolMatch ? schoolMatch[1] : 'unknown',
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
    material: materialMatch ? materialMatch[1] : null,
  };
}

/**
 * Categorize spell effect shape based on description keywords
 */
function categorizeEffectShape(
  description: string,
  range: string
): {
  shape: string;
  dimensions: Record<string, number>;
} {
  const desc = description.toLowerCase();
  const rangeText = range.toLowerCase();

  // Self-only (no area effect)
  if (rangeText === 'self' && !desc.includes('radius') && !desc.includes('aura') && !desc.includes('cone')) {
    return { shape: 'self_only', dimensions: {} };
  }

  // Self aura (moves with caster)
  if ((rangeText.includes('self') && desc.includes('radius')) || desc.includes('aura')) {
    const radiusMatch = desc.match(/(\d+)[- ]foot[- ]radius/);
    return {
      shape: 'self_aura',
      dimensions: { radius: radiusMatch ? parseInt(radiusMatch[1], 10) : 0 },
    };
  }

  // Cone
  if (desc.includes('cone')) {
    const lengthMatch = desc.match(/(\d+)[- ]foot[- ]cone/);
    return {
      shape: 'cone',
      dimensions: { length: lengthMatch ? parseInt(lengthMatch[1], 10) : 0 },
    };
  }

  // Line (straight through)
  if (desc.includes('line') && !desc.includes('line of sight')) {
    const lengthMatch = desc.match(/(\d+)[- ]foot[- ]long/);
    const widthMatch = desc.match(/(\d+)[- ]foot[- ]wide/);
    return {
      shape: 'line',
      dimensions: {
        length: lengthMatch ? parseInt(lengthMatch[1], 10) : 0,
        width: widthMatch ? parseInt(widthMatch[1], 10) : 5,
      },
    };
  }

  // Sphere/radius
  if (desc.includes('radius') && desc.includes('sphere')) {
    const radiusMatch = desc.match(/(\d+)[- ]foot[- ]radius/);
    return {
      shape: 'sphere',
      dimensions: { radius: radiusMatch ? parseInt(radiusMatch[1], 10) : 0 },
    };
  }

  // Cylinder
  if (desc.includes('cylinder')) {
    const radiusMatch = desc.match(/(\d+)[- ]foot[- ]radius/);
    const heightMatch = desc.match(/(\d+)[- ]foot[- ](high|tall)/);
    return {
      shape: 'cylinder',
      dimensions: {
        radius: radiusMatch ? parseInt(radiusMatch[1], 10) : 0,
        height: heightMatch ? parseInt(heightMatch[1], 10) : 0,
      },
    };
  }

  // Cube
  if (desc.includes('cube')) {
    const sizeMatch = desc.match(/(\d+)[- ]foot[- ]cube/);
    return {
      shape: 'cube',
      dimensions: { size: sizeMatch ? parseInt(sizeMatch[1], 10) : 0 },
    };
  }

  // Wall
  if (desc.includes('wall')) {
    const lengthMatch = desc.match(/(\d+)[- ]feet long/);
    const heightMatch = desc.match(/(\d+)[- ]feet (high|tall)/);
    const thickMatch = desc.match(/(\d+)[- ]foot thick/);
    return {
      shape: 'wall',
      dimensions: {
        maxLength: lengthMatch ? parseInt(lengthMatch[1], 10) : 0,
        height: heightMatch ? parseInt(heightMatch[1], 10) : 0,
        thickness: thickMatch ? parseInt(thickMatch[1], 10) : 0,
      },
    };
  }

  // Melee touch
  if (rangeText === 'touch' || desc.includes('creature within your reach')) {
    return { shape: 'melee_touch', dimensions: {} };
  }

  // Ranged single target (spell attack)
  if (desc.includes('ranged spell attack') || desc.includes('make a ranged spell attack')) {
    return { shape: 'ranged_single', dimensions: {} };
  }

  // Default to ranged single if has range in feet
  if (rangeText.includes('feet')) {
    return { shape: 'ranged_single', dimensions: {} };
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
    const name = extractText(nameMatch[1]);

    // Extract school and level
    const ecoleMatch = cardHtml.match(/<div class="ecole">([^<]+)<\/div>/);
    // eslint-disable-next-line no-continue
    if (!ecoleMatch) return null;
    const { level, school, isRitual } = parseLevelAndSchool(ecoleMatch[1]);

    // Extract casting time
    const castingTimeMatch = cardHtml.match(/<strong>Casting Time<\/strong>:\s*([^<]+)/);
    const castingTime = castingTimeMatch ? extractText(castingTimeMatch[1]) : '';

    // Extract range
    const rangeMatch = cardHtml.match(/<strong>Range<\/strong>:\s*([^<]+)/);
    const range = rangeMatch ? extractText(rangeMatch[1]) : '';

    // Extract components
    const componentsMatch = cardHtml.match(/<strong>Components<\/strong>:\s*([^<]+(?:<[^>]+>[^<]*<\/[^>]+>)?[^<]*)/);
    const components = componentsMatch
      ? parseComponents(componentsMatch[1])
      : { verbal: false, somatic: false, material: null };

    // Extract duration
    const durationMatch = cardHtml.match(/<strong>Duration<\/strong>:\s*([^<]+)/);
    const duration = durationMatch ? extractText(durationMatch[1]) : '';

    // Extract description
    const descMatch = cardHtml.match(/<div class="description">([\s\S]+?)<\/div>/);
    const description = descMatch ? extractText(descMatch[1]) : '';

    // Extract "At Higher Levels" section
    const higherLevelsMatch = description.match(/At Higher Levels[.\s]+(.*?)$/i);
    const higherLevels = higherLevelsMatch ? higherLevelsMatch[1] : undefined;

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
    const spell = parseSpellCard(match[1]);
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
