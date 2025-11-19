import type { Meta, StoryObj } from '@storybook/react';

import { DiceLoader } from './DiceLoader';
import type { DieType, DieVisualStyle } from './types';

const meta: Meta<typeof DiceLoader> = {
  title: 'Dice/Visual Styles Gallery',
  component: DiceLoader,
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
};

export default meta;

type Story = StoryObj<typeof DiceLoader>;

// Complete Readability Matrix - ALL dice types for ONE material at a time
// This story shows all 7 die types in a single material to avoid WebGL context exhaustion
export const ReadabilityMatrix: Story = {
  render: () => {
    const dieTypes: DieType[] = [2, 4, 6, 8, 10, 12, 20];
    const visualStyle: DieVisualStyle = 'acrylic'; // Focus on one material to reduce contexts
    const testColor = '#38bdf8';

    return (
      <div style={{ padding: '3rem', background: '#0a0a0a', minHeight: '100vh' }}>
        <h1
          style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center', color: '#fff' }}
        >
          Readability Test - Acrylic Material
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '1rem', fontSize: '1.1rem' }}>
          All {dieTypes.length} die types in {visualStyle} style (static render)
        </p>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '3rem', fontSize: '0.95rem' }}>
          ⚠️ Use other stories to see different materials (WebGL context limit prevents showing all 35 combinations)
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '3rem',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {dieTypes.map((type) => (
            <div
              key={type}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem',
                background: '#111',
                borderRadius: '12px',
                border: '1px solid #333',
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '1rem' }}>D{type}</div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem', textAlign: 'center' }}>
                {type === 2 && 'Coin/Binary'}
                {type === 4 && 'Tetrahedron'}
                {type === 6 && 'Cube'}
                {type === 8 && 'Octahedron'}
                {type === 10 && 'Pentagonal'}
                {type === 12 && 'Dodecahedron'}
                {type === 20 && 'Icosahedron'}
              </div>
              <DiceLoader
                dieType={type}
                visualStyle={visualStyle}
                color={testColor}
                diceCount={1}
                size="large"
                message=""
                static
              />
            </div>
          ))}
        </div>

        {/* Material Info */}
        <div
          style={{
            marginTop: '4rem',
            padding: '2rem',
            background: '#111',
            borderRadius: '12px',
            border: '1px solid #222',
            maxWidth: '1400px',
            margin: '4rem auto 0',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#fff',
              textTransform: 'capitalize',
            }}
          >
            {visualStyle} Material
          </h2>
          <p style={{ fontSize: '1rem', color: '#888', lineHeight: '1.6' }}>
            Glass-like with high transmission, light passes through (IOR 1.5). Check "All Die Types" stories to see
            other materials.
          </p>
        </div>
      </div>
    );
  },
};

// 5 Visual Styles Showcase
export const AllVisualStyles: Story = {
  render: () => {
    const styles: DieVisualStyle[] = ['standard', 'acrylic', 'metallic', 'glowing', 'stone'];
    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          Visual Styles
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
          5 material presets for dice rendering (static)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2rem' }}>
          {styles.map((style) => (
            <div key={style} style={{ textAlign: 'center' }}>
              <DiceLoader
                dieType={20}
                visualStyle={style}
                color="#38bdf8"
                diceCount={1}
                size="large"
                message=""
                static
              />
              <p style={{ marginTop: '1rem', fontWeight: 'bold', textTransform: 'capitalize', fontSize: '1.1rem' }}>
                {style}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                {style === 'standard' && 'Semi-transparent, balanced'}
                {style === 'acrylic' && 'Glass-like, high transmission'}
                {style === 'metallic' && 'Chrome reflective finish'}
                {style === 'glowing' && 'Emissive, luminous'}
                {style === 'stone' && 'Matte, solid finish'}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// All Die Types with Acrylic Style
export const AllDieTypesAcrylic: Story = {
  render: () => {
    const types: DieType[] = [2, 4, 6, 8, 10, 12, 20];
    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          All Die Types - Acrylic Style
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
          7 polyhedral dice with glass-like transparency (static)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3rem' }}>
          {types.map((type) => (
            <div key={type} style={{ textAlign: 'center' }}>
              <DiceLoader
                dieType={type}
                visualStyle="acrylic"
                color="#a855f7"
                diceCount={1}
                size="large"
                message=""
                static
              />
              <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>D{type}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// All Die Types with Glowing Style
export const AllDieTypesGlowing: Story = {
  render: () => {
    const types: DieType[] = [2, 4, 6, 8, 10, 12, 20];
    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          All Die Types - Glowing Style
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
          7 polyhedral dice with emissive luminous effect (static)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3rem' }}>
          {types.map((type) => (
            <div key={type} style={{ textAlign: 'center' }}>
              <DiceLoader
                dieType={type}
                visualStyle="glowing"
                color="#22d3ee"
                diceCount={1}
                size="large"
                message=""
                static
              />
              <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>D{type}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// All Die Types with Metallic Style
export const AllDieTypesMetallic: Story = {
  render: () => {
    const types: DieType[] = [2, 4, 6, 8, 10, 12, 20];
    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          All Die Types - Metallic Style
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
          7 polyhedral dice with chrome reflective finish (static)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3rem' }}>
          {types.map((type) => (
            <div key={type} style={{ textAlign: 'center' }}>
              <DiceLoader
                dieType={type}
                visualStyle="metallic"
                color="#f97316"
                diceCount={1}
                size="large"
                message=""
                static
              />
              <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>D{type}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// Color Variations with Acrylic Style
export const AcrylicColorPalette: Story = {
  render: () => {
    const colors = [
      { name: 'Sky', hex: '#38bdf8' },
      { name: 'Orange', hex: '#f97316' },
      { name: 'Pink', hex: '#f472b6' },
      { name: 'Purple', hex: '#a855f7' },
      { name: 'Cyan', hex: '#22d3ee' },
      { name: 'Emerald', hex: '#4ade80' },
      { name: 'Amber', hex: '#facc15' },
      { name: 'Rose', hex: '#fb7185' },
    ];
    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          Acrylic Style - Color Palette
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
          8 color variations with glass-like transparency (static)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3rem' }}>
          {colors.map((color) => (
            <div key={color.name} style={{ textAlign: 'center' }}>
              <DiceLoader
                dieType={20}
                visualStyle="acrylic"
                color={color.hex}
                diceCount={1}
                size="large"
                message=""
                static
              />
              <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>{color.name}</p>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>{color.hex}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// Style × Color Matrix
export const StyleColorMatrix: Story = {
  render: () => {
    const styles: DieVisualStyle[] = ['standard', 'acrylic', 'metallic', 'glowing', 'stone'];
    const colors = [
      { name: 'Sky', hex: '#38bdf8' },
      { name: 'Purple', hex: '#a855f7' },
      { name: 'Emerald', hex: '#4ade80' },
      { name: 'Rose', hex: '#fb7185' },
    ];
    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          Style × Color Matrix
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
          D20 in all 5 styles × 4 colors = 20 combinations (static)
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `auto repeat(${styles.length}, 1fr)`,
            gap: '1.5rem',
            alignItems: 'center',
          }}
        >
          <div />
          {styles.map((style) => (
            <div key={style} style={{ textAlign: 'center', fontWeight: 'bold', textTransform: 'capitalize' }}>
              {style}
            </div>
          ))}
          {colors.map((color) => (
            <>
              <div key={`label-${color.name}`} style={{ fontWeight: 'bold', textAlign: 'right', paddingRight: '1rem' }}>
                {color.name}
              </div>
              {styles.map((style) => (
                <div key={`${color.name}-${style}`} style={{ display: 'flex', justifyContent: 'center' }}>
                  <DiceLoader
                    dieType={20}
                    visualStyle={style}
                    color={color.hex}
                    diceCount={1}
                    size="medium"
                    message=""
                    static
                  />
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    );
  },
};

// AI D20 Showcase
export const AID20AllStyles: Story = {
  render: () => {
    const styles: DieVisualStyle[] = ['standard', 'acrylic', 'metallic', 'glowing', 'stone'];
    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          AI D20 - All Visual Styles
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
          Marketing variant with "AI" on face 20 (static)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3rem' }}>
          {styles.map((style) => (
            <div key={style} style={{ textAlign: 'center' }}>
              <DiceLoader
                dieType="20-ai"
                visualStyle={style}
                color="#f97316"
                diceCount={1}
                size="large"
                message=""
                static
              />
              <p style={{ marginTop: '1rem', fontWeight: 'bold', textTransform: 'capitalize', fontSize: '1.1rem' }}>
                {style}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

// D20 vs AI D20 Comparison
export const D20Comparison: Story = {
  render: () => (
    <div style={{ padding: '3rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
        Regular D20 vs AI D20
      </h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>
        Side-by-side comparison of the two d20 variants (static)
      </p>
      <div style={{ display: 'flex', gap: '6rem', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <DiceLoader dieType={20} visualStyle="glowing" color="#4ade80" diceCount={1} size="large" message="" static />
          <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.5rem' }}>Regular D20</p>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>Face 20 shows "20"</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <DiceLoader
            dieType="20-ai"
            visualStyle="glowing"
            color="#f97316"
            diceCount={1}
            size="large"
            message=""
            static
          />
          <p style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.5rem' }}>AI D20</p>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>Face 20 shows "AI"</p>
        </div>
      </div>
    </div>
  ),
};

// High Cardinality Showcase - REDUCED to avoid WebGL context exhaustion
export const HighCardinality24Combinations: Story = {
  render: () => {
    const dieTypes: DieType[] = [6, 8, 12, 20]; // Reduced from 6 to 4 types
    const visualStyles: DieVisualStyle[] = ['acrylic', 'metallic', 'glowing'];
    const colors = ['#38bdf8', '#f97316']; // Reduced from 3 to 2 colors

    return (
      <div style={{ padding: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          High Cardinality Showcase
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '1rem', fontSize: '1.2rem' }}>
          {dieTypes.length} Types × {visualStyles.length} Styles × {colors.length} Colors ={' '}
          <strong style={{ color: '#38bdf8' }}>
            {dieTypes.length * visualStyles.length * colors.length} Combinations
          </strong>
        </p>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>
          Exploration of dice visual variety (static render)
        </p>
        <p style={{ textAlign: 'center', color: '#facc15', marginBottom: '3rem', fontSize: '0.9rem' }}>
          ⚠️ Reduced from 54 to avoid WebGL context exhaustion (browser limit ~16-32 contexts)
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '2rem',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {dieTypes.flatMap((type) =>
            visualStyles.flatMap((style) =>
              colors.map((color) => (
                <div
                  key={`${type}-${style}-${color}`}
                  style={{
                    textAlign: 'center',
                    border: '1px solid #333',
                    padding: '1rem',
                    borderRadius: '8px',
                    background: '#0a0a0a',
                  }}
                >
                  <DiceLoader
                    dieType={type}
                    visualStyle={style}
                    color={color}
                    diceCount={1}
                    size="small"
                    message=""
                    static
                  />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>D{type}</p>
                  <p style={{ fontSize: '0.7rem', color: '#888', textTransform: 'capitalize' }}>{style}</p>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      background: color,
                      borderRadius: '50%',
                      margin: '0.5rem auto 0',
                      border: '1px solid #444',
                    }}
                  />
                </div>
              ))
            )
          )}
        </div>
      </div>
    );
  },
};
