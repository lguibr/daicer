import type { Meta, StoryObj } from '@storybook/react';

import { LoadingOverlay } from './LoadingOverlay';

const meta: Meta<typeof LoadingOverlay> = {
  title: 'UI/Loading Overlay',
  component: LoadingOverlay,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  argTypes: {
    active: { control: 'boolean' },
    message: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof LoadingOverlay>;

/**
 * Default loading overlay with max 3 dice
 */
export const Default: Story = {
  args: {
    active: true,
    message: 'Loading...',
  },
};

/**
 * Loading with custom message
 */
export const WithCustomMessage: Story = {
  args: {
    active: true,
    message: 'Preparing your adventure...',
  },
};

/**
 * Authenticating state
 */
export const Authenticating: Story = {
  args: {
    active: true,
    message: 'Authenticating...',
  },
};

/**
 * Loading game room
 */
export const LoadingGameRoom: Story = {
  args: {
    active: true,
    message: 'Loading game room...',
  },
};

/**
 * Loading with 1 die
 */
export const SingleDie: Story = {
  args: {
    active: true,
    message: 'Processing...',
  },
};

/**
 * Loading with 2 dice
 */
export const TwoDice: Story = {
  args: {
    active: true,
    message: 'Rolling the dice...',
  },
};

/**
 * Loading with 3 dice (default max)
 */
export const ThreeDice: Story = {
  args: {
    active: true,
    message: 'Summoning shiny math rocks...',
  },
};

/**
 * Small size loading
 */
export const SmallSize: Story = {
  args: {
    active: true,
    message: 'Please wait...',
  },
};

/**
 * Medium size loading
 */
export const MediumSize: Story = {
  args: {
    active: true,
    message: 'Loading data...',
  },
};

/**
 * Large size loading
 */
export const LargeSize: Story = {
  args: {
    active: true,
    message: 'Initializing game...',
  },
};

/**
 * Interactive demo with content behind overlay
 */
export const WithContent: Story = {
  render: (args) => (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Game Dashboard</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>This content is blurred behind the loading overlay</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}
        >
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              style={{
                padding: '2rem',
                background: '#222',
                borderRadius: '8px',
                color: '#aaa',
              }}
            >
              Card {i + 1}
            </div>
          ))}
        </div>
      </div>
      <LoadingOverlay {...args} />
    </div>
  ),
  args: {
    active: true,
    message: 'Loading your game...',
  },
};

/**
 * Inactive overlay (hidden)
 */
export const Inactive: Story = {
  args: {
    active: false,
    message: 'This should not be visible',
  },
};
