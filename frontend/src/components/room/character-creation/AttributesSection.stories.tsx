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

// Mock state and handlers
const mockFormState: CharacterFormState = {
  name: 'Thorin',
  race: 'dwarf',
  class: 'fighter',
  background: 'soldier',
  alignment: 'lawful-good',
  attributes: {
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8,
  },
  appearance: {
    gender: 'Male',
    age: 45,
    height: '4\'2"',
    weight: '160 lbs',
    hair: 'Brown',
    eyes: 'Green',
    skin: 'Tan',
    distinguishingMarks: 'Battle scars',
  },
  personality: {
    traits: 'Brave and loyal',
    ideals: 'Honor above all',
    bonds: 'Protects his clan',
    flaws: 'Stubborn',
  },
  backstory: 'A seasoned warrior from the mountains',
  avatar: { mode: 'portrait', urls: [] },
  equipment: [],
};

const handleUpdate = (updates: Partial<CharacterFormState>) => {
  console.log('Form updated:', updates);
};

export const Default: Story = {
  args: {
    formState: mockFormState,
    onUpdate: handleUpdate,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    formState: mockFormState,
    onUpdate: handleUpdate,
    isLoading: true,
  },
};

export const HighAttributes: Story = {
  args: {
    formState: {
      ...mockFormState,
      attributes: {
        strength: 15,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 11,
        charisma: 13,
      },
    },
    onUpdate: handleUpdate,
    isLoading: false,
  },
};

export const MinimalPoints: Story = {
  args: {
    formState: {
      ...mockFormState,
      attributes: {
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8,
      },
    },
    onUpdate: handleUpdate,
    isLoading: false,
  },
};
