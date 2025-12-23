/**
 * CreateRoom Wizard Constants
 * DM style marks, fallback labels, and wizard configuration
 */

import type { LucideIcon } from 'lucide-react';
import { Mountain, Waves, Sun, Snowflake, Flame, Trees, Cloud, Gem, Sparkles } from 'lucide-react';
import type { AdventureLength, Difficulty, DMPerformanceMode, WorldSize } from '../../types/shared';
import type { ArchetypeSigil } from '../../constants/worldArchetypes';

export const ARCHETYPE_SIGILS: Record<ArchetypeSigil, LucideIcon> = {
  mountain: Mountain,
  tide: Waves,
  dune: Sun,
  frost: Snowflake,
  ember: Flame,
  grove: Trees,
  sky: Cloud,
  abyss: Gem,
  custom: Sparkles,
};

/**
 * Create Room Wizard - Simplified 2-Step Flow
 *
 * Step 1: DM & Scope - DM settings + characters + level/points
 * Step 2: Terrain Builder - All worldgen controls + live exploration
 */

// Wizard flow (2 steps only)
export type WizardGroup = 'dmAndScope';
export const WIZARD_GROUPS: WizardGroup[] = ['dmAndScope'];

// Verbosity scale (0-6)
export const VERBOSITY_MARK_KEYS = [
  { value: 0, key: 'whisper' },
  { value: 1, key: 'terse' },
  { value: 2, key: 'measured' },
  { value: 3, key: 'storied' },
  { value: 4, key: 'lyrical' },
  { value: 5, key: 'epic' },
  { value: 6, key: 'operatic' },
] as const;

export const VERBOSITY_FALLBACK: Record<
  (typeof VERBOSITY_MARK_KEYS)[number]['key'],
  { label: string; description: string }
> = {
  whisper: { label: 'Whisper', description: 'Compact phrases; battle reports without flourish.' },
  terse: { label: 'Terse', description: 'Brief narration with essential sensory beats only.' },
  measured: { label: 'Measured', description: 'Balanced cadence, short paragraphs anchoring scenes.' },
  storied: { label: 'Storied', description: 'Narrative flow with hooks and periodic embellishment.' },
  lyrical: { label: 'Lyrical', description: 'Rich language with artful metaphors and cadence.' },
  epic: { label: 'Epic', description: 'Layered description, foreshadowing, and heroic gravitas.' },
  operatic: { label: 'Operatic', description: 'Grandiloquent delivery worthy of bardic sagas.' },
};

// Detail scale
export const DETAIL_MARK_KEYS = [
  { value: 0, key: 'minimal' },
  { value: 1, key: 'lean' },
  { value: 2, key: 'focused' },
  { value: 3, key: 'balanced' },
  { value: 4, key: 'textured' },
  { value: 5, key: 'immersive' },
  { value: 6, key: 'cinematic' },
] as const;

export const DETAIL_FALLBACK: Record<(typeof DETAIL_MARK_KEYS)[number]['key'], { label: string; description: string }> =
  {
    minimal: { label: 'Minimal', description: 'Rule-first clarity; bare essential context.' },
    lean: { label: 'Lean', description: 'Highlights key props and obstacles, nothing more.' },
    focused: { label: 'Focused', description: 'Mix of mechanical stakes and vivid landmarks.' },
    balanced: { label: 'Balanced', description: 'Equal parts mechanics, atmosphere, and sensory tone.' },
    textured: { label: 'Textured', description: 'Layered description of sights, sounds, and culture.' },
    immersive: { label: 'Immersive', description: 'Every scene painted with historical and emotional nuance.' },
    cinematic: { label: 'Cinematic', description: 'Panoramic detail, symbolism, and lingering imagery.' },
  };

// Engagement scale
export const ENGAGEMENT_MARK_KEYS = [
  { value: 0, key: 'observer' },
  { value: 1, key: 'facilitator' },
  { value: 2, key: 'guide' },
  { value: 3, key: 'collaborator' },
  { value: 4, key: 'showrunner' },
  { value: 5, key: 'auteur' },
  { value: 6, key: 'oracle' },
] as const;

export const ENGAGEMENT_FALLBACK: Record<
  (typeof ENGAGEMENT_MARK_KEYS)[number]['key'],
  { label: string; description: string }
> = {
  observer: { label: 'Observer', description: 'Neutral referee enforcing rules and outcomes.' },
  facilitator: { label: 'Facilitator', description: 'Gentle scaffolding; player agency paramount.' },
  guide: { label: 'Guide', description: 'Soft guidance with hints and gentle redirects.' },
  collaborator: { label: 'Collaborator', description: 'Active co-storyteller balancing agency with structure.' },
  showrunner: { label: 'Showrunner', description: 'Curator of pacing and dramatic arcs.' },
  auteur: { label: 'Auteur', description: 'Director with strong vision shaping the narrative.' },
  oracle: { label: 'Oracle', description: 'Omniscient arbiter crafting fate and meaning.' },
};

// Narrative scale
export const NARRATIVE_MARK_KEYS = [
  { value: 0, key: 'sandbox' },
  { value: 1, key: 'reactive' },
  { value: 2, key: 'responsive' },
  { value: 3, key: 'structured' },
  { value: 4, key: 'plotted' },
  { value: 5, key: 'storied' },
  { value: 6, key: 'authored' },
] as const;

export const NARRATIVE_FALLBACK: Record<
  (typeof NARRATIVE_MARK_KEYS)[number]['key'],
  { label: string; description: string }
> = {
  sandbox: { label: 'Sandbox', description: 'Entirely player-driven; DM just reacts.' },
  reactive: { label: 'Reactive', description: 'DM responds to player choices without shaping.' },
  responsive: { label: 'Responsive', description: 'DM weaves in consequences and connections.' },
  structured: { label: 'Structured', description: 'Loose framework with clear narrative beats.' },
  plotted: { label: 'Plotted', description: 'Clear story arc with prepared dramatic moments.' },
  storied: { label: 'Storied', description: 'Rich narrative with intertwined character arcs.' },
  authored: { label: 'Authored', description: 'Cohesive literary narrative with intentional themes.' },
};

// Special modes (must match backend schema: pirate|shakespearean|noir|courtly|grimdark|storybook)
export const SPECIAL_MODE_KEYS: Array<{ id: DMPerformanceMode | null; key: string }> = [
  { id: null, key: 'off' },
  { id: 'courtly', key: 'courtly' },
  { id: 'grimdark', key: 'grimdark' },
  { id: 'noir', key: 'noir' },
  { id: 'pirate', key: 'pirate' },
  { id: 'shakespearean', key: 'shakespearean' },
  { id: 'storybook', key: 'storybook' },
];

export const SPECIAL_MODE_FALLBACK: Record<
  (typeof SPECIAL_MODE_KEYS)[number]['key'],
  { label: string; description: string }
> = {
  off: { label: 'Off', description: 'Standard narration without thematic overlay.' },
  courtly: { label: 'Courtly', description: 'Formal, elegant language with regal bearing.' },
  grimdark: { label: 'Grimdark', description: 'Dark, gritty, morally complex narratives.' },
  noir: { label: 'Noir', description: 'Hard-boiled detective style with cynical tone.' },
  pirate: { label: 'Pirate', description: 'Ahoy! Swashbuckling adventure on the high seas.' },
  shakespearean: { label: 'Shakespearean', description: 'Thee and thou, in verse most fair and true.' },
  storybook: { label: 'Storybook', description: 'Once upon a time, in a whimsical fairy tale.' },
};

// Adventure length
export const ADVENTURE_LENGTH_VALUES: AdventureLength[] = ['flash', 'short', 'medium', 'long', 'epic', 'legendary'];

export const ADVENTURE_LENGTH_FALLBACK: Record<
  AdventureLength,
  { label: string; detail: string; description: string }
> = {
  flash: { label: 'Flash', detail: 'One-shot', description: 'Single session adventure (2-4 hours).' },
  short: { label: 'Short', detail: 'Mini-arc', description: 'Few sessions with focused goal (6-12 hours).' },
  medium: { label: 'Medium', detail: 'Campaign', description: 'Classic campaign arc (20-40 hours).' },
  long: { label: 'Long', detail: 'Saga', description: 'Extended campaign with multiple arcs (60-100 hours).' },
  epic: { label: 'Epic', detail: 'Odyssey', description: 'Long-form epic with complex plotting (150+ hours).' },
  legendary: { label: 'Legendary', detail: 'Infinity', description: 'Open-ended campaign that evolves indefinitely.' },
};

// Difficulty
export const DIFFICULTY_VALUES: Difficulty[] = ['storyteller', 'easy', 'medium', 'challenging', 'gritty', 'deadly'];

export const DIFFICULTY_FALLBACK: Record<Difficulty, { label: string; detail: string; description: string }> = {
  storyteller: { label: 'Storyteller', detail: 'Collaborative', description: 'Focus on narrative over mechanics.' },
  easy: { label: 'Easy', detail: 'Forgiving', description: 'Rare player defeats, heroic triumphs.' },
  medium: { label: 'Medium', detail: 'Balanced', description: 'Standard D&D challenge rating.' },
  challenging: {
    label: 'Challenging',
    detail: 'Tactical',
    description: 'Requires smart play and resource management.',
  },
  gritty: { label: 'Gritty', detail: 'Harsh', description: 'Survival-focused, frequent setbacks.' },
  deadly: { label: 'Deadly', detail: 'Brutal', description: 'Permadeath, unforgiving consequences.' },
};

// World size
export const WORLD_SIZE_VALUES: WorldSize[] = ['intimate', 'small', 'medium', 'large', 'vast', 'epic'];

export const WORLD_SIZE_FALLBACK: Record<WorldSize, { label: string; detail: string; description: string }> = {
  intimate: { label: 'Intimate', detail: 'Village', description: 'Single location with deep character focus.' },
  small: { label: 'Small', detail: 'Region', description: 'Compact area with interconnected locations.' },
  medium: { label: 'Medium', detail: 'Kingdom', description: 'Classic campaign scope with varied regions.' },
  large: { label: 'Large', detail: 'Continent', description: 'Multiple kingdoms and diverse climates.' },
  vast: { label: 'Vast', detail: 'World', description: 'Globe-trotting saga with planar whispers.' },
  epic: { label: 'Mythic', detail: 'Planes', description: 'Interplanar odyssey with cosmic stakes.' },
};
