/**
 * Feature Icon Component
 * Renders icons for grid features (trees, creatures, resources)
 */

import type { GridFeature } from '@daicer/shared';

interface FeatureIconProps {
  feature: GridFeature;
  tileSize: number;
}

/**
 * Feature Icon Component
 * Renders appropriate icon/emoji for feature type
 */
export function FeatureIcon({ feature, tileSize }: FeatureIconProps) {
  const icon = getFeatureIcon(feature.type, feature.subtype);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${feature.position.x * tileSize}px`,
        top: `${feature.position.y * tileSize}px`,
        width: `${tileSize}px`,
        height: `${tileSize}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${tileSize * 0.7}px`,
      }}
      data-testid={`feature-icon-${feature.id}`}
    >
      {icon}
    </div>
  );
}

/**
 * Get icon/emoji for feature type
 */
function getFeatureIcon(type: string, subtype: string): string {
  // Type-based icons
  const typeIcons: Record<string, string> = {
    tree: '🌲',
    creature: '👹',
    resource: '💎',
    npc: '🧙',
    item: '📦',
    hazard: '⚠️',
    decoration: '🗿',
    structure_marker: '🏰',
  };

  // Subtype overrides
  const subtypeIcons: Record<string, string> = {
    oak_tree: '🌳',
    birch_tree: '🌲',
    pine_tree: '🌲',
    palm_tree: '🌴',
    goblin: '👺',
    deer: '🦌',
    mountain_goat: '🐐',
    wolf: '🐺',
    iron_ore: '⛏️',
    gold_ore: '💰',
    stone_outcrop: '🪨',
    ancient_statue: '🗿',
  };

  return subtypeIcons[subtype] || typeIcons[type] || '❓';
}

/**
 * Canvas-based feature icon renderer
 * For rendering directly on canvas context
 */
export function drawFeatureIcon(ctx: CanvasRenderingContext2D, feature: GridFeature, tileSize: number): void {
  const icon = getFeatureIcon(feature.type, feature.subtype);
  const x = feature.position.x * tileSize;
  const y = feature.position.y * tileSize;

  ctx.font = `${tileSize * 0.7}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x + tileSize / 2, y + tileSize / 2);
}
