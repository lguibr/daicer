import type { CharacterSheet, Attribute } from './types';

/**
 * Preset characters with deterministic values for testing
 */

export const FIGHTER_THORIN: CharacterSheet = {
  name: 'Thorin Ironshield',
  race: 'Dwarf',
  characterClass: 'Fighter',
  background: 'Soldier',
  alignment: 'Lawful Good',
  level: 3,
  xp: 900,

  hp: 28,
  maxHp: 28,
  temporaryHp: 0,
  hitDice: { total: 3, current: 3 },
  deathSaves: { successes: 0, failures: 0 },

  armorClass: 18,
  initiative: 1,
  speed: 25,
  proficiencyBonus: 2,
  inspiration: false,

  attributes: {
    Strength: 16,
    Dexterity: 12,
    Constitution: 15,
    Intelligence: 10,
    Wisdom: 11,
    Charisma: 8,
  } as Record<Attribute, number>,

  savingThrows: {
    fortitude: 5,
    reflex: 2,
    will: 1,
  },

  skills: {},
  skillDetails: [],
  expertises: [],

  baseAttackBonus: 6,
  attacks: [{ name: 'Battleaxe', bonus: '+6', damageType: '1d8+3 slashing' }],
  equipment: 'Plate armor, battleaxe, shield, crossbow',

  currency: { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 },

  proficienciesAndLanguages: 'All armor, shields, simple weapons, martial weapons, Common, Dwarvish',
  features: 'Fighting Style (Defense), Second Wind, Action Surge',
  talents: [],

  appearance: {
    age: '45',
    height: '4\'5"',
    weight: '180 lbs',
    eyes: 'Brown',
    skin: 'Tan',
    hair: 'Black with grey streaks',
    description: 'A sturdy dwarf with a thick beard braided with iron rings',
  },

  personality: {
    traits: 'Brave and loyal to a fault',
    ideals: 'Honor above all',
    bonds: 'My shield brothers are my family',
    flaws: 'Too proud to ask for help',
  },

  backstory: 'A veteran warrior from the Iron Hills, seeking redemption for past defeats',
  backgroundDetails: {
    origin: 'Military: Iron Hills Guard',
    upbringing: 'Raised in mountain stronghold',
    motivation: 'Restore family honor',
    keyEvents: ['Lost battle at Mithril Pass', 'Saved commander in ambush'],
  },
  alliesAndOrganizations: 'Iron Hills Guard',
  treasure: 'Family battle standard',
  resourcePools: [],
  advancementPoints: { ability: 0, skill: 0, talent: 0 },
  avatarAssets: null,

  spellcasting: {
    class: '',
    ability: '',
    saveDC: 0,
    attackBonus: 0,
    cantrips: [],
    spellsKnown: [],
    slots: [],
  },
};

export const FIGHTER_ARIA: CharacterSheet = {
  name: 'Aria Steelheart',
  race: 'Human',
  characterClass: 'Fighter',
  background: 'Noble',
  alignment: 'Neutral Good',
  level: 2,
  xp: 600,

  hp: 20,
  maxHp: 20,
  temporaryHp: 0,
  hitDice: { total: 2, current: 2 },
  deathSaves: { successes: 0, failures: 0 },

  armorClass: 16,
  initiative: 2,
  speed: 30,
  proficiencyBonus: 2,
  inspiration: false,

  attributes: {
    Strength: 14,
    Dexterity: 15,
    Constitution: 13,
    Intelligence: 12,
    Wisdom: 10,
    Charisma: 14,
  } as Record<Attribute, number>,

  savingThrows: {
    fortitude: 4,
    reflex: 4,
    will: 1,
  },

  skills: {},
  skillDetails: [],
  expertises: [],

  baseAttackBonus: 5,
  attacks: [{ name: 'Rapier', bonus: '+5', damageType: '1d8+2 piercing' }],
  equipment: 'Chain mail, rapier, longbow, arrows',

  currency: { cp: 0, sp: 0, ep: 0, gp: 150, pp: 5 },

  proficienciesAndLanguages: 'All armor, shields, simple weapons, martial weapons, Common, Elvish',
  features: 'Fighting Style (Dueling), Second Wind',
  talents: [],

  appearance: {
    age: '24',
    height: '5\'8"',
    weight: '150 lbs',
    eyes: 'Green',
    skin: 'Fair',
    hair: 'Auburn',
    description: 'A graceful human warrior with noble bearing',
  },

  personality: {
    traits: 'Confident and charismatic',
    ideals: 'Justice for all',
    bonds: 'Must uphold family reputation',
    flaws: 'Sometimes too trusting',
  },

  backstory: 'Daughter of a noble house, trained in fencing and diplomacy',
  backgroundDetails: {
    origin: 'Noble house of Steelheart',
    upbringing: 'Educated at royal court',
    motivation: 'Prove myself worthy',
    keyEvents: ['Won city tournament', 'Defended village from bandits'],
  },
  alliesAndOrganizations: 'House Steelheart, City Watch',
  treasure: 'Family signet ring',
  resourcePools: [],
  advancementPoints: { ability: 0, skill: 0, talent: 0 },
  avatarAssets: null,

  spellcasting: {
    class: '',
    ability: '',
    saveDC: 0,
    attackBonus: 0,
    cantrips: [],
    spellsKnown: [],
    slots: [],
  },
};

export const WIZARD_ELARA: CharacterSheet = {
  name: 'Elara Moonshadow',
  race: 'Elf',
  characterClass: 'Wizard',
  background: 'Scholar',
  alignment: 'Neutral',
  level: 3,
  xp: 900,

  hp: 16,
  maxHp: 16,
  temporaryHp: 0,
  hitDice: { total: 3, current: 3 },
  deathSaves: { successes: 0, failures: 0 },

  armorClass: 12,
  initiative: 2,
  speed: 30,
  proficiencyBonus: 2,
  inspiration: false,

  attributes: {
    Strength: 8,
    Dexterity: 14,
    Constitution: 12,
    Intelligence: 17,
    Wisdom: 13,
    Charisma: 10,
  } as Record<Attribute, number>,

  savingThrows: {
    fortitude: 2,
    reflex: 3,
    will: 4,
  },

  skills: {},
  skillDetails: [],
  expertises: [],

  baseAttackBonus: 2,
  attacks: [{ name: 'Quarterstaff', bonus: '+2', damageType: '1d6-1 bludgeoning' }],
  equipment: 'Robes, quarterstaff, spellbook, component pouch',

  currency: { cp: 0, sp: 0, ep: 0, gp: 75, pp: 0 },

  proficienciesAndLanguages: 'Simple weapons, Common, Elvish, Draconic, Celestial',
  features: 'Arcane Recovery, Evocation Savant',
  talents: [],

  appearance: {
    age: '110',
    height: '5\'6"',
    weight: '120 lbs',
    eyes: 'Silver',
    skin: 'Pale',
    hair: 'Silver-white',
    description: 'An elegant elf with an otherworldly presence',
  },

  personality: {
    traits: 'Curious and methodical',
    ideals: 'Knowledge is power',
    bonds: 'My spellbook is my most prized possession',
    flaws: 'Can be absent-minded',
  },

  backstory: 'A scholar from the Moonwood, studying ancient arcane lore',
  backgroundDetails: {
    origin: 'Moonwood Academy',
    upbringing: 'Raised among books and scrolls',
    motivation: 'Uncover lost magical knowledge',
    keyEvents: ['Discovered ancient tome', 'Defended academy from demons'],
  },
  alliesAndOrganizations: 'Moonwood Academy, Circle of Magi',
  treasure: 'Ancient spellbook fragment',
  resourcePools: [],
  advancementPoints: { ability: 0, skill: 0, talent: 0 },
  avatarAssets: null,

  spellcasting: {
    class: 'Wizard',
    ability: 'Intelligence',
    saveDC: 13,
    attackBonus: 5,
    cantrips: ['Fire Bolt', 'Mage Hand', 'Light'],
    spellsKnown: ['Magic Missile', 'Shield', 'Detect Magic', 'Fireball', 'Counterspell'],
    slots: [
      { level: 1, total: 4, expended: 0 },
      { level: 2, total: 2, expended: 0 },
    ],
  },
};

export const WIZARD_GANDOR: CharacterSheet = {
  name: 'Gandor the Grey',
  race: 'Human',
  characterClass: 'Wizard',
  background: 'Acolyte',
  alignment: 'Lawful Good',
  level: 4,
  xp: 1200,

  hp: 20,
  maxHp: 20,
  temporaryHp: 0,
  hitDice: { total: 4, current: 4 },
  deathSaves: { successes: 0, failures: 0 },

  armorClass: 13,
  initiative: 1,
  speed: 30,
  proficiencyBonus: 2,
  inspiration: false,

  attributes: {
    Strength: 10,
    Dexterity: 13,
    Constitution: 14,
    Intelligence: 16,
    Wisdom: 15,
    Charisma: 11,
  } as Record<Attribute, number>,

  savingThrows: {
    fortitude: 3,
    reflex: 2,
    will: 5,
  },

  skills: {},
  skillDetails: [],
  expertises: [],

  baseAttackBonus: 3,
  attacks: [{ name: 'Staff', bonus: '+3', damageType: '1d6 bludgeoning' }],
  equipment: 'Grey robes, gnarled staff, spellbook, holy symbol',

  currency: { cp: 0, sp: 0, ep: 0, gp: 100, pp: 2 },

  proficienciesAndLanguages: 'Simple weapons, Common, Elvish, Draconic, Celestial, Infernal',
  features: 'Arcane Recovery, Abjuration Savant, Arcane Ward',
  talents: [],

  appearance: {
    age: '65',
    height: '5\'11"',
    weight: '170 lbs',
    eyes: 'Grey',
    skin: 'Weathered',
    hair: 'Grey, long beard',
    description: 'An elderly wizard with piercing eyes and a commanding presence',
  },

  personality: {
    traits: 'Wise and patient',
    ideals: 'Protect the innocent from dark magic',
    bonds: 'My apprentices are like children to me',
    flaws: 'Sometimes forget I am not immortal',
  },

  backstory: 'A former temple guardian who turned to wizardry to better protect his flock',
  backgroundDetails: {
    origin: 'Temple of Light',
    upbringing: 'Trained as priest, then wizard',
    motivation: 'Shield the world from darkness',
    keyEvents: ['Banished demon lord', 'Established magical wards'],
  },
  alliesAndOrganizations: 'Temple of Light, Council of Wizards',
  treasure: 'Staff of Protection',
  resourcePools: [],
  advancementPoints: { ability: 0, skill: 0, talent: 0 },
  avatarAssets: null,

  spellcasting: {
    class: 'Wizard',
    ability: 'Intelligence',
    saveDC: 13,
    attackBonus: 5,
    cantrips: ['Ray of Frost', 'Prestidigitation', 'Mage Hand'],
    spellsKnown: ['Shield', 'Mage Armor', 'Detect Magic', 'Dispel Magic', 'Counterspell', 'Wall of Force'],
    slots: [
      { level: 1, total: 4, expended: 0 },
      { level: 2, total: 3, expended: 0 },
    ],
  },
};

export const PRESET_CHARACTERS = {
  fighter1: FIGHTER_THORIN,
  fighter2: FIGHTER_ARIA,
  wizard1: WIZARD_ELARA,
  wizard2: WIZARD_GANDOR,
};
