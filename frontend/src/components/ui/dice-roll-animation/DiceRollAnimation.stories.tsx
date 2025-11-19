import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { DiceRollAnimation } from './DiceRollAnimation';
import { CalibrationDebug } from './CalibrationDebug';

const meta: Meta<typeof DiceRollAnimation> = {
  title: 'Dice/Animation',
  component: DiceRollAnimation,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    showAxes: {
      control: 'boolean',
    },
    autoStart: {
      control: 'boolean',
    },
    colorByResult: {
      control: 'boolean',
      description: 'Color dice based on result (min=red, max=green) - DEFAULT: ON',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleD20: Story = {
  args: {
    dice: [{ type: 20, result: 15 }],
    size: 'medium',
    autoStart: true,
    colorByResult: true,
  },
};

export const CriticalHit: Story = {
  args: {
    dice: [{ type: 20, result: 20 }],
    size: 'large',
    autoStart: true,
    colorByResult: true, // Bright green for max roll
  },
};

export const CriticalFail: Story = {
  args: {
    dice: [{ type: 20, result: 1 }],
    size: 'large',
    autoStart: true,
    colorByResult: true, // Dark red for min roll
  },
};

export const MultipleD6: Story = {
  args: {
    dice: [
      { type: 6, result: 6 },
      { type: 6, result: 1 },
      { type: 6, result: 4 },
    ],
    size: 'medium',
    autoStart: true,
    colorByResult: true, // Each die colored by its result
  },
};

export const MixedDice: Story = {
  args: {
    dice: [
      { type: 20, result: 18 },
      { type: 6, result: 3 },
      { type: 4, result: 1 },
    ],
    size: 'medium',
    autoStart: true,
    colorByResult: true,
  },
};

export const AllDiceTypes: Story = {
  args: {
    dice: [
      { type: 2, result: 2 },
      { type: 4, result: 4 },
      { type: 6, result: 1 },
      { type: 8, result: 5 },
      { type: 10, result: 0 },
      { type: 12, result: 12 },
    ],
    size: 'small',
    autoStart: true,
    colorByResult: true,
  },
};

export const SmallSize: Story = {
  args: {
    dice: [
      { type: 6, result: 6 },
      { type: 6, result: 1 },
    ],
    size: 'small',
    autoStart: true,
    colorByResult: true,
  },
};

export const LargeSize: Story = {
  args: {
    dice: [{ type: 12, result: 7 }],
    size: 'large',
    autoStart: true,
    colorByResult: true,
  },
};

export const WithDebugAxes: Story = {
  args: {
    dice: [{ type: 20, result: 10 }],
    size: 'medium',
    showAxes: true,
    autoStart: true,
    colorByResult: true,
  },
};

export const WithCallback: Story = {
  render: (args) => {
    const [completed, setCompleted] = useState(false);
    const [key, setKey] = useState(0);

    const handleComplete = () => {
      setCompleted(true);
    };

    const handleRestart = () => {
      setCompleted(false);
      setKey((prev) => prev + 1);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <DiceRollAnimation
          key={key}
          dice={args.dice || [{ type: 20, result: 15 }]}
          onComplete={handleComplete}
          colorByResult
        />
        {completed && (
          <button
            type="button"
            onClick={handleRestart}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #38bdf8',
              background: '#1e293b',
              color: '#38bdf8',
              cursor: 'pointer',
            }}
          >
            Roll Again
          </button>
        )}
      </div>
    );
  },
  args: {
    dice: [
      { type: 20, result: 15 },
      { type: 6, result: 4 },
    ],
    size: 'medium',
    autoStart: true,
  },
};

export const WithoutColorGradient: Story = {
  args: {
    dice: [
      { type: 20, result: 1, color: '#38bdf8' },
      { type: 20, result: 20, color: '#38bdf8' },
    ],
    size: 'medium',
    autoStart: true,
    colorByResult: false, // Disable color gradient, use custom colors
  },
};

export const ColorGradientShowcase: Story = {
  args: {
    dice: [
      { type: 6, result: 1 }, // Dark red
      { type: 6, result: 2 }, // Red-orange
      { type: 6, result: 3 }, // Orange
      { type: 6, result: 4 }, // Yellow-green
      { type: 6, result: 5 }, // Light green
      { type: 6, result: 6 }, // Bright green
    ],
    size: 'small',
    autoStart: true,
    colorByResult: true, // Show full gradient
  },
};

export const DebugOrientation: Story = {
  render: () => {
    const [dieType, setDieType] = useState<2 | 4 | 6 | 8 | 10 | 12 | 20>(20);
    const [result, setResult] = useState(1);
    const [key, setKey] = useState(0);

    const maxForType: Record<number, number> = {
      2: 2,
      4: 4,
      6: 6,
      8: 8,
      10: 9,
      12: 12,
      20: 20,
    };

    const minForType: Record<number, number> = {
      2: 1,
      4: 1,
      6: 1,
      8: 1,
      10: 0,
      12: 1,
      20: 1,
    };

    const handleNextResult = () => {
      const max = maxForType[dieType] ?? 20;
      const min = minForType[dieType] ?? 1;
      if (result < max) {
        setResult(result + 1);
      } else {
        setResult(min);
      }
      setKey((prev) => prev + 1);
    };

    const handlePrevResult = () => {
      const max = maxForType[dieType] ?? 20;
      const min = minForType[dieType] ?? 1;
      if (result > min) {
        setResult(result - 1);
      } else {
        setResult(max);
      }
      setKey((prev) => prev + 1);
    };

    const handleChangeDieType = (newType: number) => {
      setDieType(newType as 2 | 4 | 6 | 8 | 10 | 12 | 20);
      const newMin = minForType[newType];
      setResult(newMin ?? 1);
      setKey((prev) => prev + 1);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Face Orientation Debug</h3>

        <CalibrationDebug />

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[2, 4, 6, 8, 10, 12, 20].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleChangeDieType(type)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: `2px solid ${dieType === type ? '#38bdf8' : '#444'}`,
                background: dieType === type ? '#1e3a8a' : '#1e293b',
                color: dieType === type ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: dieType === type ? 'bold' : 'normal',
              }}
            >
              d{type}
            </button>
          ))}
        </div>

        <DiceRollAnimation key={key} dice={[{ type: dieType, result }]} size="large" showAxes autoStart colorByResult />

        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Current: d{dieType} showing {result}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={handlePrevResult}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #38bdf8',
              background: '#1e293b',
              color: '#38bdf8',
              cursor: 'pointer',
            }}
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={handleNextResult}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #38bdf8',
              background: '#1e293b',
              color: '#38bdf8',
              cursor: 'pointer',
            }}
          >
            Next →
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '400px', textAlign: 'center' }}>
          Use this story to verify that the correct face number is visible to the camera for each die type and result.
          The axes helper shows: <strong>Red=X (right)</strong>, <strong>Green=Y (up)</strong>,{' '}
          <strong>Blue=Z (toward camera)</strong>. Camera is at (0, 0, 7.5) looking at origin. Faces should point toward
          +Z (blue axis). Color gradient is ON by default.
        </p>
      </div>
    );
  },
  args: {
    autoStart: true,
  },
};
