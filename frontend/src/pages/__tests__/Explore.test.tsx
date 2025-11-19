import { render, screen, waitFor } from '../../test/test-utils';
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

const mockClasses = vi.hoisted<CharacterClass[]>(() => [
  {
    id: 'fighter',
    name: 'Fighter',
    description: 'A master of martial combat.',
    hitDie: 10,
    primaryAbility: 'Strength',
    savingThrows: ['Strength', 'Constitution'],
    imageUrl: null,
  },
]);

const mockRaces = vi.hoisted<Race[]>(() => [
  {
    id: 'human',
    name: 'Human',
    description: 'Versatile and ambitious.',
    speed: 30,
    size: 'Medium',
    imageUrl: null,
  },
]);

const mockBackgrounds = vi.hoisted<Background[]>(() => [
  {
    id: 'acolyte',
    name: 'Acolyte',
    description: 'You have spent your life in a temple.',
    skillProficiencies: ['Insight', 'Religion'],
    imageUrl: null,
  },
]);

const mockAbilities = vi.hoisted<Ability[]>(() => [
  {
    id: 'strength',
    index: 'strength',
    name: 'Strength',
    fullName: 'Strength',
    description: 'Measures physical power.',
    skills: ['Athletics'],
    imageUrl: null,
  },
]);

const mockSkills = vi.hoisted<Skill[]>(() => [
  {
    id: 'athletics',
    index: 'athletics',
    name: 'Athletics',
    description: 'Covers difficult situations requiring physical prowess.',
    abilityScore: 'Strength',
    imageUrl: null,
  },
]);

const mockAlignments = vi.hoisted<Alignment[]>(() => [
  {
    id: 'lg',
    name: 'Lawful Good',
    abbreviation: 'LG',
    description: 'Always strives to do the right thing.',
    imageUrl: null,
  },
]);

const mockLanguages = vi.hoisted<Language[]>(() => [
  {
    id: 'common',
    index: 'common',
    name: 'Common',
    isRare: false,
    note: 'Spoken across most regions.',
    imageUrl: null,
  },
]);

const mockMagicSchools = vi.hoisted<MagicSchool[]>(() => [
  {
    id: 'evocation',
    index: 'evocation',
    name: 'Evocation',
    description: 'Manipulates energy to create powerful effects.',
    imageUrl: null,
  },
]);

const mockConditions = vi.hoisted<Condition[]>(() => [
  {
    id: 'blinded',
    index: 'blinded',
    name: 'Blinded',
    description: 'Cannot see and automatically fails checks requiring sight.',
    imageUrl: null,
  },
]);

const mockDamageTypes = vi.hoisted<DamageType[]>(() => [
  {
    id: 'fire',
    index: 'fire',
    name: 'Fire',
    description: 'Scorching flames.',
    imageUrl: null,
  },
]);

const mockEquipment = vi.hoisted<EquipmentItem[]>(() => [
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
]);

const mockWeaponProperties = vi.hoisted<WeaponProperty[]>(() => [
  {
    id: 'versatile',
    index: 'versatile',
    name: 'Versatile',
    description: 'Can be used with one or two hands.',
    imageUrl: null,
  },
]);

const mockSpells = vi.hoisted<SpellData[]>(() => [
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
    effectShape: 'ranged_single' as SpellEffectShape,
    effectDimensions: {},
  },
]);

const mockRules = vi.hoisted<SRDRule[]>(() => [
  {
    id: 'initiative',
    title: 'Initiative',
    category: 'general',
    content: 'Determines turn order.',
    tags: ['turn-order'],
    imageUrl: null,
  },
]);

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
  getMonsters: vi.fn(() => Promise.resolve([])),
  getMagicItems: vi.fn(() => Promise.resolve([])),
  getFeatures: vi.fn(() => Promise.resolve([])),
  getTraits: vi.fn(() => Promise.resolve([])),
  getSubclasses: vi.fn(() => Promise.resolve([])),
  getProficiencies: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../services/spells', () => ({
  getAllSpells: vi.fn(() => mockSpells),
}));

vi.mock('daicer/seeds/data/srd-rules', () => ({
  SRD_RULES: mockRules,
}));

describe('ExplorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('renders SRD sections after loading', async () => {
    // TODO: Fix this test - async data loading not working properly in test environment
    render(
      <MemoryRouter initialEntries={['/explore']}>
        <ExplorePage />
      </MemoryRouter>
    );

    // Wait for the "Fighter" class to appear (from mock data)
    expect(await screen.findByText('Fighter', {}, { timeout: 3000 })).toBeInTheDocument();

    // Verify other sections are rendered
    expect(screen.getByText('Character Classes')).toBeInTheDocument();
    expect(screen.getByText('Ancestries')).toBeInTheDocument();
    expect(screen.getAllByText('Longsword')).not.toHaveLength(0);
    expect(screen.getByText('Rules Compendium')).toBeInTheDocument();
  });
});
