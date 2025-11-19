/**
 * WorldParametersForm Storybook Stories
 * Demonstrates world generation parameter form in different states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { WorldParametersForm } from './WorldParametersForm';

const meta = {
  title: 'Forms/WorldParametersForm',
  component: WorldParametersForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldParametersForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock handler
const handleSubmit = (params: any) => console.log('World parameters submitted:', params);

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

export const ExtremeHotWetMountainous: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: false,
  },
  render: (args) => (
    // Note: This story shows the form with default values
    // User can adjust sliders to hot/wet/mountainous extremes in Storybook
    <WorldParametersForm {...args} />
  ),
};

export const ColdDryFlat: Story = {
  args: {
    onSubmit: handleSubmit,
    loading: false,
  },
  render: (args) => (
    // Note: This story shows the form with default values
    // User can adjust sliders to cold/dry/flat extremes in Storybook
    <WorldParametersForm {...args} />
  ),
};
