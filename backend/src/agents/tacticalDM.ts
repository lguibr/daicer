/**
 * Tactical DM Agent
 * LangChain agent that controls tactical combat via natural language
 * Rule 10: All agent abilities are LangChain tools with Zod schemas
 * Rule 30: Engine is arbiter; LLM is storyteller
 */

import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ChatAnthropic } from '@langchain/anthropic';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import type { CombatCharacter } from '@/combat/types';
import type { Position } from '@/types/shared';
import { DiceRoller } from '@/combat/dice';
import { streamManager } from '@/services/llm/stream-manager';

// Tool Schemas
const rollInitiativeSchema = z.object({
  characters: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        initiativeBonus: z.number(),
      })
    )
    .describe('Array of characters to roll initiative for'),
});

const moveCharacterSchema = z.object({
  characterName: z.string().describe('Name of the character to move'),
  targetX: z.number().int().describe('Target X coordinate'),
  targetY: z.number().int().describe('Target Y coordinate'),
});

const attackSchema = z.object({
  attackerName: z.string().describe('Name of the attacking character'),
  targetName: z.string().describe('Name of the target character'),
  weaponDamage: z.string().optional().describe('Damage dice (e.g., "1d8+3")'),
});

const castSpellSchema = z.object({
  casterName: z.string().describe('Name of the spellcaster'),
  spellName: z.string().describe('Name of the spell'),
  targetX: z.number().int().optional().describe('Target X coordinate for area spells'),
  targetY: z.number().int().optional().describe('Target Y coordinate for area spells'),
  targetName: z.string().optional().describe('Target character name for single-target spells'),
});

const rollDiceSchema = z.object({
  formula: z.string().describe('Dice formula (e.g., "1d20+5", "3d6")'),
  reason: z.string().describe('Reason for the roll'),
});

/**
 * Create tactical DM tools for a combat session
 */
export function createTacticalDMTools(
  characters: CombatCharacter[],
  diceRoller: DiceRoller,
  onUpdate: (update: any) => void
) {
  // Roll Initiative Tool
  const rollInitiativeTool = tool(
    async ({ characters: charData }) => {
      const results = charData.map((char) => {
        const roll = diceRoller.roll(1, 20);
        const total = roll.total + char.initiativeBonus;
        return {
          characterId: char.id,
          characterName: char.name,
          roll: roll.total,
          bonus: char.initiativeBonus,
          total,
        };
      });

      // Sort by total descending
      results.sort((a, b) => b.total - a.total);

      onUpdate({
        type: 'initiative_rolled',
        results,
      });

      return `Initiative rolled! Order: ${results.map((r) => `${r.characterName} (${r.total})`).join(', ')}`;
    },
    {
      name: 'roll_initiative',
      description: 'Roll initiative for all combatants to determine turn order',
      schema: rollInitiativeSchema,
    }
  );

  // Move Character Tool
  const moveCharacterTool = tool(
    async ({ characterName, targetX, targetY }) => {
      const character = characters.find((c) => c.name.toLowerCase() === characterName.toLowerCase());
      if (!character) {
        return `Error: Character "${characterName}" not found`;
      }

      const distance = Math.max(Math.abs(targetX - character.position.x), Math.abs(targetY - character.position.y));

      if (distance > character.movementRemaining) {
        return `Error: ${characterName} only has ${character.movementRemaining} movement remaining, but needs ${distance}`;
      }

      onUpdate({
        type: 'character_moved',
        characterId: character.id,
        from: { ...character.position },
        to: { x: targetX, y: targetY },
        distance,
      });

      return `${characterName} moved from (${character.position.x}, ${character.position.y}) to (${targetX}, ${targetY}) - ${distance} squares`;
    },
    {
      name: 'move_character',
      description: 'Move a character on the tactical grid',
      schema: moveCharacterSchema,
    }
  );

  // Attack Tool
  const attackTool = tool(
    async ({ attackerName, targetName, weaponDamage = '1d8' }) => {
      const attacker = characters.find((c) => c.name.toLowerCase() === attackerName.toLowerCase());
      const target = characters.find((c) => c.name.toLowerCase() === targetName.toLowerCase());

      if (!attacker) return `Error: Attacker "${attackerName}" not found`;
      if (!target) return `Error: Target "${targetName}" not found`;

      // Attack roll
      const attackRoll = diceRoller.roll(1, 20);
      const attackTotal = attackRoll.total + attacker.attackBonus;
      const hit = attackTotal >= target.ac;

      let result = `${attackerName} attacks ${targetName}! Attack roll: ${attackRoll.total} + ${attacker.attackBonus} = ${attackTotal} vs AC ${target.ac}`;

      if (hit) {
        // Damage roll
        const damageRoll = diceRoller.rollFormula(weaponDamage);
        const newHP = Math.max(0, target.hp - damageRoll.total);

        onUpdate({
          type: 'attack_hit',
          attackerId: attacker.id,
          targetId: target.id,
          attackRoll: attackRoll.total,
          attackBonus: attacker.attackBonus,
          attackTotal,
          damage: damageRoll.total,
          damageFormula: weaponDamage,
          newHP,
        });

        result += ` - HIT! ${damageRoll.total} damage! ${targetName}: ${target.hp} → ${newHP} HP`;
      } else {
        onUpdate({
          type: 'attack_miss',
          attackerId: attacker.id,
          targetId: target.id,
          attackRoll: attackRoll.total,
          attackBonus: attacker.attackBonus,
          attackTotal,
        });

        result += ' - MISS!';
      }

      return result;
    },
    {
      name: 'attack',
      description: 'Execute an attack from one character to another with dice rolls',
      schema: attackSchema,
    }
  );

  // Cast Spell Tool
  const castSpellTool = tool(
    async ({ casterName, spellName, targetX, targetY, targetName }) => {
      const caster = characters.find((c) => c.name.toLowerCase() === casterName.toLowerCase());
      if (!caster) return `Error: Caster "${casterName}" not found`;

      // Simplified spell effects (would integrate with full spell system)
      onUpdate({
        type: 'spell_cast',
        casterId: caster.id,
        spellName,
        target: targetName || `(${targetX}, ${targetY})`,
      });

      return `${casterName} casts ${spellName}${targetName ? ` on ${targetName}` : ` at (${targetX}, ${targetY})`}!`;
    },
    {
      name: 'cast_spell',
      description: 'Cast a spell with a target character or area',
      schema: castSpellSchema,
    }
  );

  // Generic Dice Roll Tool
  const rollDiceTool = tool(
    async ({ formula, reason }) => {
      const roll = diceRoller.rollFormula(formula);
      onUpdate({
        type: 'dice_rolled',
        formula,
        result: roll.total,
        rolls: roll.rolls,
        reason,
      });

      return `Rolled ${formula} for ${reason}: ${roll.total} (rolls: ${roll.rolls.join(', ')})`;
    },
    {
      name: 'roll_dice',
      description: 'Roll dice with any formula for any reason',
      schema: rollDiceSchema,
    }
  );

  return [rollInitiativeTool, moveCharacterTool, attackTool, castSpellTool, rollDiceTool];
}

/**
 * Create tactical DM agent
 */
export async function createTacticalDMAgent(
  characters: CombatCharacter[],
  diceRoller: DiceRoller,
  onUpdate: (update: any) => void
) {
  const model = new ChatAnthropic({
    modelName: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
  });

  const tools = createTacticalDMTools(characters, diceRoller, onUpdate);

  const agent = createReactAgent({
    llm: model,
    tools,
  });

  return agent;
}

/**
 * Process a DM command
 */
export async function processDMCommand(
  command: string,
  characters: CombatCharacter[],
  diceRoller: DiceRoller,
  onUpdate: (update: any) => void,
  streamId?: string
): Promise<string> {
  const agent = await createTacticalDMAgent(characters, diceRoller, onUpdate);

  const systemPrompt = `You are a D&D 5e Dungeon Master controlling a tactical combat encounter. 
Parse user commands and execute them using the provided tools.

Available characters: ${characters.map((c) => `${c.name} (${c.isPlayer ? 'PC' : 'NPC'})`).join(', ')}

When the user says something like:
- "Roll initiative" → use roll_initiative tool
- "Fighter moves to 5,3" → use move_character tool  
- "Goblin attacks Fighter" → use attack tool
- "Wizard casts Fireball at 8,8" → use cast_spell tool

Execute the command and describe what happened in narrative form.`;

  // Use streamEvents to get real-time updates
  const stream = await agent.streamEvents(
    {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command },
      ],
    },
    {
      version: 'v2',
    }
  );

  let finalContent = '';

  for await (const event of stream) {
    // Stream text chunks
    if (event.event === 'on_chat_model_stream') {
      const content = event.data.chunk?.content;
      if (content && typeof content === 'string') {
        if (streamId) streamManager.emitText(streamId, content);
        finalContent += content;
      }
    }
    // Stream tool usage
    else if (event.event === 'on_tool_start') {
      if (streamId) streamManager.emitToolStart(streamId, event.name, event.data.input);
    } else if (event.event === 'on_tool_end') {
      if (streamId) streamManager.emitToolEnd(streamId, event.name, event.data.output);
    }
  }

  return finalContent || 'Command processed';
}
