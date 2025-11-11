#!/usr/bin/env node
/**
 * Convert TypeScript game data files to JSON
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data/game-data');

// Mapping of file names to their exported constant names
const fileToConstant = {
  'character-abilities.ts': 'ABILITIES',
  'character-alignments.ts': 'ALIGNMENTS',
  'character-backgrounds.ts': 'BACKGROUNDS',
  'character-classes.ts': 'CLASSES',
  'character-races.ts': 'RACES',
  'character-skills.ts': 'SKILLS',
  'combat-conditions.ts': 'CONDITIONS',
  'combat-damage-types.ts': 'DAMAGE_TYPES',
  'equipment-categories.ts': 'EQUIPMENT_CATEGORIES',
  'equipment-items.ts': ['COMMON_WEAPONS', 'COMMON_ARMOR'], // Special case: multiple exports
  'equipment-weapon-properties.ts': 'WEAPON_PROPERTIES',
  'magic-schools.ts': 'MAGIC_SCHOOLS',
  'world-languages.ts': 'LANGUAGES',
};

function convertFile(filename, constantName) {
  const tsPath = path.join(dataDir, filename);
  const jsonFilename = filename.replace('.ts', '.json');
  const jsonPath = path.join(dataDir, jsonFilename);

  if (!fs.existsSync(tsPath)) {
    console.log(`⚠️  Skipped ${filename} (not found)`);
    return;
  }

  const content = fs.readFileSync(tsPath, 'utf8');

  // Extract the array using regex
  const pattern = new RegExp(
    `export const ${constantName}[^=]*=\\s*\\[([\\s\\S]*?)\\]\\s*(?:as const)?;`,
    'm'
  );
  const match = content.match(pattern);

  if (!match) {
    console.log(`❌ Failed to extract ${constantName} from ${filename}`);
    return;
  }

  try {
    // Parse the array content as JavaScript
    const arrayContent = '[' + match[1] + ']';
    const data = eval('(' + arrayContent + ')');
    
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`✓ Converted ${filename} → ${jsonFilename}`);
  } catch (error) {
    console.log(`❌ Error parsing ${filename}:`, error.message);
  }
}

// Special handler for equipment-items.ts (has two exports)
function convertEquipmentItems() {
  const tsPath = path.join(dataDir, 'equipment-items.ts');
  const content = fs.readFileSync(tsPath, 'utf8');

  // Extract COMMON_WEAPONS
  const weaponsMatch = content.match(/export const COMMON_WEAPONS[^=]*=\s*\[([\s\S]*?)\]\s*(?:as const)?;/m);
  // Extract COMMON_ARMOR
  const armorMatch = content.match(/export const COMMON_ARMOR[^=]*=\s*\[([\s\S]*?)\]\s*(?:as const)?;/m);

  if (weaponsMatch && armorMatch) {
    try {
      const weapons = eval('([' + weaponsMatch[1] + '])');
      const armor = eval('([' + armorMatch[1] + '])');
      const combined = [...weapons, ...armor];

      fs.writeFileSync(
        path.join(dataDir, 'equipment-items.json'),
        JSON.stringify(combined, null, 2)
      );
      console.log(`✓ Converted equipment-items.ts → equipment-items.json (merged weapons + armor)`);
    } catch (error) {
      console.log(`❌ Error parsing equipment-items.ts:`, error.message);
    }
  }
}

console.log('🔄 Converting TypeScript game data to JSON...\n');

// Convert all files
for (const [filename, constantName] of Object.entries(fileToConstant)) {
  if (Array.isArray(constantName)) {
    // Special case for multiple exports
    convertEquipmentItems();
  } else {
    convertFile(filename, constantName);
  }
}

console.log('\n✅ Conversion complete!');

