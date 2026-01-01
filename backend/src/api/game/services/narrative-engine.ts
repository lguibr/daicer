import { generateStructured } from '../../../utils/llm/structured';
import { getPrompt, formatPrompt } from '../../../utils/prompt';
import { formatDmInstruction } from '@daicer/engine';
// import { getStrapiClient } from '../../../utils/strapi-client'; // Assuming utility location or use strapi global
// import { EngineEntity } from './entity-adapter'; // Removed
import type { Player, WorldSettings, Language, Entity } from '@daicer/engine';
// Local definition
interface Message {
  sender: string;
  text: string;
}

export default ({ strapi }) => ({
  async generateNarrativeResponse(
    roomId: string,
    worldDescription: string,
    messages: Message[],
    players: Player[], // Keep for Perspective mapping
    entities: Entity[], // Unified Entities (Players + Monsters)
    language: Language = 'en',
    settings?: WorldSettings,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    worldConditions?: any[],

    streamId?: string,
    mapImage?: Buffer
  ) {
    const { TurnResponseSchema } = await import('../../../schemas/agent-responses');

    const languageMap: Record<Language, string> = {
      en: 'English',
      es: 'Spanish',
      'pt-BR': 'Brazilian Portuguese',
    };
    const languageName = languageMap[language] || 'English';

    const playerSummaries = entities
      .filter((e) => e.type === 'player')
      .map((e) => {
        // Find basic class/race info if available (Adapter should standardize or we check raw?)
        // The EngineEntity has stats/hp.
        // We might want to pass more descriptive strings in EngineEntity if needed.
        return `- ${e.name} | HP: ${e.hp}/${e.maxHp} | AC: ${e.ac}`;
      })
      .join('\n');

    const creatureSummaries = entities
      .filter((e) => e.type !== 'player')
      .map(
        (c) =>
          `- ${c.name} | HP: ${c.hp}/${c.maxHp} | AC: ${c.ac} | Actions: ${c.actions.map((a) => a.name).join(', ')}`
      )
      .join('\n');

    const worldConditionsText = ''; // stub

    // Style Instructions
    let dynamicStyleInstructions = 'Standard DM Style';
    if (settings?.dmStyle) {
      const instruction = formatDmInstruction(settings.dmStyle);
      dynamicStyleInstructions = `DYNAMIC STYLE ADJUSTMENTS:\n${instruction}`;
    }

    const systemPromptDefault = `You are the Dungeon Master (DM) for a D&D 5e adventure.
Your goal is to run a thrilling, immersive, and fair game.

{{dmStyle}}

WORLD CONTEXT:
{{worldContext}}

CURRENT PARTY:
{{partyContext}}

ACTIVE CREATURES/NPCs:
{{creaturesContext}}

CRITICAL: TEAMWORK & PARTY COHESION:
- This is a TEAM adventure - the party works TOGETHER
- Create situations that require cooperation and reward working as a group

FORMATTING RULES - EXTREMELY IMPORTANT:
You MUST use rich markdown formatting in your narrative.
${mapImage ? '\nMAP AWARENESS:\nA visual map of the current area is attached. Use it to describe the environment accurately (terrain, rivers, walls).' : ''}`;

    const basePrompt = await getPrompt('dm_system_instruction', language, systemPromptDefault);

    // Format the System Prompt
    const worldLore = [settings?.worldBackground?.trim(), worldDescription, worldConditionsText]
      .filter(Boolean)
      .join('\n\n');

    let systemPrompt = basePrompt;
    if (systemPrompt.includes('{{dmStyle}}')) {
      systemPrompt = formatPrompt(systemPrompt, {
        dmStyle: dynamicStyleInstructions,
        worldContext: worldLore,
        partyContext: playerSummaries,
        creaturesContext: creatureSummaries || 'None currently active.',
      });
    } else {
      systemPrompt = `${systemPrompt}\n\n${dynamicStyleInstructions}\n\nWORLD CONTEXT:\n${worldLore}\n\nCURRENT PARTY:\n${playerSummaries}\n\nACTIVE CREATURES:\n${creatureSummaries || 'None'}`;
    }

    // Build conversation
    const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n\n');
    const currentActions = players
      .filter((p) => p.action && p.character)
      .map((p) => `${p.character!.name}: ${p.action}`)
      .join('\n');

    // RAG Stub
    const relevantRules = '';
    // try { relevantRules = await getRuleContext(); } catch (e) { ... }

    const fullPrompt = `${systemPrompt}

${relevantRules ? `RELEVANT D&D 5E RULES:\n${relevantRules}\n\n` : ''}You MUST respond with a structured JSON object containing:
- overall_summary (string): An overall summary
- player_perspectives (array): Personalized perspectives

PREVIOUS STORY:
${conversationHistory}


CURRENT TURN ACTIONS:
${currentActions}

As the Dungeon Master, narrate what happens. First, provide an 'overall_summary'. Then, provide 'player_perspectives'.
Respond entirely in ${languageName}.`;

    strapi.log.info('Processing turn with LLM');

    return generateStructured(TurnResponseSchema, systemPrompt, fullPrompt, language, {
      metadata: { streamId },
      images: mapImage ? [mapImage] : undefined,
    });
  },
});
