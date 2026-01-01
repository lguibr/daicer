/**
 * AttributesSection Storybook Stories
 * Character creation wizard - attributes step
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AttributesSection } from './AttributesSection';
import type { CharacterFormState } from './types';

const meta = {
  title: 'Forms/CharacterCreation/AttributesSection',
  component: AttributesSection,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AttributesSection>;

export default meta;
type Story = StoryObj<typeof meta>;
const mockFormState: CharacterFormState = {
  name: 'Thorin',
  race: 'dwarf',
  characterClass: 'fighter',
  background: 'soldier',
  alignment: 'lawful-good',
  attributes: {
    Strength: 8,
    Dexterity: 8,
    Constitution: 8,
    Intelligence: 8,
    Wisdom: 8,
    Charisma: 8,
  },
  skills: {},
  proficienciesAndLanguages: '',
  features: '',
  treasure: '',
  currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  resourcePools: [],
  talents: [],
  expertises: [],
  appearance: {
    gender: 'Male',
    age: '45',
    height: '4\'2"',
    weight: '160 lbs',
    hair: 'Brown',
    eyes: 'Green',
    skin: 'Tan',
    description: 'Battle scars',
  },
  personality: {
    traits: 'Brave and loyal',
    ideals: 'Honor above all',
    bonds: 'Protects his clan',
    flaws: 'Stubborn',
  },
  backstory: 'A seasoned warrior from the mountains',
  equipment: '',
};

export const Default: Story = {
  args: {
    attributes: mockFormState.attributes,
    pointsRemaining: 5,
    attributeBudget: 27,
    onAttributeChange: (attr, value) => console.info(`Change ${attr} to ${value}`),
  },
};

export const HighAttributes: Story = {
  args: {
    attributes: {
      Strength: 15,
      Dexterity: 12,
      Constitution: 14,
      Intelligence: 10,
      Wisdom: 11,
      Charisma: 13,
    },
    pointsRemaining: 0,
    attributeBudget: 27,
    onAttributeChange: (attr, value) => console.info(`Change ${attr} to ${value}`),
  },
};

export const MinimalPoints: Story = {
  args: {
    attributes: {
      Strength: 8,
      Dexterity: 8,
      Constitution: 8,
      Intelligence: 8,
      Wisdom: 8,
      Charisma: 8,
    },
    pointsRemaining: 27,
    attributeBudget: 27,
    onAttributeChange: (attr, value) => console.info(`Change ${attr} to ${value}`),
  },
};
