// eslint-disable-next-line import/no-extraneous-dependencies
import { faker } from '@faker-js/faker';
import type { CharacterFormState } from '../components/room/character-creation/types';

// Helper to get random item from array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] as T;

// Standard Array for stats: 15, 14, 13, 12, 10, 8
// We will shuffle assigning them based on class priority
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

interface ClassStatPriority {
  primary: string[];
  secondary: string[];
}

const CLASS_PRIORITIES: Record<string, ClassStatPriority> = {
  Barbarian: { primary: ['Strength'], secondary: ['Constitution', 'Dexterity'] },
  Bard: { primary: ['Charisma'], secondary: ['Dexterity', 'Constitution'] },
  Cleric: { primary: ['Wisdom'], secondary: ['Strength', 'Constitution'] },
  Druid: { primary: ['Wisdom'], secondary: ['Constitution', 'Dexterity'] },
  Fighter: { primary: ['Strength', 'Dexterity'], secondary: ['Constitution'] },
  Monk: { primary: ['Dexterity', 'Wisdom'], secondary: ['Constitution'] },
  Paladin: { primary: ['Strength', 'Charisma'], secondary: ['Constitution'] },
  Ranger: { primary: ['Dexterity', 'Wisdom'], secondary: ['Constitution'] },
  Rogue: { primary: ['Dexterity'], secondary: ['Intelligence', 'Charisma'] },
  Sorcerer: { primary: ['Charisma'], secondary: ['Constitution'] },
  Warlock: { primary: ['Charisma'], secondary: ['Constitution', 'Dexterity'] },
  Wizard: { primary: ['Intelligence'], secondary: ['Constitution', 'Dexterity'] },
};

export const generateRandomCharacter = (
  characterClass: string,
  race: string = 'Human'
): Partial<CharacterFormState> => {
  const gender = faker.person.sexType();
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();

  // Appearance
  const age = Math.floor(Math.random() * 20) + 18; // 18-38 roughly
  const heightFt = 5 + Math.floor(Math.random() * 2);
  const heightIn = Math.floor(Math.random() * 12);
  const weight = 120 + Math.floor(Math.random() * 100);

  // Background using faker
  const job = faker.person.jobTitle();
  const descriptor = faker.word.adjective();
  const backstory = `Before becoming an adventurer, ${firstName} was a ${descriptor} ${job}. ${faker.lorem.paragraph(2)}`;

  // Personality
  const traits = faker.word.words(3);
  const ideals = faker.company.catchPhrase();
  const bonds = faker.lorem.sentence();
  const flaws = faker.hacker.phrase(); // playful choice

  const priority = CLASS_PRIORITIES[characterClass] || { primary: ['Strength'], secondary: ['Constitution'] };

  // Re-do attributes clean
  const cleanAttributes: Record<string, number> = {};
  const pool = [...STANDARD_ARRAY];
  const assigned = new Set<string>();

  // Primary (Highest)
  priority.primary.forEach((stat) => {
    if (!assigned.has(stat) && pool.length > 0) {
      const val = Math.max(...pool);
      cleanAttributes[stat] = val;
      const idx = pool.indexOf(val);
      if (idx !== -1) {
        pool.splice(idx, 1);
      }
      assigned.add(stat);
    }
  });

  // Secondary
  priority.secondary.forEach((stat) => {
    if (!assigned.has(stat) && pool.length > 0) {
      const val = Math.max(...pool);
      cleanAttributes[stat] = val;
      const idx = pool.indexOf(val);
      if (idx !== -1) {
        pool.splice(idx, 1);
      }
      assigned.add(stat);
    }
  });

  // Rest
  ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].forEach((stat) => {
    if (!assigned.has(stat)) {
      const idx = Math.floor(Math.random() * pool.length);
      cleanAttributes[stat] = pool[idx]!;
      pool.splice(idx, 1);
      assigned.add(stat);
    }
  });

  return {
    name: `${firstName} ${lastName}`,
    race,
    characterClass,
    background: backstory,
    alignment: random([
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
    attributes: cleanAttributes,
    appearance: {
      age: age.toString(),
      height: `${heightFt}'${heightIn}"`,
      weight: `${weight} lbs`,
      gender: gender === 'male' ? 'Male' : 'Female',
      eyes: random(['Blue', 'Green', 'Brown', 'Hazel', 'Grey']),
      skin: random(['Fair', 'Tan', 'Dark', 'Olive', 'Light']),
      hair: random(['Black', 'Brown', 'Blonde', 'Red', 'White', 'Grey']),
      description: `A ${heightFt}'${heightIn}" ${race} with ${random(['rugged', 'scared', 'beautiful', 'plain'])} features.`,
    },
    personality: {
      traits,
      ideals,
      bonds,
      flaws,
    },
  };
};
