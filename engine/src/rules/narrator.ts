import { DMStyle } from '../types';

export const DM_VERBOSITY_LEVELS = [
  'Whisper (Minimal)',
  'Terse',
  'Measured',
  'Storied',
  'Lyrical',
  'Epic',
  'Operatic (Grand)',
];

export const DM_DETAIL_LEVELS = ['Minimal', 'Lean', 'Focused', 'Balanced', 'Textured', 'Immersive', 'Cinematic'];

export const DM_ENGAGEMENT_LEVELS = [
  'Observer',
  'Facilitator',
  'Guide',
  'Collaborator',
  'Showrunner',
  'Auteur',
  'Oracle',
];

export const DM_NARRATIVE_LEVELS = [
  'Sandbox',
  'Reactive',
  'Responsive',
  'Structured',
  'Plotted',
  'Storied',
  'Authored',
];

/**
 * Formats a DM Style object into a readable string for LLM prompting.
 */
export function formatDmInstruction(style?: DMStyle | null): string {
  if (!style) return 'Standard DM Style';

  const parts = [
    `- Verbosity: ${DM_VERBOSITY_LEVELS[style.verbosity] || 'Normal'}`,
    `- Detail: ${DM_DETAIL_LEVELS[style.detail] || 'Normal'}`,
    `- Engagement: ${DM_ENGAGEMENT_LEVELS[style.engagement] || 'Normal'}`,
    `- Narrative Control: ${DM_NARRATIVE_LEVELS[style.narrative] || 'Normal'}`,
    style.specialMode ? `- Performance Mode: ${style.specialMode}` : null,
    style.customDirectives ? `- Custom Directives: "${style.customDirectives}"` : null,
  ];

  return parts.filter(Boolean).join('\n');
}
