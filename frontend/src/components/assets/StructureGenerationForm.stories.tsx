/**
 * StructureGenerationForm Storybook Stories
 * Demonstrates structure generation form in different states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { StructureGenerationForm } from './StructureGenerationForm';

const meta = {
  title: 'Forms/StructureGenerationForm',
  component: StructureGenerationForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StructureGenerationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock handler
const handleSubmit = (params: any) => console.log('Structure parameters submitted:', params);

export const Default: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: true,
  },
};

export const Castle: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: false,
  },
  render: (args) => (
    // Note: This story shows the form with default values
    // User can select "castle" type and adjust to large dimensions in Storybook
    <StructureGenerationForm {...args} />
  ),
};

export const Dungeon: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: false,
  },
  render: (args) => (
    // Note: This story shows the form with default values
    // User can select "dungeon" type and increase complexity in Storybook
    <StructureGenerationForm {...args} />
  ),
};

export const Tower: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: false,
  },
  render: (args) => (
    // Note: This story shows the form with default values
    // User can select "tower" type and set floors to 5 in Storybook
    <StructureGenerationForm {...args} />
  ),
};
