import { generateStructured } from '../../../utils/llm/structured';
import { getPrompt, formatPrompt } from '../../../utils/prompt';
import type { WorldSettings, Language } from '@daicer/engine';

// Helper to format DM style into a readable summary for the LLM
// Duplicated here to avoid circular dep, or could be moved to shared utils
interface DmStyle {
  verbosity: number;
  detail: number;
  engagement: number;
  narrative: number;
  specialMode?: string;
  customDirectives?: string;
}

function formatDmStyle(style: DmStyle) {
  if (!style) return 'Standard DM Style';

  const verbosityMap = ['Whisper (Minimal)', 'Terse', 'Measured', 'Storied', 'Lyrical', 'Epic', 'Operatic (Grand)'];
  const detailMap = ['Minimal', 'Lean', 'Focused', 'Balanced', 'Textured', 'Immersive', 'Cinematic'];
  const engagementMap = ['Observer', 'Facilitator', 'Guide', 'Collaborator', 'Showrunner', 'Auteur', 'Oracle'];
  const narrativeMap = ['Sandbox', 'Reactive', 'Responsive', 'Structured', 'Plotted', 'Storied', 'Authored'];

  const summary = [
    `- Verbosity: ${verbosityMap[style.verbosity] || 'Normal'}`,
    `- Detail: ${detailMap[style.detail] || 'Normal'}`,
    `- Engagement: ${engagementMap[style.engagement] || 'Normal'}`,
    `- Narrative Control: ${narrativeMap[style.narrative] || 'Normal'}`,
    style.specialMode ? `- Performance Mode: ${style.specialMode}` : null,
    style.customDirectives ? `- Custom Directives: "${style.customDirectives}"` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return summary;
}

export default ({ strapi }) => ({
  async generateWorld(settings: WorldSettings, language: Language = 'en'): Promise<string> {
    const { WorldDescriptionSchema } = await import('../../../schemas/agent-responses');

    const systemPromptDefault = `You are a world-class Dungeon Master creating immersive RPG campaign backgrounds.
Create rich, detailed world descriptions with structured metadata.`;

    const userPromptDefault = `Generate a campaign world description based on these parameters:

**Campaign Scope:**
- **Players:** ${settings.playerCount}
- **Adventure Length:** ${settings.adventureLength}
- **Difficulty:** ${settings.difficulty}
- **Starting Level:** ${settings.startingLevel || 1}

**World Settings:**
- **Archetype:** ${settings.worldType || 'Generic'}
- **Size:** ${settings.worldSize || 'Medium'}
- **Theme:** ${settings.theme}
- **Setting:** ${settings.setting}
- **Tone:** ${settings.tone}

**Requirements:**
- Create a catchy campaign title
- Write a rich 2-3 paragraph description using markdown formatting
- Capture the atmosphere in one sentence
- Identify 2-4 key locations with brief descriptions
- List primary threats or antagonistic forces
- **Call to Adventure**: Explicitly state why the party is together and what their immediate goal is.
- **Risks & Stakes**: Clearly define what happens if they fail.
- Provide 2-3 adventure hooks to draw players in`;

    const systemPrompt = await getPrompt('world_generation_system', language, systemPromptDefault);

    let userPrompt = await getPrompt('world_generation_user', language, userPromptDefault);

    // Format the User Prompt with Settings
    if (userPrompt.includes('{{theme}}')) {
      userPrompt = formatPrompt(userPrompt, {
        playerCount: String(settings.playerCount),
        adventureLength: String(settings.adventureLength),
        difficulty: String(settings.difficulty),
        startingLevel: String(settings.startingLevel || 1),
        worldType: String(settings.worldType || 'Generic'),
        worldSize: String(settings.worldSize || 'Medium'),
        theme: settings.theme,
        setting: settings.setting,
        tone: settings.tone,
        dmStyleSummary: formatDmStyle(settings.dmStyle),
      });
    }

    strapi.log.info('Generating world description');

    const worldData = await generateStructured(WorldDescriptionSchema, systemPrompt, userPromptDefault, language, {
      tags: ['world-generation', `theme:${settings.theme}`],
      metadata: { settings },
    });

    strapi.log.info('World description generated successfully');

    // Format as markdown
    const formattedDescription = `# ${worldData.title}

${worldData.description}

*${worldData.atmosphere}*

## Key Locations

${worldData.keyLocations.map((loc: { name: string; description: string }) => `**${loc.name}**: ${loc.description}`).join('\n\n')}

## Threats

${worldData.threats.map((threat: string) => `- ${threat}`).join('\n')}

## Call to Adventure & Stakes

**Why you are here:** ${worldData.hooks[0] || 'Fate has brought you together.'}

**The Risks:** The world is in peril, and failure could mean doom.

## Adventure Hooks

${worldData.hooks.map((hook: string, i: number) => `${i + 1}. ${hook}`).join('\n')}`;

    return formattedDescription;
  },
});
