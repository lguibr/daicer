/**
 * Prompt Builder for Voxel Model Generation
 *
 * Builds optimized prompts for Gemini AI to generate 3D voxel models
 */

import { z } from 'zod';
import { AssetType, ModelData } from './types';

type StyleTone = 'fantasy' | 'sci-fi' | 'modern' | 'ancient' | 'industrial';
type DetailLevel = 'minimal' | 'standard' | 'ornate';
type Palette = readonly [string, string, string];

export interface ModelPromptInput {
  readonly assetType: AssetType;
  readonly description: string;
  readonly name?: string;
  readonly tone?: StyleTone;
  readonly detailLevel?: DetailLevel;
  readonly palette?: Palette;
  readonly references?: readonly string[];
}

export interface ModelPromptPayload {
  readonly systemInstruction: string;
  readonly userPrompt: string;
}

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/u, 'Color must be a 6-digit hexadecimal string.');

const shapeEnum = z.enum(['box', 'sphere', 'cylinder', 'cone', 'capsule']);

export const modelPartSchema = z
  .object({
    shape: shapeEnum,
    position: vector3Schema,
    scale: vector3Schema,
    rotation: vector3Schema,
    color: hexColorSchema,
  })
  .strict();

export const modelDataSchema = z
  .object({
    name: z.string().min(1).max(80),
    parts: z.array(modelPartSchema).min(1).max(64),
    rotation: vector3Schema.nullable().optional(),
  })
  .strict();

const baseGuidelines: readonly string[] = [
  'Position coordinates: X (horizontal left-right), Y (vertical up-down), Z (depth front-back).',
  'Ground level is Y=0. All objects sit on or above this plane.',
  'Build 4-12 primitive parts total. Aim for clarity over complexity.',
  'Snap all positions to 0.25 increments for voxel grid alignment.',
  'Scale units: minimum 0.3 to avoid paper-thin geometry, maximum 8 for dominant shapes.',
  'Rotation values are in radians: 0 = unrotated, 1.57 ≈ 90°, 3.14 ≈ 180°.',
  'Use contrasting colors to define structure: darker for bases, brighter for accents.',
  'Test mental silhouette from above (top-down view) and 45° isometric angle.',
  'Layer parts from bottom to top: foundation → body → details → decorations.',
];

const assetGuidelines: Record<AssetType, readonly string[]> = {
  Creature: [
    'Build vertically: legs/base at Y=0, torso elevated, head on top.',
    'Symmetric limbs: mirror X positions (e.g., legs at X=-1 and X=+1).',
    'Head position: center X/Z, elevated Y above torso by torso height + 0.5.',
    'Use spheres for joints, boxes/cylinders for limbs and body segments.',
    'Accent colors for features: eyes at head position with small scale (0.3-0.5).',
  ],
  Tree: [
    'Trunk: cylinder centered at (0, Y/2, 0) with base at ground level.',
    'Canopy: sphere or cone positioned above trunk at Y = trunk_height + canopy_radius.',
    'Multi-layer foliage: stack 2-3 spheres at different Y heights, decreasing scale upward.',
    'Root base: wide, flat cone at Y=0.25 for ground anchoring.',
    'Color gradient: dark brown trunk (#3D2817), medium green mid-canopy (#4A7C3B), bright green top (#6FA842).',
  ],
  Terrain: [
    'Stepped elevation: base layer at Y=0, subsequent layers at Y=0.5, 1.0, 1.5.',
    'Use flat boxes for tiles, scale X/Z for coverage area.',
    'Embed features: caves (dark recessed boxes), water (blue flat boxes at Y=0).',
    'Edge variation: rotate edge pieces slightly (0.1-0.2 rad) for organic feel.',
  ],
  Humanoid: [
    'Legs: two boxes at Y=0.75, centered at X=-0.4 and X=+0.4, scale [0.6, 1.5, 0.6].',
    'Torso: box at Y=2.25, centered X=0/Z=0, scale [1.2, 1.5, 0.8].',
    'Head: sphere at Y=3.5, centered, scale [0.8, 0.8, 0.8].',
    'Arms: cylinders at Y=2.5, X=-1.0 and X=+1.0, rotated on Z-axis (±1.57 rad).',
    'Accessories: thin boxes (scale 0.2 on one axis) layered over body parts.',
  ],
  POI: [
    'Foundation: large flat box at Y=0.25 to anchor structure.',
    'Vertical growth: main structure centered, extends upward in Y.',
    'Doors/windows: contrasting colored boxes inset into walls (slight negative Z offset).',
    'Roof: pyramid (cone) or flat (box) at top, overhanging main body slightly (larger X/Z scale).',
    'Signage: small thin boxes (scale [1.5, 0.6, 0.1]) positioned above door at eye level.',
  ],
  Object: [
    'Primary axis: longest dimension along +Z direction for forward orientation.',
    'Handle/grip: positioned at negative Z or negative Y for accessibility.',
    'Functional parts: contrasting colors (e.g., metal #8C8C8C, wood #8B4513).',
    'Weight distribution: heavier/larger parts at base or center for stability.',
    'Details: small cylinders/spheres for rivets, buttons, or ornamental features.',
  ],
};

const detailDirectives: Record<DetailLevel, string> = {
  minimal: 'Limit to 3-5 primitive parts; focus on bold silhouettes over detail.',
  standard: 'Balance 5-9 primitive parts with clear color separation.',
  ornate: 'Use up to 12 parts; add layered ornamentation and trim details.',
};

const toneDescriptors: Record<StyleTone, string> = {
  fantasy: 'Infuse mythical motifs, runes, or natural magic cues.',
  'sci-fi': 'Incorporate panels, emissive strips, and modular engineering.',
  modern: 'Favor clean lines, functional materials, and grounded color palettes.',
  ancient: 'Add weathering, erosion cues, and primitive construction hints.',
  industrial: 'Expose machinery, riveted plates, and utility markings.',
};

function formatGuidelines(list: readonly string[]): string {
  return list.map((item) => `- ${item}`).join('\n');
}

function composePalette(palette?: Palette): string {
  if (!palette) {
    return 'Palette: default voxel-friendly saturated colors.';
  }

  const [primary, secondary, accent] = palette;
  return `Palette: primary ${primary}, secondary ${secondary}, accent ${accent}.`;
}

export function buildModelPrompt(input: ModelPromptInput): ModelPromptPayload {
  const { assetType, description, name, tone = 'fantasy', detailLevel = 'standard', palette, references = [] } = input;

  const systemInstruction = `You are VECTRA, an expert voxel architect with deep geometric intuition and spatial reasoning. You construct precise JSON blueprints for low-poly 3D voxel assets.

Core Principles:
- Master 3D coordinate systems: X (left-right), Y (up-down), Z (forward-back)
- Y-axis is vertical: ground plane is at y=0, objects grow upward with positive Y
- Center objects at origin (0, 0, 0) unless asymmetry is required
- Think in layers: build from ground up, stacking primitives logically
- Use geometric hierarchy: larger base shapes first, details layered on top
- Balance mass distribution: heavier elements at bottom, lighter details above
- Respect physical plausibility: objects should feel grounded and stable

Spatial Strategy:
- Position parts in world space with clear spatial relationships
- Use scale strategically: width (X), height (Y), depth (Z) for volumetric presence
- Rotation in radians: small values (0.1-0.3) for subtle tilts, π/4 for 45°, π/2 for 90°
- Overlap shapes intentionally to create composite forms
- Offset decorative elements slightly (0.25-0.5 units) from core structure

Output strict JSON only. No commentary, no markdown, no explanations.`;

  const assetSpecificGuidelines = assetGuidelines[assetType] ?? [];
  const combinedGuidelines = [
    `Detail style: ${detailDirectives[detailLevel]}`,
    `Tone: ${toneDescriptors[tone]}`,
    ...baseGuidelines,
    ...assetSpecificGuidelines,
  ];

  const sections = [
    `Asset Type: ${assetType}`,
    name ? `Asset Name: ${name}` : null,
    composePalette(palette),
    references.length > 0 ? `Reference Keywords: ${references.join(', ')}` : null,
    '',
    'CREATIVE BRIEF',
    description.trim(),
    '',
    'CONSTRUCTION RULES',
    formatGuidelines(combinedGuidelines),
    '',
    'TECHNICAL REQUIREMENTS',
    '- Output only valid JSON. No markdown fences, no comments, no explanations.',
    '- All numeric values rounded to 2 decimal places maximum.',
    '- Positions are absolute world coordinates. Origin (0,0,0) is ground center.',
    '- Ensure every part has physical presence: scale values ≥ 0.3 on all axes.',
    '- Color hex strings must be exactly 6 characters: #RRGGBB format.',
  ].filter((section): section is string => Boolean(section && section.trim().length > 0));

  return {
    systemInstruction,
    userPrompt: sections.join('\n\n'),
  };
}

export function validateModelData(payload: unknown): ModelData {
  const result = modelDataSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Model validation failed: ${result.error.message}`);
  }
  return result.data as ModelData;
}
