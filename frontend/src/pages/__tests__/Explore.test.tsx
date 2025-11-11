import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Ability,
  Alignment,
  Background,
  CharacterClass,
  Condition,
  DamageType,
  EquipmentItem,
  Language,
  MagicSchool,
  Race,
  Skill,
  WeaponProperty,
} from '../../services/game-data';
import { SpellEffectShape } from '../../types/spells';
import type { SpellData } from '../../types/spells';
import type { SRDRule } from 'daicer/seeds/data/srd-rules.ts';
import ExplorePage from '../Explore';

const mockClasses: CharacterClass[] = [
  {
    id: 'fighter',
    name: 'Fighter',
    description: 'A master of martial combat.',
    hitDie: 10,
    primaryAbility: 'Strength',
    savingThrows: ['Strength', 'Constitution'],
    imageUrl: null,
  },
];

const mockRaces: Race[] = [
  {
    id: 'human',
    name: 'Human',
    description: 'Versatile and ambitious.',
    speed: 30,
    size: 'Medium',
    imageUrl: null,
  },
];

const mockBackgrounds: Background[] = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    description: 'You have spent your life in a temple.',
    skillProficiencies: ['Insight', 'Religion'],
    imageUrl: null,
  },
];

const mockAbilities: Ability[] = [
  {
    id: 'strength',
    index: 'strength',
    name: 'Strength',
    fullName: 'Strength',
    description: 'Measures physical power.',
    skills: ['Athletics'],
    imageUrl: null,
  },
];

const mockSkills: Skill[] = [
  {
    id: 'athletics',
    index: 'athletics',
    name: 'Athletics',
    description: 'Covers difficult situations requiring physical prowess.',
    abilityScore: 'Strength',
    imageUrl: null,
  },
];

const mockAlignments: Alignment[] = [
  {
    id: 'lg',
    name: 'Lawful Good',
    abbreviation: 'LG',
    description: 'Always strives to do the right thing.',
    imageUrl: null,
  },
];

const mockLanguages: Language[] = [
  {
    id: 'common',
    index: 'common',
    name: 'Common',
    isRare: false,
    note: 'Spoken across most regions.',
    imageUrl: null,
  },
];

const mockMagicSchools: MagicSchool[] = [
  {
    id: 'evocation',
    index: 'evocation',
    name: 'Evocation',
    description: 'Manipulates energy to create powerful effects.',
    imageUrl: null,
  },
];

const mockConditions: Condition[] = [
  {
    id: 'blinded',
    index: 'blinded',
    name: 'Blinded',
    description: 'Cannot see and automatically fails checks requiring sight.',
    imageUrl: null,
  },
];

const mockDamageTypes: DamageType[] = [
  {
    id: 'fire',
    index: 'fire',
    name: 'Fire',
    description: 'Scorching flames.',
    imageUrl: null,
  },
];

const mockEquipment: EquipmentItem[] = [
  {
    index: 'longsword',
    name: 'Longsword',
    equipmentCategory: 'Weapon',
    cost: { quantity: 15, unit: 'gp' },
    weight: 3,
    description: 'Versatile martial melee weapon.',
    properties: ['Versatile'],
    weaponCategory: 'Martial',
    imageUrl: null,
  },
];

const mockWeaponProperties: WeaponProperty[] = [
  {
    id: 'versatile',
    index: 'versatile',
    name: 'Versatile',
    description: 'Can be used with one or two hands.',
    imageUrl: null,
  },
];

const mockSpells: SpellData[] = [
  {
    id: 'fire-bolt',
    name: 'Fire Bolt',
    level: 0,
    school: 'Evocation',
    imageUrl: null,
    castingTime: '1 action',
    range: '120 feet',
    components: {
      verbal: true,
      somatic: true,
      material: null,
    },
    duration: 'Instantaneous',
    description: 'A bolt of fire streaks toward a creature.',
    isRitual: false,
    effectShape: SpellEffectShape.RANGED_SINGLE,
    effectDimensions: {},
  },
];

const mockRules: SRDRule[] = [
  {
    id: 'initiative',
    title: 'Initiative',
    category: 'general',
    content: 'Determines turn order.',
    tags: ['turn-order'],
    imageUrl: null,
  },
];

vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: null,
    loading: false,
    error: null,
    signOut: vi.fn(),
    signInWithGoogle: vi.fn(),
  }),
}));

vi.mock('../../components/ui', async () => {
  const actual = await vi.importActual<typeof import('../../components/ui')>('../../components/ui');
  return {
    ...actual,
    DiceLoader: () => <div data-testid="dice-loader" />,
  };
});

vi.mock('../../services/game-data', () => ({
  getClasses: vi.fn().mockResolvedValue(mockClasses),
  getRaces: vi.fn().mockResolvedValue(mockRaces),
  getBackgrounds: vi.fn().mockResolvedValue(mockBackgrounds),
  getAbilities: vi.fn().mockResolvedValue(mockAbilities),
  getSkills: vi.fn().mockResolvedValue(mockSkills),
  getAlignments: vi.fn().mockResolvedValue(mockAlignments),
  getLanguages: vi.fn().mockResolvedValue(mockLanguages),
  getMagicSchools: vi.fn().mockResolvedValue(mockMagicSchools),
  getConditions: vi.fn().mockResolvedValue(mockConditions),
  getDamageTypes: vi.fn().mockResolvedValue(mockDamageTypes),
  getEquipment: vi.fn().mockResolvedValue(mockEquipment),
  getWeaponProperties: vi.fn().mockResolvedValue(mockWeaponProperties),
}));

vi.mock('../../services/spells', () => ({
  getAllSpells: vi.fn(() => mockSpells),
}));

vi.mock('daicer/seeds/data/srd-rules.ts', () => ({
  SRD_RULES: mockRules,
}));

describe('ExplorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SRD sections after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/explore']}>
        <ExplorePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Retrieving tomes from the library/i)).toBeInTheDocument();

    expect(await screen.findByText('Character Classes')).toBeInTheDocument();
    expect(screen.getByText('Fighter')).toBeInTheDocument();
    expect(screen.getByText('Ancestries')).toBeInTheDocument();
    expect(screen.getByText('Longsword')).toBeInTheDocument();
    expect(screen.getByText('Rules Compendium')).toBeInTheDocument();
  });
});
