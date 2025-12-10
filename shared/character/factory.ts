import { faker } from '@faker-js/faker';
import type { CharacterSheet, Attribute } from './types';

/**
 * Create a random character using Faker for variable fields
 */
export function createCharacter(overrides: Partial<CharacterSheet> = {}): CharacterSheet {
  const race = overrides.race || faker.helpers.arrayElement(['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn']);
  const characterClass =
    overrides.characterClass || faker.helpers.arrayElement(['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin']);
  const level = overrides.level || faker.number.int({ min: 1, max: 5 });

  return {
    // Basic info - use Faker
    name: faker.person.firstName() + ' ' + faker.person.lastName(),
    race,
    characterClass,
    background: faker.helpers.arrayElement(['Soldier', 'Scholar', 'Criminal', 'Acolyte', 'Noble']),
    alignment: faker.helpers.arrayElement([
      'Lawful Good',
      'Neutral Good',
      'Chaotic Good',
      'Neutral',
      'Chaotic Neutral',
    ]),
    level,
    xp: level * 300,

    // Core stats - realistic game values
    hp: 10 + level * 6,
    maxHp: 10 + level * 6,
    temporaryHp: 0,
    hitDice: { total: level, current: level },
    deathSaves: { successes: 0, failures: 0 },

    armorClass: 14 + faker.number.int({ min: 0, max: 4 }),
    initiative: faker.number.int({ min: -1, max: 3 }),
    speed: 30,
    proficiencyBonus: Math.floor((level - 1) / 4) + 2,
    inspiration: false,

    // Attributes - valid D&D scores
    attributes: {
      Strength: faker.number.int({ min: 8, max: 18 }),
      Dexterity: faker.number.int({ min: 8, max: 18 }),
      Constitution: faker.number.int({ min: 8, max: 18 }),
      Intelligence: faker.number.int({ min: 8, max: 18 }),
      Wisdom: faker.number.int({ min: 8, max: 18 }),
      Charisma: faker.number.int({ min: 8, max: 18 }),
    } as Record<Attribute, number>,

    savingThrows: {
      fortitude: faker.number.int({ min: 0, max: 5 }),
      reflex: faker.number.int({ min: 0, max: 5 }),
      will: faker.number.int({ min: 0, max: 5 }),
    },

    skills: {},
    skillDetails: [],
    expertises: [],

    // Combat
    baseAttackBonus: level + 3,
    attacks: [
      {
        name: faker.helpers.arrayElement(['Longsword', 'Shortsword', 'Dagger', 'Greataxe', 'Quarterstaff']),
        bonus: `+${level + 3}`,
        damageType: '1d8+3 slashing',
      },
    ],
    equipment: {
      equippedItems: {
        mainHand: null,
        offHand: null,
        armor: null,
        shield: null,
        accessory1: null,
        accessory2: null,
      },
      inventory: [],
      totalWeight: 0,
    },

    // Currency
    currency: {
      cp: faker.number.int({ min: 0, max: 50 }),
      sp: faker.number.int({ min: 0, max: 20 }),
      ep: 0,
      gp: faker.number.int({ min: 5, max: 100 }),
      pp: 0,
    },

    // Character details
    proficienciesAndLanguages: 'All armor, shields, simple weapons, martial weapons, Common',
    features: 'Fighting Style, Second Wind',
    talents: [],

    // Appearance - use Faker
    appearance: {
      age: String(faker.number.int({ min: 18, max: 50 })),
      height: faker.helpers.arrayElement(['5\'6"', '5\'8"', '5\'10"', '6\'0"', '6\'2"']),
      weight: faker.helpers.arrayElement(['150 lbs', '170 lbs', '180 lbs', '200 lbs']),
      eyes: faker.color.human(),
      skin: faker.helpers.arrayElement(['Pale', 'Fair', 'Tan', 'Brown', 'Dark']),
      hair: faker.helpers.arrayElement(['Black', 'Brown', 'Blonde', 'Red', 'White', 'Grey']),
      description: faker.lorem.sentence(),
    },

    // Personality - use Faker
    personality: {
      traits: faker.lorem.sentence(),
      ideals: faker.lorem.words(3),
      bonds: faker.lorem.sentence(),
      flaws: faker.lorem.sentence(),
    },

    // Background - use Faker
    backstory: faker.lorem.paragraph(),
    backgroundDetails: {
      origin: faker.helpers.arrayElement([
        'Military background',
        'Academic pursuits',
        'Criminal underworld',
        'Religious order',
      ]),
      upbringing: faker.helpers.arrayElement(['Raised in barracks', 'Scholarly family', 'Streets', 'Temple']),
      motivation: faker.helpers.arrayElement(['Seeking glory', 'Pursuing knowledge', 'Redemption', 'Divine calling']),
      keyEvents: [faker.lorem.sentence(), faker.lorem.sentence()],
    },
    alliesAndOrganizations: faker.company.name(),
    treasure: faker.lorem.words(3),
    resourcePools: [],
    advancementPoints: {
      ability: 0,
      skill: 0,
      talent: 0,
    },
    avatarAssets: null,

    // Spellcasting
    spellcasting: {
      class: '',
      ability: '',
      saveDC: 0,
      attackBonus: 0,
      cantrips: [],
      spellsKnown: [],
      slots: [],
    },

    ...overrides,
  };
}
