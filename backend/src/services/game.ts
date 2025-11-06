/**
 * Game logic service - world generation and turn processing
 */

import { generateText, generateWithHistory } from './llm.js';
import { getLLMModel } from '@/config/langchain.js';
import { getGameTools } from './tools.js';
import { getModifier } from '@/utils/game-mechanics.js';
import type { WorldSettings, Player, Creature, Message, Language, Attribute } from '@/types/index.js';
import { logger } from '@/utils/logger.js';

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
function buildDMSystemInstruction(
  worldDescription: string,
  players: Player[],
  creatures: Creature[],
  language: Language
): string {
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
): Promise<string> {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    'pt-BR': 'Brazilian Portuguese',
  };

  const systemPrompt = buildDMSystemInstruction(worldDescription, players, creatures, language);
  const languageName = languageMap[language] || 'English';

  // Get LLM model with tools
  const model = getLLMModel();
  const tools = getGameTools();
  const modelWithTools = model.bindTools(tools);

  // Build conversation
  const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n\n');

  const currentActions = players
    .filter((p) => p.action)
    .map((p) => `${p.character.name}: ${p.action}`)
    .join('\n');

  const fullPrompt = `${systemPrompt}

PREVIOUS STORY:
${conversationHistory}

CURRENT TURN ACTIONS:
${currentActions}

As the Dungeon Master, narrate what happens. Use the provided tools (roll_dice, attribute_check, saving_throw, attack_roll, deal_damage) to determine outcomes fairly. Then provide a vivid narrative response.

Respond entirely in ${languageName}.`;

  logger.info('Processing turn with LLM tools');

  const response = await modelWithTools.invoke(fullPrompt, {
    metadata: { players, creatures },
  });

  logger.info('Turn processed successfully');

  return response.content.toString();
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
 * @returns Array of personalized messages
 */
export async function generateCharacterOpenings(
  worldDescription: string,
  players: Player[],
  language: Language = 'en'
): Promise<Array<{ playerId: string; message: string }>> {
  logger.info(`Generating personalized openings for ${players.length} characters`);

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
  return openings;
}

