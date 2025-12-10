/**
 * Character Generator Service
 * Dynamically generates character sheets using SRD data
 */

import { faker } from '@faker-js/faker';
import {
  getRace,
  getRaces,
  getClass,
  getClasses,
  getBackground,
  getBackgrounds,
  getMonsters,
  getMonster,
} from './game-data.js';
import { CharacterSheet, Attribute, SkillDetail } from '@/types/index';

// Helper to get random item from array
function getRandom<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('Cannot get random item from empty array');
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

// Standard array for ability scores
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

interface GenerationOptions {
  name?: string;
  raceId?: string;
  classId?: string;
  backgroundId?: string;
  level?: number;
}

/**
 * Generate a complete character sheet
 */
export async function generateCharacter(options: GenerationOptions = {}): Promise<CharacterSheet> {
  // 1. Select Race
  let race = options.raceId ? await getRace(options.raceId.toLowerCase()) : null;
  if (!race) {
    const races = await getRaces();
    if (races.length === 0) throw new Error('No races available');
    race = getRandom(races);
  }

  // 2. Select Class
  let charClass = options.classId ? await getClass(options.classId.toLowerCase()) : null;
  if (!charClass) {
    const classes = await getClasses();
    if (classes.length === 0) throw new Error('No classes available');
    charClass = getRandom(classes);
  }

  // 3. Select Background
  let background = options.backgroundId ? await getBackground(options.backgroundId.toLowerCase()) : null;
  if (!background) {
    const backgrounds = await getBackgrounds();
    background = (backgrounds.length > 0 ? getRandom(backgrounds) : null) || {
      id: 'acolyte',
      name: 'Acolyte',
      description: 'You have spent your life in service to a temple.',
      skillProficiencies: ['Insight', 'Religion'],
    };
  }

  const level = options.level || 1;
  const name = options.name || generateName(race.name);

  // 4. Generate Ability Scores
  const attributes = generateAbilityScores(race.abilityBonuses);

  // 5. Calculate Modifiers and Derived Stats
  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const dexMod = getMod(attributes.Dexterity || 10);
  const conMod = getMod(attributes.Constitution || 10);
  const wisMod = getMod(attributes.Wisdom || 10);

  const proficiencyBonus = Math.ceil(1 + level / 4);

  // 6. Skills
  const skillDetails = generateSkills(charClass, background, attributes, proficiencyBonus);
  const skills = skillDetails.reduce<Record<string, number>>((acc, s) => {
    acc[s.name] = s.modifier;
    return acc;
  }, {});

  // 7. HP (Max at lvl 1, avg after)
  const hitDieVal = charClass.hitDie;
  const hpAtFirst = hitDieVal + conMod;
  const hpPerLevel = hitDieVal / 2 + 1 + conMod;
  const maxHp = Math.floor(hpAtFirst + hpPerLevel * (level - 1));

  // 8. Construct Sheet
  const sheet: CharacterSheet = {
    name,
    race: race.name,
    characterClass: charClass.name,
    background: background.name,
    alignment: getRandom([
      'Lawful Good',
      'Neutral Good',
      'Chaotic Good',
      'Lawful Neutral',
      'True Neutral',
      'Chaotic Neutral',
      'Lawful Evil',
      'Neutral Evil',
      'Chaotic Evil',
    ]),
    level,
    xp: 0,
    hp: maxHp,
    maxHp: maxHp,
    temporaryHp: 0,
    hitDice: { total: level, current: level },
    deathSaves: { successes: 0, failures: 0 },
    armorClass: 10 + dexMod, // Base unarmored
    initiative: dexMod,
    speed: race.speed || 30,
    proficiencyBonus,
    inspiration: false,
    attributes: {
      Strength: attributes.Strength || 10,
      Dexterity: attributes.Dexterity || 10,
      Constitution: attributes.Constitution || 10,
      Intelligence: attributes.Intelligence || 10,
      Wisdom: attributes.Wisdom || 10,
      Charisma: attributes.Charisma || 10,
    },
    savingThrows: {
      fortitude: charClass.savingThrows.includes('Constitution') ? conMod + proficiencyBonus : conMod,
      reflex: charClass.savingThrows.includes('Dexterity') ? dexMod + proficiencyBonus : dexMod,
      will: charClass.savingThrows.includes('Wisdom') ? wisMod + proficiencyBonus : wisMod,
    },
    skills,
    skillDetails,
    expertises: [], // TODO: Add logic for Rogue/Bard expertise
    baseAttackBonus: Math.floor((level - 1) / 2), // Simplification
    attacks: [], // To be populated by equipment
    equipment: {
      equippedItems: {
        mainHand: null,
        offHand: null,
        armor: null,
        shield: null,
        head: null,
        cloak: null,
        belt: null,
        boots: null,
        gloves: null,
        ring1: null,
        ring2: null,
        necklace: null,
        accessory1: null,
        accessory2: null,
      },
      inventory: [],
      totalWeight: 0,
    },
    equipmentDescription: charClass.startingEquipmentEmbedded?.map((e) => e.name).join(', ') || 'Standard Gear',
    currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
    proficienciesAndLanguages: `Languages: Common${race.traits?.includes('Elvish') ? ', Elvish' : ''}`, // Simplified
    features: [
      ...(race.traits || []).map((t) => (typeof t === 'string' ? t : 'Racial Trait')),
      // Add class features logic here if available in expanded data
    ].join('\n'),
    talents: [],
    appearance: {
      age: '20',
      height: '5ft 10in',
      weight: '160 lbs',
      eyes: 'Brown',
      skin: 'Fair',
      hair: 'Brown',
      description: `A ${race.name} ${charClass.name} ready for adventure.`,
    },
    personality: {
      traits: 'Brave, Curious',
      ideals: 'Freedom',
      bonds: 'Protect the weak',
      flaws: 'Reckless',
    },
    backstory: `Born in a small village, ${name} sought to explore the world...`,
    backgroundDetails: {
      origin: background.name,
      upbringing: 'Humble',
      motivation: 'Adventure',
      keyEvents: [],
    },
    alliesAndOrganizations: '',
    treasure: '',
    resourcePools: [], // Could populate class resources
    advancementPoints: { ability: 0, skill: 0, talent: 0 },
    avatarAssets: null,
    spellcasting: {
      class: charClass.name,
      ability: charClass.primaryAbility || 'Intelligence',
      saveDC:
        8 +
        proficiencyBonus +
        (charClass.primaryAbility === 'Intelligence'
          ? getMod(attributes.Intelligence || 10)
          : charClass.primaryAbility === 'Wisdom'
            ? getMod(attributes.Wisdom || 10)
            : getMod(attributes.Charisma || 10)),
      attackBonus:
        proficiencyBonus +
        (charClass.primaryAbility === 'Intelligence'
          ? getMod(attributes.Intelligence || 10)
          : charClass.primaryAbility === 'Wisdom'
            ? getMod(attributes.Wisdom || 10)
            : getMod(attributes.Charisma || 10)),
      cantrips: [],
      spellsKnown: [],
      slots: [],
    },
  };

  return sheet;
}

/**
 * Generate 6 ability scores using Standard Array and adding Racial Bonuses
 */
function generateAbilityScores(bonuses?: Array<{ ability: string; bonus: number }>): Record<string, number> {
  const scores = [...STANDARD_ARRAY].sort(() => Math.random() - 0.5); // Shuffle standard array for variety

  const attrs: Record<string, number> = {
    Strength: scores[0]!,
    Dexterity: scores[1]!,
    Constitution: scores[2]!,
    Intelligence: scores[3]!,
    Wisdom: scores[4]!,
    Charisma: scores[5]!,
  };

  if (bonuses) {
    bonuses.forEach((b) => {
      // Map short names to long names if necessary, assuming full names match
      const key = Object.keys(attrs).find((k) => k.toLowerCase() === b.ability.toLowerCase()) || b.ability;
      if (attrs[key] !== undefined) {
        attrs[key] += b.bonus;
      }
    });
  }

  return attrs;
}

/**
 * Generate Name based on Race
 */
function generateName(raceName: string): string {
  const firstName = faker.person.firstName();
  return `${firstName} the ${raceName}`;
}

/**
 * Generate Skills
 */
function generateSkills(
  charClass: any,
  background: any,
  attributes: Record<string, number>,
  profBonus: number
): SkillDetail[] {
  // List of all skills and their abilities
  const allSkills: Array<{ name: string; ability: Attribute }> = [
    { name: 'Acrobatics', ability: Attribute.DEX },
    { name: 'Animal Handling', ability: Attribute.WIS },
    { name: 'Arcana', ability: Attribute.INT },
    { name: 'Athletics', ability: Attribute.STR },
    { name: 'Deception', ability: Attribute.CHA },
    { name: 'History', ability: Attribute.INT },
    { name: 'Insight', ability: Attribute.WIS },
    { name: 'Intimidation', ability: Attribute.CHA },
    { name: 'Investigation', ability: Attribute.INT },
    { name: 'Medicine', ability: Attribute.WIS },
    { name: 'Nature', ability: Attribute.INT },
    { name: 'Perception', ability: Attribute.WIS },
    { name: 'Performance', ability: Attribute.CHA },
    { name: 'Persuasion', ability: Attribute.CHA },
    { name: 'Religion', ability: Attribute.INT },
    { name: 'Sleight of Hand', ability: Attribute.DEX },
    { name: 'Stealth', ability: Attribute.DEX },
    { name: 'Survival', ability: Attribute.WIS },
  ];

  const chosenSkills = new Set<string>();

  // Add Background Skills
  if (background.skillProficiencies) {
    background.skillProficiencies.forEach((s: string) => chosenSkills.add(s));
  }

  // Choose Class Skills
  if (charClass.proficiencies?.skills) {
    const options = charClass.proficiencies.skills.from.filter((s: string) => !chosenSkills.has(s));
    const numToChoose = charClass.proficiencies.skills.choose;
    // Randomly pick
    const picked = options.sort(() => 0.5 - Math.random()).slice(0, numToChoose);
    picked.forEach((s: string) => chosenSkills.add(s));
  }

  return allSkills.map((skill) => {
    const isProficient = chosenSkills.has(skill.name);

    // Correct Mapping
    const attrKey = {
      [Attribute.STR]: 'Strength',
      [Attribute.DEX]: 'Dexterity',
      [Attribute.CON]: 'Constitution',
      [Attribute.INT]: 'Intelligence',
      [Attribute.WIS]: 'Wisdom',
      [Attribute.CHA]: 'Charisma',
    }[skill.ability];

    const score = attributes[attrKey] || 10;
    const mod = Math.floor((score - 10) / 2);

    return {
      name: skill.name,
      ability: skill.ability,
      modifier: mod + (isProficient ? profBonus : 0),
      proficiency: isProficient ? 'proficient' : 'none',
    };
  });
}

/**
 * Monster Generation / Retrieval
 */
interface MonsterOptions {
  monsterId?: string;
  name?: string;
  cr?: number;
  type?: string;
}

export async function generateMonster(options: MonsterOptions) {
  if (options.monsterId) {
    return getMonster(options.monsterId);
  }

  let monsters = await getMonsters();

  if (options.name) {
    const matches = monsters.filter((m) => m.name.toLowerCase().includes(options.name!.toLowerCase()));
    if (matches.length > 0) return matches[0];
  }

  if (options.type) {
    monsters = monsters.filter((m) => m.type.toLowerCase() === options.type!.toLowerCase());
  }

  if (options.cr !== undefined) {
    // This assumes challenge is stored as string like "1/4" or "5"
    monsters = monsters.filter((m) => {
      if (m.challenge === String(options.cr)) return true;
      // Handle fractions if CR passed as number
      if (options.cr === 0.25 && m.challenge === '1/4') return true;
      if (options.cr === 0.5 && m.challenge === '1/2') return true;
      if (options.cr === 0.125 && m.challenge === '1/8') return true;
      return false;
    });
  }

  if (monsters.length === 0) return null;
  return getRandom(monsters);
}
