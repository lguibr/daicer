const TEMPLATES: Record<string, unknown> = {
  fighter: {
    name: 'Valen Heritage',
    race: 'Human',
    characterClass: 'Fighter',
    backstory:
      'A former soldier of the Crown who left the army after witnessing corruption. Now seeks to protect the innocent as a wandering mercenary.',
    alignment: 'Neutral Good',
    attributes: { Strength: 16, Dexterity: 13, Constitution: 15, Intelligence: 10, Wisdom: 12, Charisma: 10 },
    appearance: {
      age: '28',
      height: '6\'1"',
      weight: '210 lbs',
      eyes: 'Brown',
      skin: 'Tan',
      hair: 'Black',
      description: 'Broad-shouldered with a scar on the left cheek.',
      gender: 'Male',
    },
    personality: {
      traits: 'Protective, Direct',
      ideals: 'Justice',
      bonds: 'Old Squadmates',
      flaws: 'Distrusts Authority',
    },
    equipment: 'Chain Mail, Longsword, Shield',
    features: 'Fighting Style, Second Wind',
  },
  wizard: {
    name: 'Elara Moonwhisper',
    race: 'High Elf',
    characterClass: 'Wizard',
    backstory:
      'Expelled from the Academy for forbidden research into time magic. Seeks ancient artifacts to prove her theories.',
    alignment: 'Chaotic Neutral',
    attributes: { Strength: 8, Dexterity: 14, Constitution: 13, Intelligence: 16, Wisdom: 12, Charisma: 10 },
    appearance: {
      age: '110',
      height: '5\'6"',
      weight: '120 lbs',
      eyes: 'Green',
      skin: 'Pale',
      hair: 'Silver',
      description: 'Always smells of old parchment and ozone.',
      gender: 'Female',
    },
    personality: { traits: 'Curious, Obsessive', ideals: 'Knowledge', bonds: 'The Great Library', flaws: 'Arrogant' },
    equipment: 'Spellbook, Arcane Focus, Robes',
    features: 'Arcane Recovery, Spellcasting',
  },
  rogue: {
    name: 'Jax Shadowfoot',
    race: 'Halfling',
    characterClass: 'Rogue',
    backstory:
      'Grew up on the streets of the capital. Steals from the rich to feed himself and his street urchin family.',
    alignment: 'Chaotic Good',
    attributes: { Strength: 10, Dexterity: 16, Constitution: 12, Intelligence: 13, Wisdom: 10, Charisma: 14 },
    appearance: {
      age: '24',
      height: '3\'2"',
      weight: '45 lbs',
      eyes: 'Hazel',
      skin: 'Fair',
      hair: 'Curly Brown',
      description: 'Quick smile and quicker hands.',
      gender: 'Male',
    },
    personality: { traits: 'Charming, Skittish', ideals: 'Freedom', bonds: 'The Orphanage', flaws: 'Kleptomaniac' },
    equipment: "Leather Armor, Dagger x2, Thieves' Tools",
    features: 'Sneak Attack, Cunning Action',
  },
  cleric: {
    name: 'Sister Amara',
    race: 'Dwarf',
    characterClass: 'Cleric',
    backstory: 'A devout follower of the Life Domain, sent on a pilgrimage to heal the lands scarred by war.',
    alignment: 'Lawful Good',
    attributes: { Strength: 14, Dexterity: 10, Constitution: 15, Intelligence: 10, Wisdom: 16, Charisma: 12 },
    appearance: {
      age: '50',
      height: '4\'5"',
      weight: '150 lbs',
      eyes: 'Gray',
      skin: 'Ruddy',
      hair: 'Red Braid',
      description: 'Carries a heavy iron shield with a sun emblem.',
      gender: 'Female',
    },
    personality: {
      traits: 'Motherly, Stern',
      ideals: 'Charity',
      bonds: 'The Temple',
      flaws: 'Pacifist in wrong moments',
    },
    equipment: 'Scale Mail, Warhammer, Shield',
    features: 'Spellcasting, Divine Domain',
  },
};

export default () => ({
  async getTemplate(ctx) {
    const { archetype } = ctx.params;
    const key = archetype?.toLowerCase();

    // Default fallback logic
    let template = TEMPLATES[key];

    if (!template) {
      // Generic fallback for unmapped classes
      template = {
        ...(TEMPLATES.fighter as Record<string, unknown>),
        name: 'Novice Adventurer',
        characterClass: archetype.charAt(0).toUpperCase() + archetype.slice(1),
        backstory: `A novice ${archetype} starting their journey to find their destiny.`,
        race: 'Human', // Default
      };
    }

    ctx.body = {
      success: true,
      data: template,
    };
  },
});
