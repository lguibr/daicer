import { generateStructured } from '../../../utils/llm/structured';
import { getPrompt, formatPrompt } from '../../../utils/prompt';
import type { WorldSettings, Player, Creature, Message, Language } from '@daicer/engine';
import { formatDmInstruction } from '@daicer/engine';

export default ({ strapi }) => ({
  async generateNarrativeResponse(
    roomId: string,
    worldDescription: string,
    messages: Message[],
    players: Player[],
    creatures: Creature[],
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

    const playerSummaries = players
      .map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const char = p.character as any;
        if (!char) return `- ${p.name} (No character sheet)`;
        return `- ${char.name} (${char.race?.name || 'Unknown Race'} ${char.class?.name || 'Unknown Class'}) | HP: ${char.baseStats?.hp || 10}/${char.baseStats?.maxHp || 10}`;
      })
      .join('\n');

    const creatureSummaries = creatures.map((c) => `- ${c.name}, HP: ${c.hp}/${c.maxHp}`).join('\n');
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
