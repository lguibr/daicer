import { CharacterSheet, ActionType, ActionIntent } from '../src/types';
import { resolveAttack } from '../src/rules/combat';

// Mock Data
const attacker: CharacterSheet = {
  name: 'Attacker',
  // ... minimal required fields ...
  structuredActions: [
    {
      type: 'melee_attack',
      id: 'fire-sword',
      name: 'Fire Sword',
      description: 'Hits ',
      toHit: 100, // Ensure hit
      reach: 5,
      damage: [{ dice: '1d1', bonus: 10, type: 'fire' }], // 1d1+10 = 11 dmg always
    },
  ],
  // Dummy props to satisfy type
  hp: 10,
  maxHp: 10,
  temporaryHp: 0,
  level: 1,
  xp: 0,
  hitDice: { total: 1, current: 1, die: '1d6' },
  deathSaves: { successes: 0, failures: 0 },
  armorClass: 10,
  initiative: 0,
  speed: { walk: 30 },
  proficiencyBonus: 2,
  inspiration: false,
  attributes: { Strength: 10, Dexterity: 10, Constitution: 10, Intelligence: 10, Wisdom: 10, Charisma: 10 },
  savingThrows: { fortitude: 0, reflex: 0, will: 0 },
  skills: {},
  skillDetails: [],
  expertises: [],
  equipment: [],
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  proficienciesAndLanguages: '',
  features: [],
  talents: [],
  conditions: [],
  resources: [],
  background: '',
  alignment: '',
  appearance: {} as any,
  personality: {} as any,
  backstory: '',
  backgroundDetails: {} as any,
  alliesAndOrganizations: '',
  treasure: '',
  advancementPoints: { ability: 0, skill: 0, talent: 0 },
} as unknown as CharacterSheet; // Cast to suppress extensive mock needs if schema is strict

const target: CharacterSheet = {
  ...attacker,
  name: 'Target',
  armorClass: 10,
  // Defensive stats
  resistances: ['fire'],
  immunities: ['cold'],
  vulnerabilities: ['acid'],
} as unknown as CharacterSheet;

// Intent
const intent: ActionIntent = {
  type: ActionType.Attack,
  actionId: 'fire-sword',
  targetId: 'target-id',
};

// 1. Test Resistance (Fire)
// Damage: 11. Resistance: Floor(5.5) = 5.
console.log('--- Test 1: Resistance (Fire) ---');
const res1 = resolveAttack(attacker, target, intent);
console.log(`Damage (Should be 5): ${res1.totalDamage}`);
if (res1.totalDamage === 5) console.log('✅ PASS');
else console.error('❌ FAIL');

// 2. Test Immunity (Cold)
console.log('--- Test 2: Immunity (Cold) ---');
(attacker.structuredActions[0] as any).damage[0].type = 'cold';
const res2 = resolveAttack(attacker, target, intent);
console.log(`Damage (Should be 0): ${res2.totalDamage}`);
if (res2.totalDamage === 0) console.log('✅ PASS');
else console.error('❌ FAIL');

// 3. Test Vulnerability (Acid)
console.log('--- Test 3: Vulnerability (Acid) ---');
(attacker.structuredActions[0] as any).damage[0].type = 'acid';
const res3 = resolveAttack(attacker, target, intent);
console.log(`Damage (Should be 22): ${res3.totalDamage}`);
if (res3.totalDamage === 22) console.log('✅ PASS');
else console.error('❌ FAIL');

// 4. Test Normal (Force)
console.log('--- Test 4: Normal (Force) ---');
(attacker.structuredActions[0] as any).damage[0].type = 'force';
const res4 = resolveAttack(attacker, target, intent);
console.log(`Damage (Should be 11): ${res4.totalDamage}`);
if (res4.totalDamage === 11) console.log('✅ PASS');
else console.error('❌ FAIL');
