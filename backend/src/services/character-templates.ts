/* eslint-disable max-lines */
/**
 * Pre-made character templates for quick testing
 * Generates complete characters with random names
 */

import { faker } from '@faker-js/faker';
import {
  Attribute,
  type BackgroundDetails,
  type CharacterSheet,
  type ResourcePool,
  type SkillDetail,
  type SkillProficiency,
  type Talent,
} from '@/types/index';

const SKILL_LIST: Array<{ name: string; ability: Attribute }> = [
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

const CLASS_SKILL_PROFICIENCIES: Record<string, string[]> = {
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

const CLASS_SKILL_EXPERTISE: Record<string, string[]> = {
  Rogue: ['Stealth', 'Sleight of Hand'],
  Bard: ['Performance', 'Persuasion'],
};

const CLASS_TALENTS: Record<string, Talent[]> = {
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
    { name: 'Font of Magic', category: 'class', description: 'Manipulate sorcery points for flexible casting.' },
    { name: 'Metamagic', category: 'class', description: 'Twist spells to suit the moment.' },
  ],
  Warlock: [
    { name: 'Eldritch Invocations', category: 'class', description: 'Supernatural favors granted by your patron.' },
    { name: 'Pact Boon', category: 'class', description: 'Unique gift defining your pact relationship.' },
  ],
  Wizard: [
    { name: 'Arcane Recovery', category: 'class', description: 'Refresh spell slots after a short rest.' },
    { name: 'Arcane Tradition', category: 'class', description: 'Specialised school magic expertise.' },
  ],
};

const CLASS_RESOURCE_POOLS: Record<
  string,
  Array<Omit<ResourcePool, 'current'> & Partial<Pick<ResourcePool, 'current'>>>
> = {
  Barbarian: [
    { name: 'Rage', current: 2, max: 2, refresh: 'long-rest', description: 'Number of times you can rage per day.' },
  ],
  Bard: [
    { name: 'Bardic Inspiration', current: 2, max: 2, refresh: 'short-rest', description: 'Inspiration dice pool.' },
  ],
  Cleric: [
    { name: 'Channel Divinity', current: 1, max: 1, refresh: 'short-rest', description: 'Uses of divine channeling.' },
  ],
  Druid: [{ name: 'Wild Shape', current: 2, max: 2, refresh: 'short-rest', description: 'Beast shape uses.' }],
  Fighter: [
    { name: 'Second Wind', current: 1, max: 1, refresh: 'short-rest', description: 'Renew stamina once per rest.' },
    { name: 'Action Surge', current: 1, max: 1, refresh: 'short-rest', description: 'Push beyond normal limits.' },
  ],
  Monk: [
    {
      name: 'Ki Points',
      current: 2,
      max: 2,
      refresh: 'short-rest',
      description: 'Ki resource for martial techniques.',
    },
  ],
  Paladin: [
    { name: 'Lay on Hands', current: 5, max: 5, refresh: 'long-rest', description: 'Healing pool equal to level ×5.' },
  ],
  Ranger: [
    { name: 'Spell Slots', current: 2, max: 2, refresh: 'long-rest', description: '1st-level spell slots available.' },
  ],
  Rogue: [
    {
      name: 'Superiority Edge',
      current: 2,
      max: 2,
      refresh: 'short-rest',
      description: 'Reserve for daring maneuvers.',
    },
  ],
  Sorcerer: [
    { name: 'Sorcery Points', current: 2, max: 2, refresh: 'long-rest', description: 'Fuel for metamagic options.' },
  ],
  Warlock: [
    {
      name: 'Pact Magic Slots',
      current: 1,
      max: 1,
      refresh: 'short-rest',
      description: 'Slot level based on warlock level.',
    },
  ],
  Wizard: [
    { name: 'Arcane Recovery', current: 1, max: 1, refresh: 'daily', description: 'Regain spell slots after rest.' },
  ],
};

function getAbilityModifier(attributes: Record<string, number>, ability: Attribute): number {
  const score = attributes[ability] ?? 10;
  return Math.floor((score - 10) / 2);
}

function resolveProficiency(className: string, skillName: string): SkillProficiency {
  const expertise = CLASS_SKILL_EXPERTISE[className] || [];
  if (expertise.includes(skillName)) {
    return 'expertise';
  }

  const proficiencies = CLASS_SKILL_PROFICIENCIES[className] || [];
  if (proficiencies.includes(skillName)) {
    return 'proficient';
  }

  return 'trained';
}

interface CharacterArchetype {
  class: string;
  race: string;
  alignment: string;
  background: string;
  attributes: Record<string, number>;
  backstory: string;
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  appearance: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    description: string;
  };
}

function buildSkillDetails(archetype: CharacterArchetype, proficiencyBonus: number): SkillDetail[] {
  return SKILL_LIST.map((skill) => {
    const abilityModifier = getAbilityModifier(archetype.attributes, skill.ability);
    const proficiency = resolveProficiency(archetype.class, skill.name);
    let proficiencyContribution = 0;
    if (proficiency === 'expertise') {
      proficiencyContribution = proficiencyBonus * 2;
    } else if (proficiency === 'proficient') {
      proficiencyContribution = proficiencyBonus;
    }

    return {
      name: skill.name,
      ability: skill.ability,
      modifier: abilityModifier + proficiencyContribution,
      proficiency,
    };
  });
}

function buildBackgroundDetails(archetype: CharacterArchetype): BackgroundDetails {
  const sentences = archetype.backstory
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);
  const keyEvents = sentences.slice(0, 3).map((sentence) => (sentence.endsWith('.') ? sentence : `${sentence}.`));

  return {
    origin: archetype.background,
    upbringing: `Shaped by ${archetype.background.toLowerCase()} traditions and duties.`,
    motivation: archetype.personality.ideals,
    keyEvents,
    allies: archetype.personality.bonds ? [archetype.personality.bonds] : [],
  };
}

function buildResourcePools(className: string): ResourcePool[] {
  const pools = CLASS_RESOURCE_POOLS[className] || [];
  return pools.map((pool) => ({
    name: pool.name,
    current: pool.current ?? pool.max,
    max: pool.max,
    refresh: pool.refresh,
    description: pool.description,
  }));
}

const ARCHETYPES: Record<string, CharacterArchetype> = {
  fighter: {
    class: 'Fighter',
    race: 'Human',
    alignment: 'Lawful Good',
    background: 'Soldier',
    attributes: {
      Strength: 15,
      Dexterity: 13,
      Constitution: 14,
      Intelligence: 8,
      Wisdom: 10,
      Charisma: 12,
    },
    backstory:
      "A veteran soldier who served in the kingdom's army for years. Hardened by battle but maintains a strong moral code. Left military service to seek adventure and right wrongs across the land. Has seen comrades fall and carries their memory with honor.",
    personality: {
      traits: 'Disciplined, protective of allies, speaks in military terms',
      ideals: 'Duty - Must protect those who cannot protect themselves',
      bonds: 'My fallen squad mates - I fight in their memory',
      flaws: 'Struggles with authority after leaving the military',
    },
    appearance: {
      age: '28',
      height: '6ft 2in',
      weight: '190 lbs',
      eyes: 'Steel Gray',
      skin: 'Tanned',
      hair: 'Short Brown',
      description: 'Battle-scarred with a military bearing. Wears armor comfortably like a second skin.',
    },
  },

  wizard: {
    class: 'Wizard',
    race: 'High Elf',
    alignment: 'Neutral Good',
    background: 'Sage',
    attributes: {
      Strength: 8,
      Dexterity: 14,
      Constitution: 12,
      Intelligence: 15,
      Wisdom: 13,
      Charisma: 10,
    },
    backstory:
      'Spent years studying ancient tomes in a great library. Discovered a mysterious prophecy that led them to leave the safety of academia. Seeks lost knowledge and arcane artifacts. believes magic should be used to better the world, not dominate it.',
    personality: {
      traits: 'Curious about everything, speaks in scholarly terms, always taking notes',
      ideals: 'Knowledge - Learning is the path to power and enlightenment',
      bonds: 'The library that trained me - must preserve its legacy',
      flaws: 'Overconfident in academic knowledge, sometimes misses practical solutions',
    },
    appearance: {
      age: '112',
      height: '5ft 8in',
      weight: '130 lbs',
      eyes: 'Violet',
      skin: 'Pale',
      hair: 'Silver, Long',
      description: 'Slender frame, often has ink stains on fingers. Carries themselves with quiet confidence.',
    },
  },

  rogue: {
    class: 'Rogue',
    race: 'Halfling',
    alignment: 'Chaotic Good',
    background: 'Criminal',
    attributes: {
      Strength: 10,
      Dexterity: 15,
      Constitution: 12,
      Intelligence: 13,
      Wisdom: 14,
      Charisma: 8,
    },
    backstory:
      'Grew up on the streets, learned to survive by wit and nimble fingers. Once stole from the rich to feed the poor, but a close call made them rethink their path. Now uses skills for good, though old habits die hard. Has a network of contacts in the underworld.',
    personality: {
      traits: 'Quick-witted, always has an exit plan, light-fingered',
      ideals: 'Freedom - Everyone deserves to live free from oppression',
      bonds: 'The street kids I grew up with - must protect them',
      flaws: "Can't resist a good heist, even when it's risky",
    },
    appearance: {
      age: '32',
      height: '3ft 4in',
      weight: '40 lbs',
      eyes: 'Green',
      skin: 'Tan',
      hair: 'Curly Brown',
      description: 'Nimble and quick, with a mischievous glint in the eye. Wears dark, practical clothes.',
    },
  },

  cleric: {
    class: 'Cleric',
    race: 'Dwarf',
    alignment: 'Lawful Good',
    background: 'Acolyte',
    attributes: {
      Strength: 14,
      Dexterity: 8,
      Constitution: 15,
      Intelligence: 10,
      Wisdom: 13,
      Charisma: 12,
    },
    backstory:
      'Raised in a temple, devoted to a deity of healing and protection. Received a divine vision calling them to adventure and spread their faith. Believes in the power of community and healing. Has performed many miracles but remains humble.',
    personality: {
      traits: 'Compassionate healer, quotes scripture, always helps those in need',
      ideals: 'Faith - Trust in the divine plan guides my path',
      bonds: 'My temple and the priests who raised me',
      flaws: 'Too trusting of those who show religious devotion',
    },
    appearance: {
      age: '87',
      height: '4ft 6in',
      weight: '165 lbs',
      eyes: 'Deep Brown',
      skin: 'Ruddy',
      hair: 'Red Beard, Braided',
      description: 'Stout and strong, with a holy symbol always visible. Kind eyes that have seen much suffering.',
    },
  },

  ranger: {
    class: 'Ranger',
    race: 'Wood Elf',
    alignment: 'Neutral Good',
    background: 'Outlander',
    attributes: {
      Strength: 12,
      Dexterity: 15,
      Constitution: 13,
      Intelligence: 10,
      Wisdom: 14,
      Charisma: 8,
    },
    backstory:
      'Grew up in the deep forest, learning the ways of nature from an early age. Acts as a guardian of the wilderness, protecting it from those who would exploit it. Has tracked dangerous beasts and knows every path through the woods. Prefers the company of animals to people.',
    personality: {
      traits: 'Speaks to animals, uncomfortable in cities, excellent tracker',
      ideals: 'Nature - The natural world must be preserved and protected',
      bonds: 'The forest that raised me is my true home',
      flaws: 'Distrusts civilization and cities',
    },
    appearance: {
      age: '134',
      height: '5ft 10in',
      weight: '145 lbs',
      eyes: 'Forest Green',
      skin: 'Tan, Weather-beaten',
      hair: 'Brown with Leaves',
      description: 'Lithe and weathered, moves silently. Often has a small animal companion nearby.',
    },
  },

  paladin: {
    class: 'Paladin',
    race: 'Human',
    alignment: 'Lawful Good',
    background: 'Noble',
    attributes: {
      Strength: 15,
      Dexterity: 10,
      Constitution: 13,
      Intelligence: 8,
      Wisdom: 12,
      Charisma: 14,
    },
    backstory:
      'Born to nobility but chose the path of divine service. Swore sacred oaths to uphold justice and protect the innocent. Has vanquished many evils in the name of their deity. Believes their noble birth comes with responsibility to help others.',
    personality: {
      traits: 'Honor-bound, never breaks an oath, inspirational leader',
      ideals: 'Justice - All people deserve fair treatment under the law',
      bonds: 'My oath is my life - I will never forsake it',
      flaws: 'Too rigid in following my code, sees world in black and white',
    },
    appearance: {
      age: '26',
      height: '6ft 0in',
      weight: '180 lbs',
      eyes: 'Blue',
      skin: 'Fair',
      hair: 'Blonde, Well-kept',
      description: 'Noble bearing, armor always polished. Radiates confidence and righteousness.',
    },
  },

  barbarian: {
    class: 'Barbarian',
    race: 'Half-Orc',
    alignment: 'Chaotic Neutral',
    background: 'Outlander',
    attributes: {
      Strength: 15,
      Dexterity: 12,
      Constitution: 14,
      Intelligence: 8,
      Wisdom: 13,
      Charisma: 10,
    },
    backstory:
      'Raised among wild tribes in the northern wastes. Survived brutal rites of passage to become a warrior. Left tribe to prove strength against civilized lands. Channels primal rage in battle but is surprisingly gentle outside combat.',
    personality: {
      traits: 'Direct and honest, solves problems with strength, respectful of nature',
      ideals: 'Strength - The strong survive and protect the weak',
      bonds: 'My tribe - I must bring them honor',
      flaws: 'Quick to anger, struggles with complex social situations',
    },
    appearance: {
      age: '22',
      height: '6ft 6in',
      weight: '240 lbs',
      eyes: 'Amber',
      skin: 'Grayish-Green',
      hair: 'Black, Wild',
      description: 'Powerfully built with tusks and tribal tattoos. Scars tell stories of many battles.',
    },
  },

  bard: {
    class: 'Bard',
    race: 'Half-Elf',
    alignment: 'Chaotic Good',
    background: 'Entertainer',
    attributes: {
      Strength: 8,
      Dexterity: 14,
      Constitution: 12,
      Intelligence: 10,
      Wisdom: 13,
      Charisma: 15,
    },
    backstory:
      'Traveled with a troupe of performers since childhood. Learned that words and music can be as powerful as any weapon. Uses charm and wit to navigate dangerous situations. Collects stories and songs from every adventure.',
    personality: {
      traits: 'Charismatic performer, always ready with a joke or song, excellent storyteller',
      ideals: 'Creativity - The world needs art and beauty, not just strength',
      bonds: "My lute is my most precious possession - it was my mentor's gift",
      flaws: "Can't resist a dramatic entrance or showing off",
    },
    appearance: {
      age: '42',
      height: '5ft 9in',
      weight: '150 lbs',
      eyes: 'Hazel',
      skin: 'Olive',
      hair: 'Chestnut, Flowing',
      description: 'Graceful and expressive, with elaborate clothing. Always carries a musical instrument.',
    },
  },

  monk: {
    class: 'Monk',
    race: 'Human',
    alignment: 'Lawful Neutral',
    background: 'Hermit',
    attributes: {
      Strength: 12,
      Dexterity: 15,
      Constitution: 13,
      Intelligence: 10,
      Wisdom: 14,
      Charisma: 8,
    },
    backstory:
      'Trained in a secluded monastery high in the mountains. Mastered ancient martial arts and meditation techniques. Seeking enlightenment through adventure and testing skills against the world. Lives simply and values discipline above all.',
    personality: {
      traits: 'Calm and centered, speaks rarely but wisely, meditates daily',
      ideals: 'Discipline - Through control of self, one controls destiny',
      bonds: 'My monastery and the masters who taught me',
      flaws: "Detached from others' emotions, struggles with material desires",
    },
    appearance: {
      age: '24',
      height: '5ft 11in',
      weight: '160 lbs',
      eyes: 'Dark Brown',
      skin: 'Bronze',
      hair: 'Shaved',
      description: 'Lean and muscular, moves with fluid grace. Wears simple robes and no armor.',
    },
  },

  warlock: {
    class: 'Warlock',
    race: 'Tiefling',
    alignment: 'Chaotic Neutral',
    background: 'Charlatan',
    attributes: {
      Strength: 8,
      Dexterity: 13,
      Constitution: 14,
      Intelligence: 12,
      Wisdom: 10,
      Charisma: 15,
    },
    backstory:
      'Made a pact with a mysterious entity for power after a desperate moment. The bargain came with strange visions and otherworldly knowledge. Uses gifts to survive and seeks to understand the true nature of the pact. Questions whether power came at too great a cost.',
    personality: {
      traits: 'Mysterious, speaks in riddles, has unsettling presence',
      ideals: 'Power - Knowledge and strength are the only true currencies',
      bonds: 'Must understand my patron and the pact I made',
      flaws: 'Tempted by forbidden knowledge, makes risky deals',
    },
    appearance: {
      age: '27',
      height: '5ft 7in',
      weight: '140 lbs',
      eyes: 'Glowing Red',
      skin: 'Deep Crimson',
      hair: 'Black with Purple Tint',
      description: 'Horns curve back from forehead, tail swishes when agitated. Otherworldly aura surrounds them.',
    },
  },

  druid: {
    class: 'Druid',
    race: 'Wood Elf',
    alignment: 'Neutral',
    background: 'Hermit',
    attributes: {
      Strength: 10,
      Dexterity: 12,
      Constitution: 13,
      Intelligence: 12,
      Wisdom: 15,
      Charisma: 10,
    },
    backstory:
      'Grew up among druidic circles, learning to commune with nature and take animal forms. Witnessed civilization encroach on sacred groves and swore to protect the balance. Can speak with beasts and plants. Believes in the cycle of life and death.',
    personality: {
      traits: 'Speaks for nature, calm until nature is threatened, prefers wild shape',
      ideals: 'Balance - Nature must be preserved, neither good nor evil matters',
      bonds: 'My druid circle and the sacred grove we protect',
      flaws: 'Values nature over civilization, uncomfortable with technology',
    },
    appearance: {
      age: '189',
      height: '5ft 6in',
      weight: '125 lbs',
      eyes: 'Amber',
      skin: 'Bark-like Tan',
      hair: 'Moss Green',
      description: 'Adorned with natural elements - leaves, flowers, vines. Moves like a wild creature.',
    },
  },

  sorcerer: {
    class: 'Sorcerer',
    race: 'Dragonborn',
    alignment: 'Chaotic Good',
    background: 'Noble',
    attributes: {
      Strength: 10,
      Dexterity: 13,
      Constitution: 14,
      Intelligence: 10,
      Wisdom: 8,
      Charisma: 15,
    },
    backstory:
      'Born with draconic bloodline magic surging through veins. Noble family tried to suppress these wild powers, but they could not be contained. Ran away to master abilities and embrace true nature. Magic is instinctual and tied to emotions.',
    personality: {
      traits: 'Passionate and impulsive, magic manifests with emotions, proud heritage',
      ideals: 'Independence - Must be free to choose my own path',
      bonds: 'My draconic ancestor whose blood flows in my veins',
      flaws: 'Arrogant about innate abilities, magic sometimes escapes control',
    },
    appearance: {
      age: '19',
      height: '6ft 4in',
      weight: '220 lbs',
      eyes: 'Golden',
      skin: 'Brass Scales',
      hair: 'None',
      description: 'Reptilian features with scales that shimmer. Breath sometimes smokes when emotional.',
    },
  },

  ranger_archer: {
    class: 'Ranger',
    race: 'Wood Elf',
    alignment: 'Neutral Good',
    background: 'Outlander',
    attributes: {
      Strength: 10,
      Dexterity: 15,
      Constitution: 13,
      Intelligence: 12,
      Wisdom: 14,
      Charisma: 8,
    },
    backstory:
      'Master archer who protects the forest borders from monsters and invaders. Trained by ancient rangers in the art of the bow and wilderness survival. Has a favored enemy (orcs) after they raided homeland. Silent guardian of the wild places.',
    personality: {
      traits: 'Patient hunter, expert tracker, prefers actions to words',
      ideals: 'Protection - Must guard the natural world from corruption',
      bonds: 'The forest and all creatures within it',
      flaws: 'Holds grudges against favored enemies',
    },
    appearance: {
      age: '156',
      height: '5ft 11in',
      weight: '142 lbs',
      eyes: 'Leaf Green',
      skin: 'Copper',
      hair: 'Auburn, Braided',
      description: 'Lean and agile, with a longbow always within reach. Moves silently through any terrain.',
    },
  },
};

/**
 * Generate a complete character from an archetype with a random name
 */
export function generateCharacterFromArchetype(archetypeKey: string): CharacterSheet {
  const archetype = ARCHETYPES[archetypeKey];
  if (!archetype) {
    throw new Error(`Unknown archetype: ${archetypeKey}`);
  }

  // Generate random fantasy name based on race
  // eslint-disable-next-line no-use-before-define
  const name = generateFantasyName(archetype.race);

  // Calculate derived stats
  const conModifier = Math.floor(((archetype.attributes.Constitution ?? 10) - 10) / 2);
  const dexModifier = Math.floor(((archetype.attributes.Dexterity ?? 10) - 10) / 2);
  const proficiencyBonus = 2;
  const skillDetails = buildSkillDetails(archetype, proficiencyBonus);
  const skills = skillDetails.reduce<Record<string, number>>((acc, skill) => {
    acc[skill.name] = skill.modifier;
    return acc;
  }, {});
  const talents = CLASS_TALENTS[archetype.class] || [];
  const resourcePools = buildResourcePools(archetype.class);
  const backgroundDetails = buildBackgroundDetails(archetype);
  const expertises = skillDetails.filter((skill) => skill.proficiency === 'expertise').map((skill) => skill.name);

  return {
    name,
    race: archetype.race,
    characterClass: archetype.class,
    background: archetype.background,
    alignment: archetype.alignment,
    level: 1,
    xp: 0,
    hp: 10 + conModifier,
    maxHp: 10 + conModifier,
    temporaryHp: 0,
    hitDice: { total: 1, current: 1 },
    deathSaves: { successes: 0, failures: 0 },
    armorClass: 10 + dexModifier,
    initiative: dexModifier,
    speed: (() => {
      if (archetype.race.includes('Elf')) return 35;
      if (archetype.race.includes('Dwarf')) return 25;
      if (archetype.race.includes('Halfling')) return 25;
      return 30;
    })(),
    proficiencyBonus: 2,
    inspiration: false,
    attributes: archetype.attributes,
    savingThrows: {
      fortitude: 2,
      reflex: dexModifier,
      will: 0,
    },
    skills,
    skillDetails,
    expertises,
    baseAttackBonus: 1,
    attacks: [],
    equipment: 'Standard adventuring gear',
    currency: {
      cp: 0,
      sp: 0,
      ep: 0,
      gp: 50,
      pp: 0,
    },
    proficienciesAndLanguages: 'Common, and racial languages',
    features: `${archetype.class} features and ${archetype.race} racial traits`,
    talents,
    appearance: archetype.appearance,
    personality: archetype.personality,
    backstory: archetype.backstory,
    backgroundDetails,
    alliesAndOrganizations: '',
    treasure: '',
    resourcePools,
    advancementPoints: {
      ability: 0,
      skill: 0,
      talent: 0,
    },
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
}

/**
 * Generate a fantasy name based on race
 */
function generateFantasyName(race: string): string {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  // Customize names by race
  if (race.includes('Elf')) {
    return `${firstName} ${faker.word.adjective()}leaf`.replace(/\s+/g, ' ');
  }

  if (race.includes('Dwarf')) {
    return `${firstName} ${faker.word.adjective()}hammer`;
  }

  if (race.includes('Halfling')) {
    return `${firstName} ${faker.word.adjective()}foot`;
  }

  if (race.includes('Tiefling')) {
    return `${faker.word.adjective()} ${firstName}`;
  }

  if (race.includes('Dragonborn')) {
    return `${firstName}rax ${faker.word.adjective()}claw`;
  }

  if (race.includes('Orc')) {
    return `${firstName} ${faker.word.noun()}smasher`;
  }

  // Default human names
  return `${firstName} ${lastName}`;
}

/**
 * Get all available archetype keys
 */
export function getAvailableArchetypes(): string[] {
  return Object.keys(ARCHETYPES);
}

/**
 * Get archetype info
 */
export function getArchetypeInfo(key: string): { class: string; race: string } | null {
  const archetype = ARCHETYPES[key];
  if (!archetype) return null;

  return {
    class: archetype.class,
    race: archetype.race,
  };
}
