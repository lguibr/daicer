/**
 * @file frontend/src/components/combat/SpellEffectOverlay.stories.tsx
 * @description BIG CARDINALITY: Comprehensive spell effect shape visualizations
 * @note Update README.md when adding new spell shapes or visualizations
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  calculateConeArea,
  calculateSphereArea,
  calculateCubeArea,
  calculateLineArea,
  calculateCylinderArea,
  calculateSelfAuraArea,
  calculateMeleeTouchArea,
} from '../../utils/spellGeometry';
import { SpellEffectOverlay } from './SpellEffectOverlay';
import type { GridPosition } from '../../types/spells';
import { SpellEffectShape } from '../../types/spells';

// Helper to calculate cone area (simplified frontend version)
function calculateCone(caster: GridPosition, target: GridPosition, length: number): GridPosition[] {
  return calculateConeArea(caster, { x: target.x - caster.x, y: target.y - caster.y }, length);
}

function calculateSphere(center: GridPosition, radius: number, gridWidth = 24, gridHeight = 24): GridPosition[] {
  return calculateSphereArea(center, radius, gridWidth, gridHeight);
}

function calculateCube(corner: GridPosition, size: number): GridPosition[] {
  return calculateCubeArea(corner, size, true);
}

function calculateLine(start: GridPosition, end: GridPosition, length: number, width = 5): GridPosition[] {
  return calculateLineArea(start, end, length, width);
}

const meta = {
  title: 'Combat/SpellEffectOverlay',
  component: SpellEffectOverlay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpellEffectOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

const caster = { x: 5, y: 5 };

// ===== CONE SHAPES (8 directions) =====

export const ConeEast: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: caster,
    targetPosition: { x: 10, y: 5 },
    affectedSquares: calculateCone(caster, { x: 10, y: 5 }, 15),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(255, 69, 0, 0.4)',
  },
};

export const ConeNorth: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: caster,
    targetPosition: { x: 5, y: 1 },
    affectedSquares: calculateCone(caster, { x: 5, y: 1 }, 15),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(255, 69, 0, 0.4)',
  },
};

export const ConeNorthEast: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: caster,
    targetPosition: { x: 9, y: 1 },
    affectedSquares: calculateCone(caster, { x: 9, y: 1 }, 15),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(255, 69, 0, 0.4)',
  },
};

export const ConeSouthEast: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: caster,
    targetPosition: { x: 9, y: 9 },
    affectedSquares: calculateCone(caster, { x: 9, y: 9 }, 15),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(255, 69, 0, 0.4)',
  },
};

export const ConeSouth: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: caster,
    targetPosition: { x: 5, y: 9 },
    affectedSquares: calculateCone(caster, { x: 5, y: 9 }, 15),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(255, 69, 0, 0.4)',
  },
};

export const Cone30FtBurningHands: Story = {
  args: {
    gridWidth: 15,
    gridHeight: 15,
    casterPosition: { x: 2, y: 7 },
    targetPosition: { x: 10, y: 7 },
    affectedSquares: calculateCone({ x: 2, y: 7 }, { x: 10, y: 7 }, 30),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(255, 100, 0, 0.5)',
  },
};

// ===== SPHERE SHAPES (different radii) =====

export const Sphere10ft: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: caster,
    targetPosition: { x: 8, y: 8 },
    affectedSquares: calculateSphere({ x: 8, y: 8 }, 10),
    effectShape: SpellEffectShape.SPHERE,
    effectColor: 'rgba(100, 100, 255, 0.3)',
  },
};

export const Sphere15ft: Story = {
  args: {
    gridWidth: 15,
    gridHeight: 15,
    casterPosition: { x: 3, y: 3 },
    targetPosition: { x: 10, y: 10 },
    affectedSquares: calculateSphere({ x: 10, y: 10 }, 15),
    effectShape: SpellEffectShape.SPHERE,
    effectColor: 'rgba(100, 200, 255, 0.35)',
  },
};

export const Sphere20FtFireball: Story = {
  args: {
    gridWidth: 16,
    gridHeight: 16,
    casterPosition: { x: 2, y: 2 },
    targetPosition: { x: 10, y: 10 },
    affectedSquares: calculateSphere({ x: 10, y: 10 }, 20),
    effectShape: SpellEffectShape.SPHERE,
    effectColor: 'rgba(255, 69, 0, 0.4)',
  },
};

export const Sphere30ft: Story = {
  args: {
    gridWidth: 20,
    gridHeight: 20,
    casterPosition: { x: 3, y: 3 },
    targetPosition: { x: 12, y: 12 },
    affectedSquares: calculateSphere({ x: 12, y: 12 }, 30),
    effectShape: SpellEffectShape.SPHERE,
    effectColor: 'rgba(150, 100, 255, 0.35)',
  },
};

export const Sphere40ft: Story = {
  args: {
    gridWidth: 24,
    gridHeight: 24,
    casterPosition: { x: 4, y: 4 },
    targetPosition: { x: 14, y: 14 },
    affectedSquares: calculateSphere({ x: 14, y: 14 }, 40),
    effectShape: SpellEffectShape.SPHERE,
    effectColor: 'rgba(200, 100, 200, 0.3)',
  },
};

// ===== LINE SHAPES (various angles) =====

export const LineHorizontalEast: Story = {
  args: {
    gridWidth: 25,
    gridHeight: 12,
    casterPosition: { x: 2, y: 6 },
    targetPosition: { x: 22, y: 6 },
    affectedSquares: calculateLine({ x: 2, y: 6 }, { x: 22, y: 6 }, 100),
    effectShape: SpellEffectShape.LINE,
    effectColor: 'rgba(100, 200, 255, 0.5)',
  },
};

export const LineVerticalSouth: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 25,
    casterPosition: { x: 6, y: 2 },
    targetPosition: { x: 6, y: 22 },
    affectedSquares: calculateLine({ x: 6, y: 2 }, { x: 6, y: 22 }, 100),
    effectShape: SpellEffectShape.LINE,
    effectColor: 'rgba(100, 200, 255, 0.5)',
  },
};

export const LineDiagonalNE: Story = {
  args: {
    gridWidth: 20,
    gridHeight: 20,
    casterPosition: { x: 2, y: 18 },
    targetPosition: { x: 18, y: 2 },
    affectedSquares: calculateLine({ x: 2, y: 18 }, { x: 18, y: 2 }, 100),
    effectShape: SpellEffectShape.LINE,
    effectColor: 'rgba(100, 200, 255, 0.5)',
  },
};

export const LineDiagonalSE: Story = {
  args: {
    gridWidth: 20,
    gridHeight: 20,
    casterPosition: { x: 2, y: 2 },
    targetPosition: { x: 18, y: 18 },
    affectedSquares: calculateLine({ x: 2, y: 2 }, { x: 18, y: 18 }, 100),
    effectShape: SpellEffectShape.LINE,
    effectColor: 'rgba(100, 200, 255, 0.5)',
  },
};

export const Line100FtLightningBolt: Story = {
  args: {
    gridWidth: 25,
    gridHeight: 15,
    casterPosition: { x: 3, y: 7 },
    targetPosition: { x: 23, y: 7 },
    affectedSquares: calculateLine({ x: 3, y: 7 }, { x: 23, y: 7 }, 100),
    effectShape: SpellEffectShape.LINE,
    effectColor: 'rgba(100, 150, 255, 0.6)',
  },
};

// ===== CUBE SHAPES (various sizes) =====

export const Cube10ft: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: { x: 2, y: 2 },
    targetPosition: { x: 7, y: 7 },
    affectedSquares: calculateCube({ x: 7, y: 7 }, 10),
    effectShape: SpellEffectShape.CUBE,
    effectColor: 'rgba(150, 255, 150, 0.4)',
  },
};

export const Cube15FtThunderwave: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: { x: 2, y: 2 },
    targetPosition: { x: 6, y: 6 },
    affectedSquares: calculateCube({ x: 6, y: 6 }, 15),
    effectShape: SpellEffectShape.CUBE,
    effectColor: 'rgba(200, 200, 255, 0.45)',
  },
};

export const Cube20ft: Story = {
  args: {
    gridWidth: 14,
    gridHeight: 14,
    casterPosition: { x: 2, y: 2 },
    targetPosition: { x: 8, y: 8 },
    affectedSquares: calculateCube({ x: 8, y: 8 }, 20),
    effectShape: SpellEffectShape.CUBE,
    effectColor: 'rgba(255, 200, 100, 0.4)',
  },
};

export const Cube30ft: Story = {
  args: {
    gridWidth: 18,
    gridHeight: 18,
    casterPosition: { x: 3, y: 3 },
    targetPosition: { x: 10, y: 10 },
    affectedSquares: calculateCube({ x: 10, y: 10 }, 30),
    effectShape: SpellEffectShape.CUBE,
    effectColor: 'rgba(200, 150, 255, 0.35)',
  },
};

// ===== CYLINDER SHAPES =====

export const Cylinder10FtRadius: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: { x: 2, y: 2 },
    targetPosition: { x: 7, y: 7 },
    affectedSquares: calculateCylinderArea({ x: 7, y: 7 }, 10, 0, 12, 12),
    effectShape: SpellEffectShape.CYLINDER,
    effectColor: 'rgba(100, 255, 200, 0.4)',
  },
};

export const Cylinder20FtRadius: Story = {
  args: {
    gridWidth: 16,
    gridHeight: 16,
    casterPosition: { x: 3, y: 3 },
    targetPosition: { x: 10, y: 10 },
    affectedSquares: calculateCylinderArea({ x: 10, y: 10 }, 20, 0, 16, 16),
    effectShape: SpellEffectShape.CYLINDER,
    effectColor: 'rgba(100, 200, 200, 0.4)',
  },
};

// ===== SINGLE TARGET =====

export const MeleeTouchAdjacent: Story = {
  args: {
    gridWidth: 8,
    gridHeight: 8,
    casterPosition: { x: 4, y: 4 },
    targetPosition: { x: 5, y: 4 },
    affectedSquares: calculateMeleeTouchArea({ x: 4, y: 4 }),
    effectShape: SpellEffectShape.MELEE_TOUCH,
    effectColor: 'rgba(255, 215, 0, 0.5)',
  },
};

export const RangedSingleDistant: Story = {
  args: {
    gridWidth: 15,
    gridHeight: 15,
    casterPosition: { x: 2, y: 7 },
    targetPosition: { x: 12, y: 7 },
    affectedSquares: [{ x: 12, y: 7 }],
    effectShape: SpellEffectShape.RANGED_SINGLE,
    effectColor: 'rgba(147, 51, 234, 0.5)',
  },
};

// ===== SELF EFFECTS =====

export const SelfOnly: Story = {
  args: {
    gridWidth: 8,
    gridHeight: 8,
    casterPosition: { x: 4, y: 4 },
    affectedSquares: [{ x: 4, y: 4 }],
    effectShape: SpellEffectShape.SELF_ONLY,
    effectColor: 'rgba(100, 255, 100, 0.5)',
  },
};

export const SelfAura10ft: Story = {
  args: {
    gridWidth: 10,
    gridHeight: 10,
    casterPosition: { x: 5, y: 5 },
    affectedSquares: calculateSelfAuraArea({ x: 5, y: 5 }, 10, 10, 10),
    effectShape: SpellEffectShape.SELF_AURA,
    effectColor: 'rgba(255, 215, 0, 0.35)',
  },
};

export const SelfAura15ft: Story = {
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: { x: 6, y: 6 },
    affectedSquares: calculateSelfAuraArea({ x: 6, y: 6 }, 15, 12, 12),
    effectShape: SpellEffectShape.SELF_AURA,
    effectColor: 'rgba(200, 200, 255, 0.35)',
  },
};

// ===== COMBINED SCENARIOS =====

export const ScenarioFireballHitsAllies: Story = {
  args: {
    gridWidth: 16,
    gridHeight: 16,
    casterPosition: { x: 2, y: 8 },
    targetPosition: { x: 10, y: 8 },
    affectedSquares: calculateSphere({ x: 10, y: 8 }, 20),
    effectShape: SpellEffectShape.SPHERE,
    effectColor: 'rgba(255, 0, 0, 0.3)',
  },
};

export const ScenarioLightningBoltNarrow: Story = {
  args: {
    gridWidth: 25,
    gridHeight: 12,
    casterPosition: { x: 2, y: 6 },
    targetPosition: { x: 22, y: 6 },
    affectedSquares: calculateLine({ x: 2, y: 6 }, { x: 22, y: 6 }, 100),
    effectShape: SpellEffectShape.LINE,
    effectColor: 'rgba(100, 150, 255, 0.6)',
  },
};

export const ScenarioConeOfColdCorner: Story = {
  args: {
    gridWidth: 15,
    gridHeight: 15,
    casterPosition: { x: 2, y: 2 },
    targetPosition: { x: 10, y: 10 },
    affectedSquares: calculateCone({ x: 2, y: 2 }, { x: 10, y: 10 }, 60),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(100, 200, 255, 0.4)',
  },
};

export const ScenarioThunderStrikeCube: Story = {
  args: {
    gridWidth: 14,
    gridHeight: 14,
    casterPosition: { x: 2, y: 7 },
    targetPosition: { x: 9, y: 7 },
    affectedSquares: calculateCube({ x: 9, y: 7 }, 15),
    effectShape: SpellEffectShape.CUBE,
    effectColor: 'rgba(200, 200, 100, 0.4)',
  },
};

// ===== ALL SHAPES COMPARISON =====

export const AllShapesComparison: Story = {
  args: {
    gridWidth: 10,
    gridHeight: 10,
    casterPosition: { x: 5, y: 5 },
    affectedSquares: [],
    effectShape: SpellEffectShape.SPHERE,
  },
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4 bg-midnight-900">
      <div>
        <h3 className="text-white mb-2 font-bold">Cone (15ft)</h3>
        <div className="w-[300px] h-[300px]">
          <SpellEffectOverlay
            gridWidth={10}
            gridHeight={10}
            casterPosition={{ x: 2, y: 5 }}
            targetPosition={{ x: 7, y: 5 }}
            affectedSquares={calculateCone({ x: 2, y: 5 }, { x: 7, y: 5 }, 15)}
            effectShape={SpellEffectShape.CONE}
            effectColor="rgba(255, 100, 0, 0.4)"
          />
        </div>
      </div>
      <div>
        <h3 className="text-white mb-2 font-bold">Sphere (20ft)</h3>
        <div className="w-[300px] h-[300px]">
          <SpellEffectOverlay
            gridWidth={10}
            gridHeight={10}
            casterPosition={{ x: 2, y: 2 }}
            targetPosition={{ x: 6, y: 6 }}
            affectedSquares={calculateSphere({ x: 6, y: 6 }, 20)}
            effectShape={SpellEffectShape.SPHERE}
            effectColor="rgba(255, 69, 0, 0.4)"
          />
        </div>
      </div>
      <div>
        <h3 className="text-white mb-2 font-bold">Line (100ft)</h3>
        <div className="w-[300px] h-[300px]">
          <SpellEffectOverlay
            gridWidth={22}
            gridHeight={10}
            casterPosition={{ x: 2, y: 5 }}
            targetPosition={{ x: 20, y: 5 }}
            affectedSquares={calculateLine({ x: 2, y: 5 }, { x: 20, y: 5 }, 100)}
            effectShape={SpellEffectShape.LINE}
            effectColor="rgba(100, 150, 255, 0.5)"
          />
        </div>
      </div>
      <div>
        <h3 className="text-white mb-2 font-bold">Cube (15ft)</h3>
        <div className="w-[300px] h-[300px]">
          <SpellEffectOverlay
            gridWidth={10}
            gridHeight={10}
            casterPosition={{ x: 2, y: 2 }}
            targetPosition={{ x: 6, y: 6 }}
            affectedSquares={calculateCube({ x: 6, y: 6 }, 15)}
            effectShape={SpellEffectShape.CUBE}
            effectColor="rgba(200, 200, 255, 0.4)"
          />
        </div>
      </div>
      <div>
        <h3 className="text-white mb-2 font-bold">Self Aura (10ft)</h3>
        <div className="w-[300px] h-[300px]">
          <SpellEffectOverlay
            gridWidth={10}
            gridHeight={10}
            casterPosition={{ x: 5, y: 5 }}
            affectedSquares={calculateSphere({ x: 5, y: 5 }, 10)}
            effectShape={SpellEffectShape.SELF_AURA}
            effectColor="rgba(255, 215, 0, 0.35)"
          />
        </div>
      </div>
      <div>
        <h3 className="text-white mb-2 font-bold">Melee Touch</h3>
        <div className="w-[300px] h-[300px]">
          <SpellEffectOverlay
            gridWidth={6}
            gridHeight={6}
            casterPosition={{ x: 3, y: 3 }}
            targetPosition={{ x: 4, y: 3 }}
            affectedSquares={[{ x: 4, y: 3 }]}
            effectShape={SpellEffectShape.MELEE_TOUCH}
            effectColor="rgba(255, 215, 0, 0.5)"
          />
        </div>
      </div>
    </div>
  ),
};

// ===== FAMOUS SPELLS =====

export const SpellFireballClassic: Story = {
  name: 'Fireball (Level 3)',
  args: {
    gridWidth: 18,
    gridHeight: 18,
    casterPosition: { x: 3, y: 9 },
    targetPosition: { x: 12, y: 9 },
    affectedSquares: calculateSphere({ x: 12, y: 9 }, 20),
    effectShape: SpellEffectShape.SPHERE,
    effectColor: 'rgba(255, 69, 0, 0.45)',
  },
};

export const SpellBurningHandsCantrip: Story = {
  name: 'Burning Hands (Level 1)',
  args: {
    gridWidth: 12,
    gridHeight: 12,
    casterPosition: { x: 3, y: 6 },
    targetPosition: { x: 9, y: 6 },
    affectedSquares: calculateCone({ x: 3, y: 6 }, { x: 9, y: 6 }, 15),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(255, 100, 0, 0.5)',
  },
};

export const SpellConeOfCold: Story = {
  name: 'Cone of Cold (Level 5)',
  args: {
    gridWidth: 18,
    gridHeight: 18,
    casterPosition: { x: 3, y: 9 },
    targetPosition: { x: 15, y: 9 },
    affectedSquares: calculateCone({ x: 3, y: 9 }, { x: 15, y: 9 }, 60),
    effectShape: SpellEffectShape.CONE,
    effectColor: 'rgba(100, 200, 255, 0.45)',
  },
};

// ===== INTERACTIVE SPELL SELECTOR =====

/**
 * Interactive story - select ANY spell from all 487 to visualize
 */
export const InteractiveSpellSelector: Story = {
  args: {
    gridWidth: 16,
    gridHeight: 16,
    casterPosition: { x: 5, y: 8 },
    targetPosition: { x: 12, y: 8 },
    affectedSquares: [],
    effectShape: SpellEffectShape.SPHERE,
    effectColor: 'rgba(200, 200, 200, 0.4)',
  },
  render: function SpellSelector() {
    const [selectedSpellId, setSelectedSpellId] = React.useState('fireball');
    const [targetX, setTargetX] = React.useState(12);
    const [targetY, setTargetY] = React.useState(8);

    // Import spells dynamically
    interface SpellJSON {
      id: string;
      name: string;
      level: number;
      school: string;
      effectShape: string;
      effectDimensions: Record<string, number>;
      range: string;
      castingTime: string;
      duration: string;
      description: string;
      higherLevels?: string;
    }

    interface SpellListResponse {
      spells: SpellJSON[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }

    const [spells, setSpells] = React.useState<SpellJSON[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      let isMounted = true;

      const loadSpells = async () => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`${apiBase}/api/spells?limit=500`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const payload = (await response.json()) as SpellListResponse | SpellJSON[];
          const loadedSpells = Array.isArray(payload) ? payload : payload.spells;

          if (!Array.isArray(loadedSpells)) {
            throw new Error('Invalid spell response payload');
          }

          if (isMounted) {
            setSpells(loadedSpells);
            setSelectedSpellId((currentId) => {
              if (loadedSpells.some((spell) => spell.id === currentId)) {
                return currentId;
              }
              return loadedSpells[0]?.id ?? currentId;
            });
          }
        } catch (err) {
          if (isMounted) {
            const message = err instanceof Error ? err.message : 'Failed to load spells';
            setError(message);
            console.error('[Storybook] Failed to load spells:', err);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadSpells();

      return () => {
        isMounted = false;
      };
    }, []);

    const selectedSpell = spells.find((s) => s.id === selectedSpellId);

    if (loading) {
      return <div className="p-4 text-white">Loading spells from API...</div>;
    }

    if (error) {
      return (
        <div className="p-4 text-red-300">
          Failed to load spells from backend.
          <br />
          <span className="text-red-200/80 text-sm">{error}</span>
        </div>
      );
    }

    if (!spells.length || !selectedSpell) {
      return <div className="p-4 text-white">No spells available.</div>;
    }

    // Calculate affected squares based on spell
    const casterPos = { x: 5, y: 8 };
    const target = { x: targetX, y: targetY };
    let affected: GridPosition[] = [];
    let gridSize = 16;

    const dims = selectedSpell.effectDimensions || {};

    switch (selectedSpell.effectShape) {
      case 'cone':
        affected = dims.length ? calculateCone(casterPos, target, dims.length) : [];
        break;
      case 'sphere':
        affected = dims.radius ? calculateSphere(target, dims.radius) : [];
        break;
      case 'line':
        affected = dims.lineLength ? calculateLine(casterPos, target, dims.lineLength) : [];
        gridSize = 25;
        break;
      case 'cube':
        affected = dims.size ? calculateCube(target, dims.size) : [];
        break;
      case 'cylinder':
        affected = dims.radius ? calculateSphere(target, dims.radius) : [];
        break;
      case 'self_aura':
        affected = dims.radius ? calculateSphere(casterPos, dims.radius) : [];
        break;
      case 'self_only':
        affected = [casterPos];
        break;
      case 'melee_touch':
      case 'ranged_single':
        affected = [target];
        break;
      default:
        affected = [target];
    }

    // Get effect color by school
    const schoolColors: Record<string, string> = {
      evocation: 'rgba(255, 100, 50, 0.45)',
      abjuration: 'rgba(100, 150, 255, 0.4)',
      conjuration: 'rgba(150, 100, 255, 0.4)',
      enchantment: 'rgba(255, 100, 200, 0.4)',
      illusion: 'rgba(200, 150, 255, 0.35)',
      necromancy: 'rgba(100, 255, 100, 0.4)',
      transmutation: 'rgba(255, 200, 100, 0.4)',
      divination: 'rgba(200, 200, 255, 0.35)',
    };

    const effectColor = schoolColors[selectedSpell.school] || 'rgba(200, 200, 200, 0.4)';

    return (
      <div className="p-6 bg-midnight-900 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Controls */}
          <div className="bg-midnight-300 p-4 rounded-lg border border-shadow-800 space-y-4">
            <h2 className="text-2xl font-bold text-aurora-300">🔮 Interactive Spell Visualizer</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Spell Selector */}
              <div>
                <label htmlFor="spell-select" className="block text-sm font-medium text-shadow-200 mb-2">
                  Select Spell ({spells.length} total)
                </label>
                <select
                  id="spell-select"
                  value={selectedSpellId}
                  onChange={(e) => setSelectedSpellId(e.target.value)}
                  className="w-full bg-shadow-900 border border-shadow-700 text-shadow-50 px-3 py-2 rounded-lg"
                >
                  {spells
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((spell) => (
                      <option key={spell.id} value={spell.id}>
                        {spell.name} (Lvl {spell.level}) - {spell.effectShape}
                      </option>
                    ))}
                </select>
              </div>

              {/* Target Position */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-shadow-200">Target Position</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={targetX}
                    onChange={(e) => setTargetX(parseInt(e.target.value, 10) || 0)}
                    className="w-20 bg-shadow-900 border border-shadow-700 text-shadow-50 px-2 py-1 rounded"
                    placeholder="X"
                    min="0"
                    max={gridSize - 1}
                    aria-label="Target X coordinate"
                  />
                  <input
                    type="number"
                    value={targetY}
                    onChange={(e) => setTargetY(parseInt(e.target.value, 10) || 0)}
                    className="w-20 bg-shadow-900 border border-shadow-700 text-shadow-50 px-2 py-1 rounded"
                    placeholder="Y"
                    min="0"
                    max={gridSize - 1}
                    aria-label="Target Y coordinate"
                  />
                </div>
              </div>
            </div>

            {/* Spell Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-shadow-900/70 p-2 rounded">
                <div className="text-shadow-400">Level</div>
                <div className="text-aurora-300 font-bold">{selectedSpell.level}</div>
              </div>
              <div className="bg-shadow-900/70 p-2 rounded">
                <div className="text-shadow-400">School</div>
                <div className="text-nebula-300 font-bold capitalize">{selectedSpell.school}</div>
              </div>
              <div className="bg-shadow-900/70 p-2 rounded">
                <div className="text-shadow-400">Shape</div>
                <div className="text-shadow-100 font-bold">{selectedSpell.effectShape}</div>
              </div>
              <div className="bg-shadow-900/70 p-2 rounded">
                <div className="text-shadow-400">Targets</div>
                <div className="text-shadow-100 font-bold">{affected.length} squares</div>
              </div>
            </div>

            <div className="text-xs text-shadow-400">
              <strong>Range:</strong> {selectedSpell.range} | <strong>Casting Time:</strong> {selectedSpell.castingTime}{' '}
              | <strong>Duration:</strong> {selectedSpell.duration}
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-midnight-300 p-4 rounded-lg border border-shadow-800">
            <div className="w-full h-[600px]">
              <SpellEffectOverlay
                gridWidth={gridSize}
                gridHeight={gridSize}
                casterPosition={casterPos}
                targetPosition={target}
                affectedSquares={affected}
                effectShape={selectedSpell.effectShape as SpellEffectShape}
                effectColor={effectColor}
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-midnight-300 p-4 rounded-lg border border-shadow-800">
            <h3 className="text-lg font-bold text-aurora-300 mb-2">{selectedSpell.name}</h3>
            <p className="text-shadow-200 text-sm leading-relaxed">{selectedSpell.description}</p>
            {selectedSpell.higherLevels && (
              <p className="text-shadow-300 text-sm mt-2 italic">
                <strong>At Higher Levels:</strong> {selectedSpell.higherLevels}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  },
};
