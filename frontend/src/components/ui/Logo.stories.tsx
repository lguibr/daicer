/**
 * @file frontend/src/components/ui/Logo.stories.tsx
 * Logo component with random shake animation
 */

import type { Meta, StoryObj } from '@storybook/react';
import Logo from './Logo';

const meta = {
  title: 'UI/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0b080a',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the logo (always square with min-size)',
    },
    shakeIntensity: {
      control: 'select',
      options: ['none', 'subtle', 'normal', 'strong', 'extreme', 'chaotic'],
      description: 'Intensity of the shake animation',
    },
    shakeMinInterval: {
      control: { type: 'range', min: 1, max: 30, step: 1 },
      description: 'Minimum seconds between shakes',
    },
    shakeMaxInterval: {
      control: { type: 'range', min: 5, max: 60, step: 1 },
      description: 'Maximum seconds between shakes',
    },
    shakeDuration: {
      control: { type: 'range', min: 200, max: 2000, step: 100 },
      description: 'Duration of shake animation in milliseconds',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler for logo',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const Clickable: Story = {
  args: {
    size: 'lg',
    onClick: () => alert('Logo clicked!'),
  },
};

export const WithCustomClass: Story = {
  args: {
    size: 'lg',
    className: 'border-4 border-aurora-400/60 shadow-[0_0_30px_rgba(216,132,22,0.5)]',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <Logo size="sm" />
        <span className="text-xs text-shadow-300">Small (2rem)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Logo size="md" />
        <span className="text-xs text-shadow-300">Medium (3rem)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Logo size="lg" />
        <span className="text-xs text-shadow-300">Large (8rem)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Logo size="xl" />
        <span className="text-xs text-shadow-300">Extra Large (12rem)</span>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const NoShake: Story = {
  args: {
    size: 'lg',
    shakeIntensity: 'none',
  },
};

export const SubtleShake: Story = {
  args: {
    size: 'lg',
    shakeIntensity: 'subtle',
    shakeMinInterval: 3,
    shakeMaxInterval: 8,
  },
};

export const NormalShake: Story = {
  args: {
    size: 'lg',
    shakeIntensity: 'normal',
    shakeMinInterval: 5,
    shakeMaxInterval: 12,
  },
};

export const StrongShake: Story = {
  args: {
    size: 'lg',
    shakeIntensity: 'strong',
    shakeMinInterval: 4,
    shakeMaxInterval: 10,
  },
};

export const ExtremeShake: Story = {
  args: {
    size: 'lg',
    shakeIntensity: 'extreme',
    shakeMinInterval: 3,
    shakeMaxInterval: 8,
    shakeDuration: 800,
  },
};

export const ChaoticShake: Story = {
  args: {
    size: 'lg',
    shakeIntensity: 'chaotic',
    shakeMinInterval: 2,
    shakeMaxInterval: 6,
    shakeDuration: 1000,
  },
};

export const FastShake: Story = {
  args: {
    size: 'lg',
    shakeIntensity: 'strong',
    shakeMinInterval: 1,
    shakeMaxInterval: 3,
    shakeDuration: 400,
  },
};

export const SlowShake: Story = {
  args: {
    size: 'lg',
    shakeIntensity: 'normal',
    shakeMinInterval: 15,
    shakeMaxInterval: 30,
    shakeDuration: 1200,
  },
};

export const AllIntensities: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-12 p-12">
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" shakeIntensity="none" />
        <div className="text-center">
          <div className="text-sm font-semibold text-shadow-100">None</div>
          <div className="text-xs text-shadow-400">No animation</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" shakeIntensity="subtle" shakeMinInterval={2} shakeMaxInterval={5} />
        <div className="text-center">
          <div className="text-sm font-semibold text-shadow-100">Subtle</div>
          <div className="text-xs text-shadow-400">Gentle wobble</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" shakeIntensity="normal" shakeMinInterval={2} shakeMaxInterval={5} />
        <div className="text-center">
          <div className="text-sm font-semibold text-shadow-100">Normal</div>
          <div className="text-xs text-shadow-400">Balanced shake</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" shakeIntensity="strong" shakeMinInterval={2} shakeMaxInterval={5} />
        <div className="text-center">
          <div className="text-sm font-semibold text-shadow-100">Strong</div>
          <div className="text-xs text-shadow-400">2D movement</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" shakeIntensity="extreme" shakeMinInterval={2} shakeMaxInterval={5} shakeDuration={700} />
        <div className="text-center">
          <div className="text-sm font-semibold text-shadow-100">Extreme</div>
          <div className="text-xs text-shadow-400">With scaling</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" shakeIntensity="chaotic" shakeMinInterval={2} shakeMaxInterval={5} shakeDuration={800} />
        <div className="text-center">
          <div className="text-sm font-semibold text-shadow-100">Chaotic</div>
          <div className="text-xs text-shadow-400">Unpredictable</div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const Playground: Story = {
  args: {
    size: 'xl',
    shakeIntensity: 'normal',
    shakeMinInterval: 3,
    shakeMaxInterval: 8,
    shakeDuration: 600,
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-6 p-12">
      <Logo {...args} />
      <div className="text-center max-w-lg space-y-2">
        <p className="text-sm text-shadow-200">🎲 Use the controls below to customize the shake animation</p>
        <div className="text-xs text-shadow-400 space-y-1">
          <div>
            <strong>Intensity:</strong> {args.shakeIntensity}
          </div>
          <div>
            <strong>Interval:</strong> {args.shakeMinInterval}s - {args.shakeMaxInterval}s
          </div>
          <div>
            <strong>Duration:</strong> {args.shakeDuration}ms
          </div>
        </div>
      </div>
    </div>
  ),
};

export const InNavbar: Story = {
  render: () => (
    <div className="w-full min-h-[100px] bg-midnight-400/80 border-b border-midnight-500/70 backdrop-blur-xl p-4">
      <div className="flex items-center gap-4">
        <Logo size="md" onClick={() => console.log('Navigate to home')} />
        <span className="text-aurora-100 font-display text-xl tracking-[0.24em]">DAIcer</span>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
