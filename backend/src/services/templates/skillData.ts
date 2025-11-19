import { Attribute, type Talent } from '@/types/index';

export const SKILL_LIST: Array<{ name: string; ability: Attribute }> = [
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

export const CLASS_SKILL_PROFICIENCIES: Record<string, string[]> = {
  Barbarian: ['Athletics', 'Survival', 'Intimidation'],
  Bard: ['Performance', 'Persuasion', 'Deception', 'History', 'Insight'],
  Cleric: ['Religion', 'Insight', 'Medicine', 'History'],
  Druid: ['Nature', 'Survival', 'Animal Handling', 'Perception'],
  Fighter: ['Athletics', 'Intimidation', 'Perception'],
  Monk: ['Acrobatics', 'Athletics', 'Stealth', 'Insight'],
  Paladin: ['Religion', 'Athletics', 'Persuasion'],
  Ranger: ['Survival', 'Perception', 'Stealth', 'Animal Handling'],
  Rogue: ['Stealth', 'Acrobatics', 'Sleight of Hand', 'Perception', 'Deception'],
  Sorcerer: ['Arcana', 'Persuasion', 'Deception'],
  Warlock: ['Arcana', 'Intimidation', 'Deception'],
  Wizard: ['Arcana', 'History', 'Investigation', 'Religion'],
};

export const CLASS_SKILL_EXPERTISE: Record<string, string[]> = {
  Rogue: ['Stealth', 'Sleight of Hand'],
  Bard: ['Performance', 'Persuasion'],
};

export const CLASS_TALENTS: Record<string, Talent[]> = {
  Barbarian: [
    { name: 'Rage', category: 'class', description: 'Enter a primal fury that grants bonus damage and resistance.' },
    { name: 'Danger Sense', category: 'class', description: 'Advantage on Dexterity saves against seen effects.' },
  ],
  Bard: [
    { name: 'Bardic Inspiration', category: 'class', description: 'Bolster allies with inspiring words or music.' },
    {
      name: 'Jack of All Trades',
      category: 'class',
      description: 'Add half proficiency to ability checks you lack proficiency in.',
    },
  ],
  Cleric: [
    { name: 'Channel Divinity', category: 'class', description: 'Invoke divine energy for potent miracles.' },
    { name: 'Turn Undead', category: 'class', description: 'Force undead creatures to flee holy radiance.' },
  ],
  Druid: [
    { name: 'Wild Shape', category: 'class', description: 'Transform into beast forms learned through druidic study.' },
    { name: 'Druidic Circle', category: 'class', description: 'Harness the teachings of your chosen circle.' },
  ],
  Fighter: [
    { name: 'Second Wind', category: 'class', description: 'Recover vitality once per short rest.' },
    { name: 'Action Surge', category: 'class', description: 'Push beyond limits to take an extra action.' },
  ],
  Monk: [
    { name: 'Martial Arts', category: 'class', description: 'Strike swiftly with disciplined techniques.' },
    { name: 'Ki Techniques', category: 'class', description: 'Channel ki to flurry, dodge, or stun.' },
  ],
  Paladin: [
    { name: 'Lay on Hands', category: 'class', description: 'Heal wounds with divine energy.' },
    { name: 'Divine Smite', category: 'class', description: 'Empower strikes with holy wrath.' },
  ],
  Ranger: [
    { name: 'Favored Foe', category: 'class', description: 'Mark prey to deal additional damage.' },
    { name: 'Natural Explorer', category: 'class', description: 'Master travel through chosen terrains.' },
  ],
  Rogue: [
    { name: 'Sneak Attack', category: 'class', description: 'Exploit openings for extra damage.' },
    { name: 'Cunning Action', category: 'class', description: 'Dash, Disengage, or Hide as a bonus action.' },
  ],
  Sorcerer: [
    { name: 'Metamagic', category: 'class', description: 'Twist spells with arcane techniques.' },
    { name: 'Font of Magic', category: 'class', description: 'Draw from deep wells of raw magical power.' },
  ],
  Warlock: [
    { name: 'Eldritch Invocations', category: 'class', description: 'Granted powers from an otherworldly patron.' },
    { name: 'Pact Boon', category: 'class', description: 'Sealed pact manifests as blade, tome, or chain familiar.' },
  ],
  Wizard: [
    { name: 'Arcane Recovery', category: 'class', description: 'Recover spell slots through study and meditation.' },
    { name: 'Spellbook Mastery', category: 'class', description: 'Record and prepare vast spell knowledge.' },
  ],
};
