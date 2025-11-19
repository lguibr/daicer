/**
 * MapGenerationForm Storybook Stories
 * Demonstrates map generation form in different states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MapGenerationForm } from './MapGenerationForm';

const meta = {
  title: 'Forms/MapGenerationForm',
  component: MapGenerationForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MapGenerationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock handler
const handleSubmit = (params: any) => console.log('Map parameters submitted:', params);

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

export const LargeMap: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: false,
  },
  render: (args) => (
    // Note: This story shows the form with default values
    // User can adjust width/height to maximum (32x32) in Storybook
    <MapGenerationForm {...args} />
  ),
};

export const SmallIsland: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: false,
  },
  render: (args) => (
    // Note: This story shows the form with default values
    // User can adjust to small size (4x4) and high continentalness in Storybook
    <MapGenerationForm {...args} />
  ),
};
