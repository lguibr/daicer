import type { ScaleLevel } from '@daicer/engine';

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

export const ENGAGEMENT_MARK_KEYS = [
  { value: 0, key: 'observer' },
  { value: 1, key: 'facilitator' },
  { value: 2, key: 'guide' },
  { value: 3, key: 'collaborator' },
  { value: 4, key: 'instigator' },
  { value: 5, key: 'provocateur' },
  { value: 6, key: 'immersive' },
] as const;

export const ENGAGEMENT_FALLBACK: Record<
  (typeof ENGAGEMENT_MARK_KEYS)[number]['key'],
  { label: string; description: string }
> = {
  observer: { label: 'Observer', description: 'Relays outcomes; minimal questions to players.' },
  facilitator: { label: 'Facilitator', description: 'Invites input at decision beats only.' },
  guide: { label: 'Guide', description: 'Regular prompts for intentions and reflections.' },
  collaborator: { label: 'Collaborator', description: 'Co-creates moments, encourages party banter.' },
  instigator: { label: 'Instigator', description: 'Seeds dilemmas, cliff-hangers, and rivalries.' },
  provocateur: { label: 'Provocateur', description: 'Pushes dramatic tension, spotlight rotation, character arcs.' },
  immersive: { label: 'Immersive', description: 'LARP-like involvement, in-character dialogue, dramatic pacing.' },
};

export const NARRATIVE_MARK_KEYS = [
  { value: 0, key: 'player' },
  { value: 1, key: 'explorer' },
  { value: 2, key: 'hybrid' },
  { value: 3, key: 'balanced' },
  { value: 4, key: 'guided' },
  { value: 5, key: 'plotted' },
  { value: 6, key: 'authored' },
] as const;

export const NARRATIVE_FALLBACK: Record<
  (typeof NARRATIVE_MARK_KEYS)[number]['key'],
  { label: string; description: string }
> = {
  player: { label: 'Player', description: 'Sandbox freedom; react to initiatives more than drive them.' },
  explorer: { label: 'Explorer', description: 'Loose threads seeded, players weave them together.' },
  hybrid: { label: 'Hybrid', description: 'Blend of branching choices with gentle nudges.' },
  balanced: { label: 'Balanced', description: 'Story arcs with equal agency and plotted beats.' },
  guided: { label: 'Guided', description: 'Clear arcs, recurring NPC agendas, purposeful scenes.' },
  plotted: { label: 'Plotted', description: 'Strong episodic structure with planned twists.' },
  authored: { label: 'Authored', description: 'Epic saga with foreshadowed climaxes and dramatic framing.' },
};

export const SPECIAL_MODE_KEYS: Array<{ id: import('@daicer/engine').DMPerformanceMode | null; key: string }> = [
  { id: null, key: 'classic' },
  { id: 'courtly', key: 'courtly' },
  { id: 'grimdark', key: 'grimdark' },
  { id: 'pirate', key: 'pirate' },
  { id: 'shakespearean', key: 'shakespearean' },
  { id: 'noir', key: 'noir' },
  { id: 'storybook', key: 'storybook' },
];

export const SPECIAL_MODE_FALLBACK: Record<
  (typeof SPECIAL_MODE_KEYS)[number]['key'],
  { label: string; description: string }
> = {
  classic: { label: 'Classic', description: 'Neutral narrator with modern tabletop etiquette.' },
  courtly: { label: 'Courtly', description: 'Highborn formality, heraldic compliments, etiquette cues.' },
  grimdark: { label: 'Grimdark', description: 'Harsh imagery, moral ambiguity, fatalistic tone.' },
  pirate: { label: 'Corsair', description: 'Swashbuckling slang, sea shanty flavor, audacious bravado.' },
  shakespearean: { label: 'Shakespearean', description: 'Elizabethan cadence, poetic turns, dramatic beats.' },
  noir: { label: 'Noir', description: 'Hardboiled monologue, moody metaphors, smoky intrigue.' },
  storybook: { label: 'Storybook', description: 'Fairytale cadence, moral lessons, whimsical wonder.' },
};

export function getMarkSummary(marks: Array<{ value: number; label: string }>, level: ScaleLevel): string {
  const mark = marks.find((m) => m.value === level);
  return mark ? mark.label : String(level);
}
