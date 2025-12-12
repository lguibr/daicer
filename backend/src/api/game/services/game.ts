/**
 * Game logic service - world generation and turn processing
 * Ported to Strapi
 */

import { factories } from '@strapi/strapi';
import { getLLMModel } from '../../../config/langchain';
import { uploadBase64Image } from '../../../utils/upload';
import type {
  WorldSettings,
  Player,
  Creature,
  Message,
  Language,
  CharacterSheet,
  DMStyle,
  ScaleLevel,
} from '../../../types/index';
import { z } from 'zod';
import { generateText } from '../../../utils/llm';
import { generateStructured } from '../../../utils/llm/structured';
import { getPrompt } from '../../../utils/prompt';
// import { getRuleContext } from '../../../utils/rag'; // TODO: precise path if implemented

// Stub for RAG
async function getRuleContext(query: string, limit: number): Promise<string> {
  return '';
}

const VERBOSITY_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Deliver crisp headline summaries; keep narration to essential beats.',
  1: 'Speak in short bursts that hit key sensory notes while staying brisk.',
  2: 'Balance concise narration with a handful of atmospheric details.',
  3: 'Weave story-driven paragraphs with recurring hooks and callbacks.',
  4: 'Lean into rich language, metaphor, and evocative cadence.',
  5: 'Craft epic narration with layered description and dramatic pacing.',
  6: 'Unleash operatic storytelling fit for bardic sagas and legendary chronicles.',
};

const DETAIL_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Prioritise mechanical clarity; pare down to tactical essentials.',
  1: 'Highlight only the props, hazards, and clues the party must see.',
  2: 'Blend mechanical stakes with a handful of sensory anchors.',
  3: 'Balance environmental description with rule-focused insight.',
  4: 'Layer textures, sounds, and histories into every scene.',
  5: 'Immerse players with nuanced lore, mood, and symbolism.',
  6: 'Paint cinematic tableaux dense with cultural and emotional context.',
};

const ENGAGEMENT_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Stay observational; deliver outcomes with minimal prompting.',
  1: 'Invite player decisions at inflection points but keep a light touch.',
  2: 'Check in routinely for intentions, reactions, and table talk.',
  3: 'Co-author moments; spotlight teamwork and shared discovery.',
  4: 'Seed dilemmas, rivalries, and cliff-hangers that demand responses.',
  5: 'Escalate dramatic tension and rotate the spotlight deliberately.',
  6: 'Fully immerse the party with in-character dialogue and emotive beats.',
};

const NARRATIVE_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Let the party define the arc; you react swiftly to their initiatives.',
  1: 'Offer scattered threads and let players braid them together.',
  2: 'Blend branching choices with gentle narrative nudges.',
  3: 'Maintain balanced arcs with equal agency and plotted beats.',
  4: 'Guide scenes with clear stakes and recurring NPC agendas.',
  5: 'Engineer planned twists and episodic crescendos.',
  6: 'Author a sweeping saga with foreshadowed climaxes and mythic structure.',
};

export default ({ strapi }) => ({
  async generateWorld(settings: WorldSettings, language: Language = 'en'): Promise<string> {
    const { WorldDescriptionSchema } = await import('../../../schemas/agent-responses');

    const systemPromptDefault = `You are a world-class Dungeon Master creating immersive RPG campaign backgrounds.
Create rich, detailed world descriptions with structured metadata.`;

    const userPromptDefault = `Generate a compelling world description for an RPG campaign.

**Campaign Details:**
- Players: ${settings.playerCount}
- Length: ${settings.adventureLength}
- Difficulty: ${settings.difficulty}
- Theme: ${settings.theme}
- Setting: ${settings.setting}
- Tone: ${settings.tone}

**Requirements:**
- Create a catchy campaign title
- Write a rich 2-3 paragraph description using markdown formatting
- Capture the atmosphere in one sentence
- Identify 2-4 key locations with brief descriptions
- List primary threats or antagonistic forces
- **Call to Adventure**: Explicitly state why the party is together and what their immediate goal is.
- **Risks & Stakes**: Clearly define what happens if they fail.
- Provide 2-3 adventure hooks to draw players in
- Include metadata about difficulty, theme, and setting`;

    // Try to fetch prompts from CMS
    // Note: User prompt dynamic injection is tricky if fetched as static string.
    // We will use the fetched string as a base and replace placeholders if we had them,
    // but for now, we'll stick to the default dynamic construction for the USER prompt
    // and only fetch the SYSTEM prompt to avoid template complexity.

    const systemPrompt = await getPrompt('world_generation_system', language, systemPromptDefault);
    // For user prompt, we construct it dynamically here.
    // To support localization of the dynamic parts, we would need templates.
    // Assuming 'language' passed to LLM handles the response language,
    // the input prompt language is less critical as long as LLM understands it.
    // However, we should ideally use localized user prompt templates.
    // For this port, I will use the English template for the prompt structure primarily
    // but instruct the LLM to respond in the target language (which is handled by llm service).

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

${worldData.keyLocations.map((loc: any) => `**${loc.name}**: ${loc.description}`).join('\n\n')}

## Threats

${worldData.threats.map((threat: any) => `- ${threat}`).join('\n')}

## Call to Adventure & Stakes

**Why you are here:** ${worldData.hooks[0] || 'Fate has brought you together.'}

**The Risks:** The world is in peril, and failure could mean doom.

## Adventure Hooks

${worldData.hooks.map((hook: any, i: number) => `${i + 1}. ${hook}`).join('\n')}`;

    return formattedDescription;
  },

  async processTurn(
    worldDescription: string,
    messages: Message[],
    players: Player[],
    creatures: Creature[],
    language: Language = 'en',
    settings?: WorldSettings,
    worldConditions?: any[], // Typed as any for now
    mapContext?: string,
    streamId?: string
  ) {
    const { TurnResponseSchema } = await import('../../../schemas/agent-responses');

    const languageMap: Record<Language, string> = {
      en: 'English',
      es: 'Spanish',
      'pt-BR': 'Brazilian Portuguese',
    };
    const languageName = languageMap[language] || 'English';

    // Build DM instruction
    const dmStyle = settings?.dmStyle;

    const playerSummaries = players
      .map((p) => {
        const char = p.character;
        if (!char) return `- ${p.name} (No character sheet)`;
        return `- ${char.name} (${char.alignment} ${char.race} ${char.characterClass} Lvl ${char.level}) | HP: ${char.hp}/${char.maxHp} | AC: ${char.armorClass}`;
      })
      .join('\n');

    const creatureSummaries = creatures.map((c) => `- ${c.name}, HP: ${c.hp}/${c.maxHp}`).join('\n');
    let worldConditionsText = ''; // stub

    let dynamicStyleInstructions = '';
    if (dmStyle) {
      // ... (Style descriptors logic - omitting full map for brevity, reusing constants)
      // Ideally we refactor this to a private helper in this file
      const directives = [
        `- Verbosity Level ${dmStyle.verbosity + 1}: ${VERBOSITY_DESCRIPTORS[dmStyle.verbosity] || 'Normal'}`,
        `- Descriptive Detail Level ${dmStyle.detail + 1}: ${DETAIL_DESCRIPTORS[dmStyle.detail] || 'Normal'}`,
        `- Player Engagement Level ${dmStyle.engagement + 1}: ${ENGAGEMENT_DESCRIPTORS[dmStyle.engagement] || 'Normal'}`,
        `- Narrative Guidance Level ${dmStyle.narrative + 1}: ${NARRATIVE_DESCRIPTORS[dmStyle.narrative] || 'Normal'}`,
      ];
      if (dmStyle.customDirectives?.trim()) {
        directives.push(`- Custom Directives: ${dmStyle.customDirectives.trim()}`);
      }
      dynamicStyleInstructions = `\nDYNAMIC STYLE ADJUSTMENTS:\n${directives.join('\n')}\n`;
    }

    const systemPromptDefault = `You are the Dungeon Master (DM). Your goal is to run a thrilling, immersive, and fair D&D 5e adventure.`;
    const basePrelude = await getPrompt('dm_system_instruction', language, systemPromptDefault);

    const worldLore = [settings?.worldBackground?.trim(), worldDescription].filter(Boolean).join('\n\n');

    const systemPrompt = `${basePrelude}${dynamicStyleInstructions}

WORLD CONTEXT:
${worldLore}
${worldConditionsText}
CURRENT PARTY:
${playerSummaries}

ACTIVE CREATURES/NPCs:
${creatureSummaries || 'None currently active.'}

CRITICAL: TEAMWORK & PARTY COHESION:
- This is a TEAM adventure - the party works TOGETHER
- Create situations that require cooperation and reward working as a group

FORMATTING RULES - EXTREMELY IMPORTANT:
You MUST use rich markdown formatting in your narrative.`;

    // Build conversation
    const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n\n');
    const currentActions = players
      .filter((p) => p.action && p.character)
      .map((p) => `${p.character!.name}: ${p.action}`)
      .join('\n');

    // RAG
    let relevantRules = '';
    try {
      relevantRules = await getRuleContext(currentActions || 'general gameplay', 3);
    } catch (e) {
      strapi.log.warn('RAG failed', e);
    }

    const fullPrompt = `${systemPrompt}

${relevantRules ? `RELEVANT D&D 5E RULES:\n${relevantRules}\n\n` : ''}You MUST respond with a structured JSON object containing:
- overall_summary (string): An overall summary
- player_perspectives (array): Personalized perspectives

PREVIOUS STORY:
${conversationHistory}

${mapContext ? `MAP CONTEXT:\n${mapContext}\n` : ''}
CURRENT TURN ACTIONS:
${currentActions}

As the Dungeon Master, narrate what happens. First, provide an 'overall_summary'. Then, provide 'player_perspectives'.
Respond entirely in ${languageName}.`;

    strapi.log.info('Processing turn with LLM');

    // We use dynamic import for schema to avoid circular deps if any, though here it's fine
    const response = await generateStructured(TurnResponseSchema, systemPrompt, fullPrompt, language, {
      metadata: { streamId },
    });

    return {
      ...response,
      metadata: {
        ragContext: relevantRules,
      },
    };
  },

  async generateCharacterOpening(
    worldDescription: string,
    character: CharacterSheet,
    mainContext: string,
    language: Language = 'en',
    streamId?: string
  ): Promise<string> {
    const systemPrompt = `You are the Dungeon Master. Provide immersive, personalized perspectives.
World Context: ${worldDescription}
Main Context: ${mainContext}`;

    const userPrompt = `Generate a personalized opening for ${character.name} (${character.race} ${character.characterClass}).
Synchronize with the Main Context.
Describe sensory details, internal state, and prepare for reaction.
Start with ### Through ${character.name}'s Eyes`;

    return generateText(systemPrompt, userPrompt, language, { metadata: { streamId } });
  },

  async generateMainOpening(worldDescription: string, language: Language = 'en', streamId?: string): Promise<string> {
    const systemPrompt = `You are a world-class Dungeon Master. Write a compelling, public opening narration for the entire party.`;
    const userPrompt = `Based on: ${worldDescription}
Write a 2-3 paragraph opening.
1. Grounded Start
2. Party Unity
3. Inciting Incident
4. Call to Action
5. DO NOT ask questions.`;

    return generateText(systemPrompt, userPrompt, language, { metadata: { streamId } });
  },
  async addCharacter(roomId: string, characterData: any, user: any) {
    // Fetch room with robust lookup (documentId, roomId field, or numeric id)
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];

    // If roomId looks like a number, checks against numeric id
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: {
        $or: filters,
      },
    });

    if (!rooms || rooms.length === 0) {
      console.error('Room not found for identifier: ' + roomId);
      throw new Error('Room not found');
    }
    const room = rooms[0] as any;
    const players = room.players || [];
    const playerId = user ? String(user.id) : `user-${Date.now()}`; // Ensure string ID to match frontend
    const playerName = user ? user.username : 'Unknown';

    // Check if player already exists (compare as strings to handle legacy number IDs)
    const existingIndex = players.findIndex((p: any) => String(p.userId) === String(playerId));

    // Handle Image Uploads
    // We upload base64 images to Strapi Media Library and replace them with URLs
    const avatarSlots = ['portrait', 'upperBody', 'fullBody'];
    const processedAvatarPreview = { ...characterData.avatarPreview };

    if (processedAvatarPreview) {
      for (const slot of avatarSlots) {
        if (processedAvatarPreview[slot] && processedAvatarPreview[slot].data) {
          try {
            const base64 = `data:${processedAvatarPreview[slot].mimeType};base64,${processedAvatarPreview[slot].data}`;
            const filename = `avatar-${playerId}-${slot}-${Date.now()}`;
            const uploadResult = await uploadBase64Image(base64, filename);

            if (uploadResult) {
              // Replace with URL and remove heavy data
              processedAvatarPreview[slot] = {
                ...processedAvatarPreview[slot],
                data: null, // Clear base64
                publicUrl: uploadResult.url,
                mediaId: uploadResult.id,
              };
            }
          } catch (err) {
            console.error(`Failed to upload ${slot} avatar:`, err);
            // Fallback: keep base64 if upload fails? Or just log?
            // Converting to URL failed, so we might keep base64 logic or fail gracefully.
            // For now, let's keep base64 if upload fails to avoid data loss,
            // but effectively we want to stop using base64 DB storage.
          }
        }
      }
    }

    const newPlayer = {
      id: playerId, // or generate a unique player ID
      userId: playerId,
      name: playerName,
      ready: true,
      action: null,
      character: {
        ...characterData,
        // Ensure critical stats are present if missing from payload
        hp: characterData.hp || characterData.maxHp || 10,
        maxHp: characterData.maxHp || 10,
        level: characterData.level || 1,
        xp: characterData.xp || 0,
        conditions: characterData.conditions || [],
        inventory: characterData.inventory || [],
        avatarPreview: processedAvatarPreview,
      },
    };

    let updatedPlayers;
    if (existingIndex >= 0) {
      updatedPlayers = [...players];
      updatedPlayers[existingIndex] = newPlayer;
    } else {
      updatedPlayers = [...players, newPlayer];
    }

    // Update room
    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        players: updatedPlayers,
      },
    });

    return newPlayer;
  },

  async startGame(roomId: string, language: Language = 'en') {
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: {
        $or: filters,
      },
    });

    if (!rooms || rooms.length === 0) {
      console.error('Room not found for identifier: ' + roomId);
      throw new Error('Room not found');
    }
    const room = rooms[0] as any;

    // Generate Opening
    const mainOpening = await this.generateMainOpening(room.worldDescription, language);

    // TODO: Generate individual openings in parallel and store/send them?
    // For now, we return the main opening to start the chat.
    // Individual hooks could be DM'd or appended.

    // Ideally we save this as the first message.
    // Since we don't have a messages collection yet (stateless turn assumption in controller),
    // we return it. If we had a message collection, we'd add it there.

    return {
      text: mainOpening,
      sender: 'DM',
      timestamp: Date.now(),
    };
  },

  async getRoom(roomId: string) {
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: {
        $or: filters,
      },
      populate: ['players'], // Populate necessary relations
    });

    if (!rooms || rooms.length === 0) {
      return null;
    }
    return rooms[0];
  },
});
