/**
 * Game logic service - world generation and turn processing
 */

import { getLLMModel } from '@/config/langchain';
import type {
  WorldSettings,
  Player,
  Creature,
  Message,
  Language,
  CharacterSheet,
  DMStyle,
  ScaleLevel,
} from '@/types/index';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import type { WorldCondition } from './entropy/types';
import { generateText } from './llm';
import { generateStructured } from './llm/structured';
import { getRuleContext } from './rag';

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

/**
 * Generate world description from settings (wrapped with tracing)
 * @param settings - World generation settings
 * @param language - World description language
 * @returns Generated world description with structured metadata
 */
export const generateWorld = async (settings: WorldSettings, language: Language = 'en'): Promise<string> => {
  // Import schema dynamically to avoid circular dependency
  const { WorldDescriptionSchema } = await import('@/schemas/agent-responses');

  const systemPrompt = `You are a world-class Dungeon Master creating immersive RPG campaign backgrounds.
Create rich, detailed world descriptions with structured metadata.`;

  const userPrompt = `Generate a compelling world description for an RPG campaign.

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

  logger.info('Generating world description');
  const worldData = await generateStructured(WorldDescriptionSchema, systemPrompt, userPrompt, language, {
    tags: ['world-generation', `theme:${settings.theme}`],
    metadata: { settings },
  });
  logger.info('World description generated successfully');

  // Format as markdown for backwards compatibility with existing code
  const formattedDescription = `# ${worldData.title}

${worldData.description}

*${worldData.atmosphere}*

## Key Locations

${
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldData.keyLocations.map((loc: any) => `**${loc.name}**: ${loc.description}`).join('\n\n')
}

## Threats

${
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldData.threats.map((threat: any) => `- ${threat}`).join('\n')
}

## Call to Adventure & Stakes

**Why you are here:** ${worldData.hooks[0] || 'Fate has brought you together.'}

**The Risks:** The world is in peril, and failure could mean doom.

## Adventure Hooks

${
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldData.hooks.map((hook: any, i: number) => `${i + 1}. ${hook}`).join('\n')
}`;

  return formattedDescription;
};

/**
 * Build DM system instruction
 * @param worldDescription - World background
 * @param players - Current players
 * @param creatures - Active creatures
 * @param worldConditions - Dynamic world conditions
 * @returns System instruction for DM
 */
function buildDMSystemInstruction(
  worldDescription: string,
  players: Player[],
  creatures: Creature[],
  settings?: WorldSettings,
  worldConditions?: WorldCondition[]
): string {
  const dmStyle = settings?.dmStyle;

  const playerSummaries = players
    .map((p) => {
      const char = p.character;
      return `- ${char.name} (${char.alignment} ${char.race} ${char.characterClass} Lvl ${char.level}) | HP: ${char.hp}/${char.maxHp} | AC: ${char.armorClass}`;
    })
    .join('\n');

  const creatureSummaries = creatures.map((c) => `- ${c.name}, HP: ${c.hp}/${c.maxHp}`).join('\n');

  // Format world conditions for prompt
  let worldConditionsText = '';
  if (worldConditions && worldConditions.length > 0) {
    const conditionsList = worldConditions
      .map((cond) => `- **${cond.key}**: ${cond.currentValue} — ${cond.description}`)
      .join('\n');
    worldConditionsText = `\nCURRENT WORLD STATE:\n${conditionsList}\n`;
  }

  // Build DM style instructions
  let dynamicStyleInstructions = '';
  if (dmStyle) {
    const specialModeDescriptions: Record<NonNullable<DMStyle['specialMode']>, string> = {
      pirate: 'Swashbuckling bravado, nautical slang, audacious swagger.',
      shakespearean: 'Elizabethan prose, poetic metaphor, theatrical flourish.',
      noir: 'Hardboiled inner monologue, moody metaphors, smoky intrigue.',
      courtly: 'Highborn etiquette, heraldic praise, regal formality.',
      grimdark: 'Brooding brutality, moral ambiguity, fatalistic tone.',
      storybook: 'Whimsical narration, fairytale cadence, moral undertones.',
    };

    const directives = [
      `- Verbosity Level ${dmStyle.verbosity + 1}: ${VERBOSITY_DESCRIPTORS[dmStyle.verbosity]}`,
      `- Descriptive Detail Level ${dmStyle.detail + 1}: ${DETAIL_DESCRIPTORS[dmStyle.detail]}`,
      `- Player Engagement Level ${dmStyle.engagement + 1}: ${ENGAGEMENT_DESCRIPTORS[dmStyle.engagement]}`,
      `- Narrative Guidance Level ${dmStyle.narrative + 1}: ${NARRATIVE_DESCRIPTORS[dmStyle.narrative]}`,
    ];

    if (dmStyle.specialMode && specialModeDescriptions[dmStyle.specialMode]) {
      directives.push(`- Performance Mode: ${specialModeDescriptions[dmStyle.specialMode]}`);
    }

    if (dmStyle.customDirectives?.trim()) {
      directives.push(`- Custom Directives: ${dmStyle.customDirectives.trim()}`);
    }

    dynamicStyleInstructions = `\nDYNAMIC STYLE ADJUSTMENTS:\n${directives.join('\n')}\n`;
  }

  const basePrelude =
    settings?.dmSystemPrompt?.trim() ||
    `You are the Dungeon Master (DM). Your goal is to run a thrilling, immersive, and fair D&D 5e adventure.

**DM PERSONA & GOALS:**
1.  **Be the Guide:** Don't just simulate a world; GUIDE the players. Give them clear calls to action if they are lost.
2.  **Weave Lore:** Every description should reinforce the world's history and current threats. Don't just say "You see a door"; say "You see a door marked with the ancient sigil of the Fallen King."
3.  **High Stakes:** Constantly remind players of the risks. The world is dangerous. Failure has consequences.
4.  **Call to Adventure:** Ensure the players know WHY they are here and WHAT they need to do.
5.  **Fair but Firm:** Apply rules fairly, but prioritize fun and narrative flow.`;

  const worldLore = [settings?.worldBackground?.trim(), worldDescription].filter(Boolean).join('\n\n');

  return `${basePrelude}${dynamicStyleInstructions}

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
- Encourage players to combine their unique abilities and support each other
- NPCs should recognize and respond to party dynamics and teamwork
- Challenges should be balanced for the full party, not solo play
- Highlight moments when players help each other or coordinate strategies
- The adventure succeeds through UNITY, not individual glory

D&D 5E MECHANICS REFERENCE:

**Advantage/Disadvantage:**
- Advantage: Roll 2d20, take higher result
- Disadvantage: Roll 2d20, take lower result
- Never stack (multiple sources = still just 1 advantage/disadvantage)

**Common DCs:**
- Very Easy: 5
- Easy: 10
- Medium: 15
- Hard: 20
- Very Hard: 25
- Nearly Impossible: 30

**Death Saves:**
- Unconscious at 0 HP
- Each turn: DC 10 death save
- 3 successes = stabilized
- 3 failures = dead
- Natural 20 = regain 1 HP
- Natural 1 = 2 failures

**Critical Hits:**
- Natural 20 on attack = critical hit
- Double all damage dice (not modifiers)

**Conditions (common):**
- Blinded: Can't see, attacks have Disadvantage, attacks against have Advantage
- Charmed: Can't attack charmer, charmer has Advantage on social checks
- Frightened: Disadvantage on checks/attacks while source in sight, can't move closer
- Poisoned: Disadvantage on attack rolls and ability checks
- Prone: Disadvantage on attacks, melee attacks against have Advantage
- Restrained: Speed 0, Disadvantage on Dex saves, attacks against have Advantage
- Stunned: Incapacitated, can't move, auto-fail Str/Dex saves
- Unconscious: Incapacitated, can't move/speak, drops items, auto-fail Str/Dex saves

**Spellcasting Basics:**
- Spell Save DC = 8 + proficiency bonus + spellcasting ability modifier
- Spell Attack Bonus = proficiency bonus + spellcasting ability modifier
- Concentration: Some spells require concentration, broken by damage (DC 10 or half damage, whichever is higher)

**Ability Checks:**
- d20 + ability modifier + proficiency bonus (if proficient) vs DC
- Skills use associated ability scores

FORMATTING RULES - EXTREMELY IMPORTANT:
You MUST use rich markdown formatting in your narrative:

- **Bold text** for critical information, dice results, and emphasis
- *Italic text* for character thoughts, atmosphere, and mood
- ### Headers for scene changes or major events
- > Blockquotes for spoken dialogue, prophecies, or inscriptions
- Lists (- item) for choices, observations, or status updates
- --- (horizontal rule) for dramatic scene breaks
- \`code\` for game mechanics or rules references

EXAMPLE FORMAT:
### The Battle Begins

The goblin snarls and charges!

**Attack Roll:** d20(15) + 3 = 18 vs AC 16 → **HIT!**

*The rusty blade glints in the torchlight...*

> "You'll never leave here alive!" the creature shrieks.

**Damage:** 1d6(4) + 1 = **5 slashing damage**

**Alice's Status:**
- HP: 7/12 ❤️
- Condition: Wounded

---

What do you do?

GUIDELINES:
- Use tools for ALL dice rolls and checks
- Reference D&D 5e mechanics above when relevant
- Use lookup tools if you need details about conditions, skills, equipment, etc.
- Be dramatic and vivid
- Use markdown generously
- React to player actions realistically
- Create memorable moments`;
}

/**
 * Process a game turn with LLM tool calling (wrapped with tracing)
 * @param worldDescription - World background
 * @param messages - Previous messages
 * @param players - Current players
 * @param creatures - Active creatures
 * @param language - Game language
 * @returns DM response
 */
export const processTurn = async (
  worldDescription: string,
  messages: Message[],
  players: Player[],
  creatures: Creature[],
  language: Language = 'en',
  settings?: WorldSettings,
  worldConditions?: WorldCondition[]
): Promise<{
  overall_summary: string;
  player_perspectives: Array<{ playerName: string; perspective: string }>;
  metadata: { ragContext: string };
}> => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };
  const languageName = languageMap[language] || 'English';
  const systemPrompt = buildDMSystemInstruction(worldDescription, players, creatures, settings, worldConditions);

  // Define the structured output schema
  const TurnResponseSchema = z.object({
    overall_summary: z.string().describe('An overall summary of what happened this turn for everyone in the party.'),
    player_perspectives: z
      .array(
        z.object({
          playerName: z.string().describe("The character's name."),
          perspective: z
            .string()
            .describe("A personalized, immersive description of events from this character's point of view."),
        })
      )
      .describe('An array of personalized perspectives for each player.'),
  });

  // Get LLM model with the structured output schema
  const model = await getLLMModel();
  type TurnResponse = z.infer<typeof TurnResponseSchema>;
  const structuredModel = model.withStructuredOutput<TurnResponse>(TurnResponseSchema);

  // Build conversation
  const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n\n');

  const currentActions = players
    .filter((p) => p.action)
    .map((p) => `${p.character.name}: ${p.action}`)
    .join('\n');

  // Fetch relevant D&D rules via RAG
  let relevantRules = '';
  try {
    const ruleQuery = currentActions || 'general gameplay';
    relevantRules = await getRuleContext(ruleQuery, 3);
  } catch (error) {
    logger.warn('Failed to fetch RAG context, proceeding without it:', error);
  }

  const fullPrompt = `${systemPrompt}

${relevantRules ? `RELEVANT D&D 5E RULES:\n${relevantRules}\n\n` : ''}You MUST respond with a structured JSON object containing:
- overall_summary (string): An overall summary of what happened this turn
- player_perspectives (array): Personalized perspectives for each player

PREVIOUS STORY:
${conversationHistory}

CURRENT TURN ACTIONS:
${currentActions}

As the Dungeon Master, narrate what happens. First, provide an 'overall_summary' of the events that unfold. Then, provide a personalized 'player_perspectives' for each character involved in the current actions, describing what they see, feel, and experience from their unique point of view. Use the provided tools (roll_dice, attribute_check, saving_throw, attack_roll, deal_damage) to determine outcomes fairly.${relevantRules ? ' Apply the relevant D&D 5e rules provided above when adjudicating actions.' : ''}

Respond entirely in ${languageName}.`;

  logger.info('Processing turn with LLM and structured output');

  const response = await structuredModel.invoke(fullPrompt);

  logger.info('Turn processed successfully');

  return {
    ...response,
    metadata: {
      ragContext: relevantRules,
    },
  };
};

/**
 * Generate personalized opening for a specific character (wrapped with tracing)
 * @param worldDescription - World background
 * @param character - Character sheet
 * @param language - Game language
 * @returns Personalized opening narration
 */
/**
 * Generate personalized opening for a specific character (wrapped with tracing)
 * @param worldDescription - World background
 * @param character - Character sheet
 * @param language - Game language
 * @returns Personalized opening narration
 */
/**
 * Generate personalized opening for a specific character (wrapped with tracing)
 * @param worldDescription - World background
 * @param character - Character sheet
 * @param language - Game language
 * @returns Personalized opening narration
 */
export const generateCharacterOpening = async (
  worldDescription: string,
  character: CharacterSheet,
  mainContext: string,
  language: Language = 'en'
): Promise<string> => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };
  const languageName = languageMap[language] || 'English';

  const systemPrompt = `You are the Dungeon Master. You provide immersive, personalized perspectives for each character.
Your goal is to ground the character in the current moment described in the Main Context.

WORLD CONTEXT:
${worldDescription}

MAIN CONTEXT (What is happening publicly):
${mainContext}

LANGUAGE REQUIREMENT:
You MUST respond entirely in ${languageName}. Every word of the narrative must be in ${languageName}.`;

  const userMessage = `Generate a personalized opening for this character that aligns PERFECTLY with the Main Context.

CHARACTER:
- Name: **${character.name}**
- Race: ${character.race}
- Class: ${character.characterClass}
- Alignment: ${character.alignment}
- Key Stats: STR ${character.attributes.Strength}, DEX ${character.attributes.Dexterity}, INT ${character.attributes.Intelligence}, WIS ${character.attributes.Wisdom}

**Instructions:**
1.  **Synchronize:** The events in the Main Context are happening RIGHT NOW. Your narration must be the *subjective experience* of those exact events.
2.  **Sensory Details:** Describe how THIS character perceives the scene (smells, sounds, threats) based on their class and stats.
3.  **Internal State:** How do they feel about the situation described in the Main Context?
4.  **Reaction:** End with them poised to react to the specific inciting incident mentioned in the Main Context.

**Format (use markdown):**
### Through [Character's] Eyes

[The scene from their perspective, weaving in specific details from the Main Context but filtered through their senses]

*[Their internal thoughts]*

**[Something they notice with their skills]:**
- Detail 1 (specific to their class/background)
- Detail 2

> "[Dialogue, inscription, or inner voice]"

What do you do?

REMEMBER: NO meta-text. Start directly with ### header.`;

  const response = await generateText(systemPrompt, userMessage, language);
  return response;
};

/**
 * Generate main opening narration for the party
 * @param worldDescription - World background
 * @param language - Game language
 * @returns Main opening narration
 */
export const generateMainOpening = async (worldDescription: string, language: Language = 'en'): Promise<string> => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };
  const languageName = languageMap[language] || 'English';

  const openingSystemPrompt = `You are a world-class Dungeon Master. Write a compelling, public opening narration for the entire party to set the scene. This is the first thing they will read.

LANGUAGE REQUIREMENT:
You MUST respond entirely in ${languageName}. Every word of the narrative must be in ${languageName}.`;

  const openingUserPrompt = `Based on the world description below, write a 2-3 paragraph opening narration for the entire party.

**Requirements:**
1.  **Grounded Start:** Start in a classic, atmospheric setting (e.g., a bustling tavern, a quiet campfire, a city gate). Establish the mood.
2.  **Party Unity:** Briefly mention they are together (resting, planning, or celebrating).
3.  **Inciting Incident:** Halfway through, introduce a SUDDEN event that disrupts the peace (e.g., a desperate messenger, a magical explosion, a monster attack).
4.  **Call to Action:** End with the immediate aftermath of this event.
5.  **CRITICAL:** Do NOT ask "What do you do?" or pose a direct question to the players. This is a cinematic cutscene.

**Tone:** Atmospheric, immersive, then suddenly urgent.

WORLD:
${worldDescription}`;

  return generateText(openingSystemPrompt, openingUserPrompt, language);
};

/**
 * Generate personalized openings for all characters (wrapped with tracing)
 * @param worldDescription - World background
 * @param players - All players
 * @param language - Game language
 * @returns Array of personalized messages and a main opening message
 */
export const generateCharacterOpenings = async (
  worldDescription: string,
  players: Player[],
  language: Language = 'en'
): Promise<{ openings: Array<{ playerId: string; message: string }>; mainMessage: string }> => {
  logger.info(`Generating personalized openings for ${players.length} characters in language: ${language}`);

  // 1. Generate Main Message FIRST to establish the shared reality
  const mainMessage = await generateMainOpening(worldDescription, language);

  // 2. Generate Character Openings using the Main Message as context
  const openings = await Promise.all(
    players.map(async (player) => {
      const message = await generateCharacterOpening(worldDescription, player.character, mainMessage, language);
      return {
        playerId: player.id,
        message,
      };
    })
  );

  logger.info('All character openings generated');
  return { openings, mainMessage };
};
