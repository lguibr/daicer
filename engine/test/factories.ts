import { CharacterSheet, ActionType } from '../src/types';

export const createCharacterSheet = (overrides: Partial<CharacterSheet> = {}): CharacterSheet => {
  const defaultSheet: CharacterSheet = {
    id: 'char-1',
    documentId: 'doc-1',
    name: 'Test Character',
    race: 'Human',
    characterClass: 'Fighter 1',
    level: 1,
    xp: 0,
    hp: 10,
    maxHp: 10,
    temporaryHp: 0,
    armorClass: 10,
    initiative: 0,
    speed: { walk: 30 },
    proficiencyBonus: 2,
    inspiration: false,
    attributes: {
      Strength: 10,
      Dexterity: 10,
      Constitution: 10,
      Intelligence: 10,
      Wisdom: 10,
      Charisma: 10,
    },
    hitDice: {
      total: 1,
      current: 1,
      die: '1d10',
    },
    savingThrows: { fortitude: 0, reflex: 0, will: 0 },
    skills: {},
    skillDetails: [],
    expertises: [],
    equipment: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    structuredActions: [],
    features: [],
    talents: [],
    conditions: [],
    resources: [],
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    background: 'Soldier',
    alignment: 'Neutral',
    appearance: {
      age: '25',
      height: '6ft',
      weight: '180lbs',
      eyes: 'Brown',
      skin: 'Tan',
      hair: 'Black',
      description: 'Generic hero',
    },
    personality: {
      traits: 'Brave',
      ideals: 'Honor',
      bonds: 'Kingdom',
      flaws: 'Reckless',
    },
    backstory: 'A warrior from the north.',
    backgroundDetails: {
      origin: 'North',
      upbringing: 'Commoner',
      motivation: 'Glory',
      keyEvents: [],
    },
    alliesAndOrganizations: '',
    treasure: '',
    advancementPoints: { ability: 0, skill: 0, talent: 0 },
    ...overrides,
  };
  return defaultSheet;
};

export const createMeleeAction = (id: string, damageDice: string = '1d8', damageType: string = 'slashing') => ({
  type: 'melee_attack' as const,
  id,
  name: 'Test Weapon',
  description: 'A test weapon',
  toHit: 5,
  reach: 5,
  damage: [{ dice: damageDice, bonus: 3, type: damageType }],
});

export const createRangedAction = (id: string, isFinesse: boolean = false) => ({
  type: 'ranged_attack' as const,
  id,
  name: 'Shortbow',
  description: 'Ranged Weapon',
  toHit: 5,
  range: { normal: 80, long: 320 },
  damage: [{ dice: '1d6', bonus: 3, type: 'piercing' }],
  properties: isFinesse ? ['finesse'] : [],
  ammoType: 'arrow',
});

export const createSpellAction = (id: string, level: number = 1, concentration: boolean = false) => ({
  type: 'spell' as const,
  id,
  spellId: 'spell-' + id,
  name: 'Test Spell',
  level,
  school: 'evocation',
  castingTime: '1 action',
  range: '60 feet',
  components: ['V', 'S'],
  duration: concentration ? 'Concentration, up to 1 minute' : 'Instantaneous',
  concentration,
  description: 'A magical effect',
});

export const createAction = (overrides: any) => ({
  type: 'melee_attack',
  id: 'action-generic',
  name: 'Generic Action',
  description: 'Generic',
  toHit: 0,
  ...overrides,
});

export const createEntity = (overrides: any = {}) => ({
  id: 'ent-1',
  type: 'character',
  name: 'Entity',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  speed: 30,
  stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
  hp: 10,
  maxHp: 10,
  ac: 10,
  sheet: createCharacterSheet(),
  ...overrides,
});

export const createGameState = (overrides: any = {}) => ({
  entities: [],
  players: [],
  room: { id: 'room-1', config: {} },
  world: {},
  settings: { allowPvp: true },
  ...overrides,
});
