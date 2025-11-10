/**
 * Game logic service - world generation and turn processing
 */

import { getLLMModel } from '@/config/langchain';
import type { WorldSettings, Player, Creature, Message, Language, CharacterSheet } from '@/types/index';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { generateText } from './llm';

/**
 * Generate world description from settings
 * @param settings - World generation settings
 * @param language - World description language
 * @returns Generated world description in markdown
 */
export async function generateWorld(settings: WorldSettings, language: Language = 'en'): Promise<string> {
  const systemPrompt = `You are a world-class Dungeon Master creating immersive RPG campaign backgrounds.
Create rich, detailed world descriptions using markdown formatting.`;

  const userPrompt = `Generate a compelling world description for an RPG campaign.

**Campaign Details:**
- Players: ${settings.playerCount}
- Length: ${settings.adventureLength}
- Difficulty: ${settings.difficulty}
- Theme: ${settings.theme}
- Setting: ${settings.setting}
- Tone: ${settings.tone}

**Format your response with markdown:**
- Use **bold** for important locations and characters
- Use *italics* for atmosphere and mood
- Use > blockquotes for prophecies or ancient texts
- Use headers (##) to organize sections
- Use lists for key points

Provide a rich 2-3 paragraph world description that sets the scene and hints at adventure.`;

  logger.info('Generating world description');
  const description = await generateText(systemPrompt, userPrompt, language);
  logger.info('World description generated successfully');

  return description;
}

/**
 * Build DM system instruction
 * @param worldDescription - World background
 * @param players - Current players
 * @param creatures - Active creatures
 * @param language - Game language
 * @returns System instruction for DM
 */
function buildDMSystemInstruction(worldDescription: string, players: Player[], creatures: Creature[]): string {
  const playerSummaries = players
    .map((p) => {
      const char = p.character;
      return `- ${char.name} (${char.alignment} ${char.race} ${char.characterClass} Lvl ${char.level}) | HP: ${char.hp}/${char.maxHp} | AC: ${char.armorClass}`;
    })
    .join('\n');

  const creatureSummaries = creatures.map((c) => `- ${c.name}, HP: ${c.hp}/${c.maxHp}`).join('\n');

  return `You are a world-class Dungeon Master for a d20-based tabletop RPG.

WORLD CONTEXT:
${worldDescription}

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
 * Process a game turn with LLM tool calling
 * @param worldDescription - World background
 * @param messages - Previous messages
 * @param players - Current players
 * @param creatures - Active creatures
 * @param language - Game language
 * @returns DM response
 */
export async function processTurn(
  worldDescription: string,
  messages: Message[],
  players: Player[],
  creatures: Creature[],
  language: Language = 'en'
): Promise<{ overall_summary: string; player_perspectives: Array<{ playerName: string; perspective: string }> }> {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };

  const systemPrompt = buildDMSystemInstruction(worldDescription, players, creatures);
  const languageName = languageMap[language] || 'English';

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
  const structuredModel = model.withStructuredOutput(TurnResponseSchema);

  // Build conversation
  const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n\n');

  const currentActions = players
    .filter((p) => p.action)
    .map((p) => `${p.character.name}: ${p.action}`)
    .join('\n');

  const fullPrompt = `${systemPrompt}

You MUST respond with a JSON object that matches this schema:
${JSON.stringify(zodToJsonSchema(TurnResponseSchema))}

PREVIOUS STORY:
${conversationHistory}

CURRENT TURN ACTIONS:
${currentActions}

As the Dungeon Master, narrate what happens. First, provide an 'overall_summary' of the events that unfold. Then, provide a personalized 'player_perspectives' for each character involved in the current actions, describing what they see, feel, and experience from their unique point of view. Use the provided tools (roll_dice, attribute_check, saving_throw, attack_roll, deal_damage) to determine outcomes fairly.

Respond entirely in ${languageName}.`;

  logger.info('Processing turn with LLM and structured output');

  const response = await structuredModel.invoke(fullPrompt);

  logger.info('Turn processed successfully');

  return response;
}

/**
 * Generate personalized opening for a specific character
 * @param worldDescription - World background
 * @param character - Character sheet
 * @param language - Game language
 * @returns Personalized opening narration
 */
async function generateCharacterOpening(
  worldDescription: string,
  character: CharacterSheet,
  language: Language = 'en'
): Promise<string> {
  const systemPrompt = `You are the Dungeon Master. You provide immersive, personalized perspectives for each character.

WORLD CONTEXT:
${worldDescription}`;

  const userMessage = `Generate a personalized opening for this character:

CHARACTER:
- Name: **${character.name}**
- Race: ${character.race}
- Class: ${character.characterClass}
- Alignment: ${character.alignment}
- Key Stats: STR ${character.attributes.Strength}, DEX ${character.attributes.Dexterity}, INT ${character.attributes.Intelligence}, WIS ${character.attributes.Wisdom}

Describe what THIS specific character sees, feels, and notices based on their unique perspective:

**For a Fighter/Warrior:** Notice tactical details, defensive positions, weapon advantages
**For a Wizard/Caster:** Sense magical energies, arcane disturbances, mystical patterns
**For a Rogue/Scout:** Spot traps, hidden paths, suspicious details
**For a Cleric/Priest:** Feel divine presence, sense undead, notice religious symbols

**Format (use markdown):**
### Through [Character's] Eyes

[What they see with their unique perspective]

*[Their internal thoughts or feelings]*

**[Something they notice with their skills]:**
- Detail 1
- Detail 2

> "[Dialogue, inscription, or inner voice]"

What do you do?

REMEMBER: NO meta-text. Start directly with ### header.`;

  const response = await generateText(systemPrompt, userMessage, language);
  return response;
}

/**
 * Generate personalized openings for all characters
 * @param worldDescription - World background
 * @param players - All players
 * @param language - Game language
 * @returns Array of personalized messages and a main opening message
 */
export async function generateCharacterOpenings(
  worldDescription: string,
  players: Player[],
  language: Language = 'en'
): Promise<{ openings: Array<{ playerId: string; message: string }>; mainMessage: string }> {
  logger.info(`Generating personalized openings for ${players.length} characters`);

  const openingSystemPrompt =
    'You are a world-class Dungeon Master. Write a compelling, public opening narration for the entire party to set the scene. This is the first thing they will read.';
  const openingUserPrompt = `Based on the world description below, write a 2-3 paragraph opening narration for the entire party. Introduce the immediate surroundings and hint at the brewing conflict or adventure.

WORLD:
${worldDescription}`;

  const mainMessage = await generateText(openingSystemPrompt, openingUserPrompt, language);

  const openings = await Promise.all(
    players.map(async (player) => {
      const message = await generateCharacterOpening(worldDescription, player.character, language);
      return {
        playerId: player.id,
        message,
      };
    })
  );

  logger.info('All character openings generated');
  return { openings, mainMessage };
}
