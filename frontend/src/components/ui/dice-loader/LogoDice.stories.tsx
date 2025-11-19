import type { Meta, StoryObj } from '@storybook/react';

import { LogoDice } from './LogoDice';

const meta: Meta<typeof LogoDice> = {
  title: 'Dice/Logo Dice',
  component: LogoDice,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    visualStyle: {
      control: 'select',
      options: ['standard', 'acrylic', 'metallic', 'glowing', 'stone'],
    },
    color: { control: 'color' },
    showAxes: { control: 'boolean' },
    animated: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof LogoDice>;

/**
 * Default animated logo dice with branding:
 * - Spins crazy → shakes → stops with AI face up
 * - Color: Orange/yellow (#ff9500)
 * - Style: Glowing for brand presence
 */
export const Default: Story = {
  args: {
    size: 'large',
    color: '#ff9500',
    visualStyle: 'glowing',
    animated: true,
  },
};

/**
 * Static logo dice for branding/logo usage
 */
export const Static: Story = {
  args: {
    size: 'medium',
    color: '#ff9500',
    visualStyle: 'glowing',
    animated: false,
  },
};

/**
 * Small animated version for inline use
 */
export const SmallAnimated: Story = {
  args: {
    size: 'small',
    color: '#ff9500',
    visualStyle: 'glowing',
    animated: true,
  },
};

/**
 * Large hero version with acrylic style
 */
export const HeroAcrylic: Story = {
  args: {
    size: 'large',
    color: '#ffa500',
    visualStyle: 'acrylic',
    animated: true,
  },
};

/**
 * Metallic gold branding version
 */
export const MetallicGold: Story = {
  args: {
    size: 'large',
    color: '#ffd700',
    visualStyle: 'metallic',
    animated: true,
  },
};

/**
 * All visual styles comparison
 */
export const AllStyles: Story = {
  render: () => {
    const styles: Array<'standard' | 'acrylic' | 'metallic' | 'glowing' | 'stone'> = [
      'standard',
      'acrylic',
      'metallic',
      'glowing',
      'stone',
    ];

    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center', color: '#fff' }}>
          DAICER Logo Dice - All Styles
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
          D20 with branded faces: AI (20), D (8), CER (17)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2rem' }}>
          {styles.map((style) => (
            <div key={style} style={{ textAlign: 'center' }}>
              <LogoDice size="large" visualStyle={style} color="#ff9500" animated={false} />
              <p
                style={{
                  marginTop: '1rem',
                  fontWeight: 'bold',
                  textTransform: 'capitalize',
                  fontSize: '1.1rem',
                  color: '#fff',
                }}
              >
                {style}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

/**
 * Color variations for branding
 */
export const BrandColors: Story = {
  render: () => {
    const colors = [
      { name: 'Orange', hex: '#ff9500' },
      { name: 'Amber', hex: '#ffa500' },
      { name: 'Gold', hex: '#ffd700' },
      { name: 'Yellow', hex: '#ffeb3b' },
      { name: 'Purple', hex: '#9333ea' },
      { name: 'Cyan', hex: '#22d3ee' },
    ];

    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center', color: '#fff' }}>
          Logo Dice - Brand Color Options
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>Static renders for brand guidelines</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem' }}>
          {colors.map((color) => (
            <div key={color.name} style={{ textAlign: 'center' }}>
              <LogoDice size="large" visualStyle="glowing" color={color.hex} animated={false} />
              <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{color.name}</p>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>{color.hex}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

/**
 * Animation demo - side by side comparison
 */
export const AnimationComparison: Story = {
  render: () => (
    <div style={{ padding: '3rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center', color: '#fff' }}>
        Animated vs Static
      </h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
        Left: Full animation sequence | Right: Static logo
      </p>
      <div style={{ display: 'flex', gap: '6rem', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <LogoDice size="large" color="#ff9500" visualStyle="glowing" animated />
          <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.5rem', color: '#fff' }}>Animated</p>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>Spin → Shake → Critical</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <LogoDice size="large" color="#ff9500" visualStyle="glowing" animated={false} />
          <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.5rem', color: '#fff' }}>Static</p>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>AI face visible</p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Debug mode with axes
 */
export const WithDebugAxes: Story = {
  args: {
    size: 'large',
    color: '#ff9500',
    visualStyle: 'glowing',
    animated: true,
    showAxes: true,
  },
};
