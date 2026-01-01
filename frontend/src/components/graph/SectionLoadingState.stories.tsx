/**
 * SectionLoadingState Storybook Stories
 * Visual documentation for section loading states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { SectionLoadingState } from './SectionLoadingState';

const meta = {
  title: 'Graph/SectionLoadingState',
  component: SectionLoadingState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionLoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Loading state without progress
 */
export const LoadingNoProgress: Story = {
  args: {
    sectionNumber: 1,
    sectionName: 'Generating World History',
  },
};

/**
 * Loading state with progress indicator
 */
export const LoadingWithProgress: Story = {
  args: {
    sectionNumber: 1,
    sectionName: 'Generating World History',
    progress: {
      current: 5,
      total: 10,
    },
  },
};

/**
 * Loading with current node display (advanced mode)
 */
export const LoadingWithNode: Story = {
  args: {
    sectionNumber: 1,
    sectionName: 'Generating World History',
    progress: {
      current: 7,
      total: 10,
    },
    currentNode: 'generate_history_period',
  },
};

/**
 * Section 2 loading
 */
export const Section2Loading: Story = {
  args: {
    sectionNumber: 2,
    sectionName: 'Generating World Configuration',
    progress: {
      current: 3,
      total: 7,
    },
    currentNode: 'collapse_terrain',
  },
};

/**
 * Section 3 loading (per-player)
 */
export const Section3Loading: Story = {
  args: {
    sectionNumber: 3,
    sectionName: 'Generating Character Opening',
    progress: {
      current: 1,
      total: 2,
    },
  },
};

/**
 * Error state with retry button
 */
export const ErrorWithRetry: Story = {
  args: {
    sectionNumber: 1,
    sectionName: 'Generating World History',
    error: 'LLM timeout at history_period_node (period 5/10)',
    onRetry: () => console.info('Retry clicked'),
  },
};

/**
 * Error state without retry button
 */
export const ErrorNoRetry: Story = {
  args: {
    sectionNumber: 2,
    sectionName: 'Generating World Configuration',
    error: 'Invalid input: missing historyPeriods from Section 1',
  },
};

/**
 * Validation error
 */
export const ValidationError: Story = {
  args: {
    sectionNumber: 1,
    sectionName: 'Generating World History',
    error: 'Validation failed: theme is required',
    onRetry: () => console.info('Retry clicked'),
  },
};
