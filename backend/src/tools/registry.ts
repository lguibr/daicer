/**
 * Tool Registry & Catalog
 * All LangChain tools indexed with metadata for Studio discovery
 */

import { z } from 'zod';
import { startCombatTool, attackTool, moveTool, endTurnTool, endCombatTool } from '@/combat/tools/combat-tools';
import { createTodoTool, updateTodoTool, completeTodoTool, listTodosTool } from '@/combat/tools/todo-tools';
import { askHumanTool } from '@/combat/tools/human-interaction';
// Note: Tools imported for metadata only, not directly used in registry
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { recallMemoryTool, storeMemoryTool } from '@/combat/tools/memory-tools';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  queryRacesTool,
  queryClassesTool,
  querySpellsTool,
  queryMonstersTool,
  queryConditionsTool,
  queryAbilitiesTool,
  querySkillsTool,
  queryEquipmentTool,
} from '@/combat/tools/srd-query-tools';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  queryCharacterSheetTool,
  queryCombatLogTool,
  queryTacticalGridTool,
  queryCombatStatusTool,
  updateCharacterHPTool,
  applyConditionTool,
  removeConditionTool,
  updateInventoryTool,
  grantXPTool,
} from '@/combat/tools/state-tools';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  overrideDiceRollTool,
  vetoToolResultTool,
  applyNarrativeModifierTool,
  invokeLegendaryActionTool,
  applyRuleOfCoolTool,
  declareNarrativeImmunityTool,
} from '@/combat/tools/dm-override-tools';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { queryGeospatialContextTool } from '@/combat/tools/geospatial-tools';

/**
 * Tool metadata schema
 */
export const ToolMetadataSchema = z.object({
  id: z.string().describe('Unique tool identifier'),
  name: z.string().describe('Tool function name'),
  description: z.string().describe('What this tool does'),
  category: z.enum([
    'combat',
    'todo',
    'human-interaction',
    'dice',
    'tactical',
    'utility',
    'memory',
    'srd-query',
    'state-query',
    'state-mutation',
    'dm-override',
    'geospatial',
  ]),
  inputSchema: z.string().describe('Name of input Zod schema'),
  outputSchema: z.string().describe('Name of output Zod schema'),
  requiresState: z.boolean().default(false).describe('Requires game state in config'),
  isPure: z.boolean().default(false).describe('Pure function (no side effects)'),
  tags: z.array(z.string()).default([]),
  exampleUsage: z.string().optional(),
  agentRestrictions: z.array(z.string()).optional().describe('Which agents can use this tool'),
});

export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;

/**
 * Combat Tools
 */
export const COMBAT_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'start_combat',
    name: 'start_combat',
    description: 'Initiates tactical combat with specified players and enemies',
    category: 'combat',
    inputSchema: 'StartCombatSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['combat', 'initialization', 'tactical'],
    exampleUsage: 'start_combat({ playerIds: ["player1"], enemyNames: ["Goblin", "Orc"] })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'attack',
    name: 'attack',
    description: 'Executes an attack action in combat',
    category: 'combat',
    inputSchema: 'AttackSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['combat', 'action', 'damage'],
    exampleUsage:
      'attack({ attackerName: "Thorin", targetName: "Goblin", weaponDamage: "1d8+3", damageType: "slashing" })',
  },
  {
    id: 'move',
    name: 'move',
    description: 'Moves a character to a new position on the combat grid',
    category: 'combat',
    inputSchema: 'MoveSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['combat', 'movement', 'tactical'],
    exampleUsage: 'move({ characterName: "Thorin", targetX: 5, targetY: 3 })',
  },
  {
    id: 'end_turn',
    name: 'end_turn',
    description: 'Ends the current character turn and advances initiative',
    category: 'combat',
    inputSchema: 'EndTurnSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['combat', 'turn-management'],
    exampleUsage: 'end_turn({})',
  },
  {
    id: 'end_combat',
    name: 'end_combat',
    description: 'Ends the combat encounter and returns to narrative gameplay',
    category: 'combat',
    inputSchema: 'EndCombatSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['combat', 'cleanup'],
    exampleUsage: 'end_combat({ outcome: "victory", xpAwarded: 250 })',
    agentRestrictions: ['dm-agent'],
  },
];

/**
 * Todo Middleware Tools
 */
export const TODO_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'create_todo',
    name: 'create_todo',
    description: 'Creates a new todo item for agent self-tracking and execution planning',
    category: 'todo',
    inputSchema: 'CreateTodoSchema',
    outputSchema: 'AgentTodoSchema',
    requiresState: true,
    isPure: false,
    tags: ['agent', 'planning', 'middleware'],
    exampleUsage:
      'create_todo({ task: "Calculate Fireball area damage", priority: "high", context: "combat-round-3" })',
    agentRestrictions: ['dm-agent', 'tactical-agent'],
  },
  {
    id: 'update_todo',
    name: 'update_todo',
    description: 'Updates an existing todo item (status, description, priority)',
    category: 'todo',
    inputSchema: 'UpdateTodoSchema',
    outputSchema: 'AgentTodoSchema',
    requiresState: true,
    isPure: false,
    tags: ['agent', 'planning'],
    exampleUsage: 'update_todo({ id: "todo-123", status: "in_progress" })',
  },
  {
    id: 'complete_todo',
    name: 'complete_todo',
    description: 'Marks a todo item as completed',
    category: 'todo',
    inputSchema: 'CompleteTodoSchema',
    outputSchema: 'SuccessResponseSchema',
    requiresState: true,
    isPure: false,
    tags: ['agent', 'planning'],
    exampleUsage: 'complete_todo({ id: "todo-123" })',
  },
  {
    id: 'list_todos',
    name: 'list_todos',
    description: 'Lists all active todo items for the agent',
    category: 'todo',
    inputSchema: 'z.object({})',
    outputSchema: 'z.array(AgentTodoSchema)',
    requiresState: true,
    isPure: true,
    tags: ['agent', 'planning', 'query'],
    exampleUsage: 'list_todos({})',
  },
];

/**
 * Human Interaction Tools
 */
export const HUMAN_INTERACTION_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'ask_human',
    name: 'ask_human',
    description: 'Asks a clarifying question to the human user and pauses graph execution',
    category: 'human-interaction',
    inputSchema: 'AgentQuestionSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['agent', 'human-in-loop', 'clarification'],
    exampleUsage:
      'ask_human({ question: "Which goblin should Thorin attack?", reasoning: "Three goblins present, targeting unclear" })',
    agentRestrictions: ['dm-agent', 'tactical-agent'],
  },
];

/**
 * Memory Tools
 */
export const MEMORY_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'recall_memory',
    name: 'recall_memory',
    description: 'Query semantic memory for relevant facts, events, character details, or locations',
    category: 'memory',
    inputSchema: 'RecallMemorySchema',
    outputSchema: 'MemoryRecallResult',
    requiresState: true,
    isPure: true,
    tags: ['memory', 'query', 'context', 'semantic-search'],
    exampleUsage: 'recall_memory({ query: "What do I know about the Iron Hills?", memoryType: "location", limit: 5 })',
    agentRestrictions: ['dm-agent', 'world-builder-agent'],
  },
  {
    id: 'store_memory',
    name: 'store_memory',
    description: 'Store an important fact, event, or detail in semantic memory for future recall',
    category: 'memory',
    inputSchema: 'StoreMemorySchema',
    outputSchema: 'MemoryStoreResult',
    requiresState: true,
    isPure: false,
    tags: ['memory', 'storage', 'learning', 'persistence'],
    exampleUsage:
      'store_memory({ content: "Thorin is a dwarf from the Iron Hills", memoryType: "character", source: "player-said", importance: 0.7 })',
    agentRestrictions: ['dm-agent', 'world-builder-agent'],
  },
];

/**
 * SRD Query Tools
 */
export const SRD_QUERY_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'query_races',
    name: 'query_races',
    description: 'Query D&D 5e races (e.g., elf, dwarf, halfling)',
    category: 'srd-query',
    inputSchema: 'QueryRacesSchema',
    outputSchema: 'RaceQueryResult',
    requiresState: false,
    isPure: true,
    tags: ['srd', 'reference', 'races'],
    exampleUsage: 'query_races({ raceId: "elf" })',
  },
  {
    id: 'query_classes',
    name: 'query_classes',
    description: 'Query D&D 5e character classes (e.g., fighter, wizard)',
    category: 'srd-query',
    inputSchema: 'QueryClassesSchema',
    outputSchema: 'ClassQueryResult',
    requiresState: false,
    isPure: true,
    tags: ['srd', 'reference', 'classes'],
    exampleUsage: 'query_classes({ classId: "wizard" })',
  },
  {
    id: 'query_spells',
    name: 'query_spells',
    description: 'Query D&D 5e spells with optional filters (level, school, class)',
    category: 'srd-query',
    inputSchema: 'QuerySpellsSchema',
    outputSchema: 'SpellQueryResult',
    requiresState: false,
    isPure: true,
    tags: ['srd', 'reference', 'spells', 'magic'],
    exampleUsage: 'query_spells({ level: 3, school: "evocation", className: "wizard" })',
  },
  {
    id: 'query_monsters',
    name: 'query_monsters',
    description: 'Query D&D 5e monsters with optional CR filter',
    category: 'srd-query',
    inputSchema: 'QueryMonstersSchema',
    outputSchema: 'MonsterQueryResult',
    requiresState: false,
    isPure: true,
    tags: ['srd', 'reference', 'monsters', 'creatures'],
    exampleUsage: 'query_monsters({ challengeRating: 5 })',
  },
  {
    id: 'query_conditions',
    name: 'query_conditions',
    description: 'Query D&D 5e status conditions (e.g., blinded, poisoned)',
    category: 'srd-query',
    inputSchema: 'QueryConditionsSchema',
    outputSchema: 'ConditionQueryResult',
    requiresState: false,
    isPure: true,
    tags: ['srd', 'reference', 'conditions', 'status'],
    exampleUsage: 'query_conditions({ conditionId: "poisoned" })',
  },
  {
    id: 'query_abilities',
    name: 'query_abilities',
    description: 'Get all six D&D 5e ability scores (STR, DEX, CON, INT, WIS, CHA)',
    category: 'srd-query',
    inputSchema: 'EmptySchema',
    outputSchema: 'AbilityQueryResult',
    requiresState: false,
    isPure: true,
    tags: ['srd', 'reference', 'abilities'],
    exampleUsage: 'query_abilities({})',
  },
  {
    id: 'query_skills',
    name: 'query_skills',
    description: 'Get all D&D 5e skills (e.g., Acrobatics, Perception, Stealth)',
    category: 'srd-query',
    inputSchema: 'EmptySchema',
    outputSchema: 'SkillQueryResult',
    requiresState: false,
    isPure: true,
    tags: ['srd', 'reference', 'skills'],
    exampleUsage: 'query_skills({})',
  },
  {
    id: 'query_equipment',
    name: 'query_equipment',
    description: 'Query D&D 5e equipment (weapons, armor, tools, adventuring gear)',
    category: 'srd-query',
    inputSchema: 'QueryEquipmentSchema',
    outputSchema: 'EquipmentQueryResult',
    requiresState: false,
    isPure: true,
    tags: ['srd', 'reference', 'equipment', 'items'],
    exampleUsage: 'query_equipment({ category: "Weapon" })',
  },
];

/**
 * State Query Tools (Read-Only Game State)
 */
export const STATE_QUERY_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'query_character_sheet',
    name: 'query_character_sheet',
    description: 'Get full character sheet (HP, AC, abilities, inventory, spells, conditions)',
    category: 'state-query',
    inputSchema: 'QueryCharacterSheetSchema',
    outputSchema: 'CharacterSheetResult',
    requiresState: true,
    isPure: true,
    tags: ['state', 'character', 'query'],
    exampleUsage: 'query_character_sheet({ characterName: "Thorin" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'query_combat_log',
    name: 'query_combat_log',
    description: 'Get recent combat log entries (attacks, damage, conditions)',
    category: 'state-query',
    inputSchema: 'QueryCombatLogSchema',
    outputSchema: 'CombatLogResult',
    requiresState: true,
    isPure: true,
    tags: ['state', 'combat', 'log', 'history'],
    exampleUsage: 'query_combat_log({ limit: 10 })',
    agentRestrictions: ['dm-agent', 'tactical-commander-agent'],
  },
  {
    id: 'query_tactical_grid',
    name: 'query_tactical_grid',
    description: 'Get current tactical grid with character positions and stats',
    category: 'state-query',
    inputSchema: 'QueryTacticalGridSchema',
    outputSchema: 'TacticalGridResult',
    requiresState: true,
    isPure: true,
    tags: ['state', 'combat', 'grid', 'tactical'],
    exampleUsage: 'query_tactical_grid({ includeEmpty: false })',
    agentRestrictions: ['dm-agent', 'tactical-commander-agent'],
  },
  {
    id: 'query_combat_status',
    name: 'query_combat_status',
    description: 'Get combat status (round, turn, active combatant, alive counts)',
    category: 'state-query',
    inputSchema: 'EmptySchema',
    outputSchema: 'CombatStatusResult',
    requiresState: true,
    isPure: true,
    tags: ['state', 'combat', 'status'],
    exampleUsage: 'query_combat_status({})',
    agentRestrictions: ['dm-agent', 'tactical-commander-agent'],
  },
];

/**
 * State Mutation Tools (Modify Game State)
 */
export const STATE_MUTATION_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'update_character_hp',
    name: 'update_character_hp',
    description: 'Update character HP (healing or damage). Positive = heal, negative = damage.',
    category: 'state-mutation',
    inputSchema: 'UpdateCharacterHPSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['state', 'character', 'hp', 'mutation'],
    exampleUsage: 'update_character_hp({ characterName: "Thorin", hpChange: -7, reason: "goblin attack" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'apply_condition',
    name: 'apply_condition',
    description: 'Apply a status condition to a character (e.g., poisoned, blinded, stunned)',
    category: 'state-mutation',
    inputSchema: 'ApplyConditionSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['state', 'character', 'condition', 'status', 'mutation'],
    exampleUsage: 'apply_condition({ characterName: "Thorin", condition: "poisoned", duration: "1 minute" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'remove_condition',
    name: 'remove_condition',
    description: 'Remove a status condition from a character',
    category: 'state-mutation',
    inputSchema: 'RemoveConditionSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['state', 'character', 'condition', 'mutation'],
    exampleUsage: 'remove_condition({ characterName: "Thorin", condition: "poisoned" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'update_inventory',
    name: 'update_inventory',
    description: 'Add or remove items from character inventory',
    category: 'state-mutation',
    inputSchema: 'UpdateInventorySchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['state', 'character', 'inventory', 'items', 'mutation'],
    exampleUsage:
      'update_inventory({ characterName: "Thorin", action: "add", itemName: "Healing Potion", quantity: 2 })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'grant_xp',
    name: 'grant_xp',
    description: 'Grant experience points to a character',
    category: 'state-mutation',
    inputSchema: 'GrantXPSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['state', 'character', 'xp', 'experience', 'mutation'],
    exampleUsage: 'grant_xp({ characterName: "Thorin", xp: 150, reason: "defeated goblin chief" })',
    agentRestrictions: ['dm-agent'],
  },
];

/**
 * DM Override Tools (Narrative Authority)
 */
export const DM_OVERRIDE_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'override_dice_roll',
    name: 'override_dice_roll',
    description: 'Override a dice roll for compelling narrative reasons (divine intervention, fate, prophecy)',
    category: 'dm-override',
    inputSchema: 'OverrideDiceRollSchema',
    outputSchema: 'OverrideResult',
    requiresState: true,
    isPure: false,
    tags: ['narrative', 'override', 'dice', 'fate', 'divine'],
    exampleUsage:
      'override_dice_roll({ characterName: "Thorin", rollType: "death save", originalResult: 8, overrideResult: 20, narrativeReason: "The goddess Torm intervenes, denying death" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'veto_tool_result',
    name: 'veto_tool_result',
    description: 'Cancel the effect of a tool call for lore reasons (divine shield, magic barrier, plot armor)',
    category: 'dm-override',
    inputSchema: 'VetoToolResultSchema',
    outputSchema: 'VetoResult',
    requiresState: true,
    isPure: false,
    tags: ['narrative', 'veto', 'protection', 'immunity'],
    exampleUsage:
      'veto_tool_result({ toolName: "update_character_hp", targetCharacter: "Thorin", narrativeReason: "Ancient dwarven ward absorbs the damage", alternativeOutcome: "The blade shatters on contact" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'apply_narrative_modifier',
    name: 'apply_narrative_modifier',
    description: 'Apply lore-based modifier (blessing, curse, prophecy effect, legendary boon)',
    category: 'dm-override',
    inputSchema: 'NarrativeModifierSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['narrative', 'blessing', 'curse', 'prophecy', 'modifier'],
    exampleUsage:
      'apply_narrative_modifier({ characterName: "Thorin", modifierType: "divine_favor", modifierValue: "+5 to all saves vs death", duration: "until prophecy fulfilled", loreSource: "Blessing of Torm" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'invoke_legendary_action',
    name: 'invoke_legendary_action',
    description: 'Trigger game-changing lore event that breaks normal rules (god manifests, prophecy activates)',
    category: 'dm-override',
    inputSchema: 'LegendaryActionSchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['narrative', 'legendary', 'climactic', 'world-altering'],
    exampleUsage:
      'invoke_legendary_action({ actionName: "The Prophecy Awakens", targets: ["Thorin"], loreDescription: "The ancient runes on your axe blaze with holy fire as Torm\'s spirit enters your body", mechanicalEffect: "Thorin gains +10 to all stats for 3 rounds" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'apply_rule_of_cool',
    name: 'apply_rule_of_cool',
    description: 'Allow awesome/creative action to succeed despite mechanics (reward player creativity)',
    category: 'dm-override',
    inputSchema: 'RuleOfCoolSchema',
    outputSchema: 'RuleOfCoolResult',
    requiresState: true,
    isPure: false,
    tags: ['narrative', 'cool', 'creative', 'dramatic'],
    exampleUsage:
      'apply_rule_of_cool({ playerAction: "Swing from chandelier to dropkick dragon", normalOutcome: "Acrobatics check DC 25, likely fail", coolOutcome: "You soar through the air and kick the dragon off the cliff!", whyItsCool: "Perfect use of environment + epic cinematic moment" })',
    agentRestrictions: ['dm-agent'],
  },
  {
    id: 'declare_narrative_immunity',
    name: 'declare_narrative_immunity',
    description: 'Grant story-based immunity to damage/effects (chosen one, divine protection, prophecy)',
    category: 'dm-override',
    inputSchema: 'NarrativeImmunitySchema',
    outputSchema: 'Command',
    requiresState: true,
    isPure: false,
    tags: ['narrative', 'immunity', 'protection', 'prophecy', 'chosen-one'],
    exampleUsage:
      'declare_narrative_immunity({ characterName: "Thorin", immuneToTypes: ["death", "demon attacks"], loreJustification: "Chosen of Torm, prophesied to survive until final battle", expiresWhen: "when prophecy fulfilled" })',
    agentRestrictions: ['dm-agent'],
  },
];

/**
 * Geospatial Tools (Map & Vision Awareness)
 */
export const GEOSPATIAL_TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'query_geospatial_context',
    name: 'query_geospatial_context',
    description:
      'Query map around character position - get biomes, features, structures, entities within radius (respects z-layer)',
    category: 'geospatial',
    inputSchema: 'QueryGeospatialContextSchema',
    outputSchema: 'GeospatialContextSchema',
    requiresState: true,
    isPure: true,
    tags: ['map', 'vision', 'awareness', '2d', 'spatial', 'geospatial', 'biome', 'features'],
    exampleUsage:
      'query_geospatial_context({ characterName: "Thorin", radius: 60, includeAbove: false, includeBelow: false })',
    agentRestrictions: ['dm-agent', 'tactical-commander-agent'],
  },
];

/**
 * Main tool registry
 */
export const TOOL_REGISTRY: Record<string, ToolMetadata> = {};

// Register all tools
[
  ...COMBAT_TOOLS_METADATA,
  ...TODO_TOOLS_METADATA,
  ...HUMAN_INTERACTION_TOOLS_METADATA,
  ...MEMORY_TOOLS_METADATA,
  ...SRD_QUERY_TOOLS_METADATA,
  ...STATE_QUERY_TOOLS_METADATA,
  ...STATE_MUTATION_TOOLS_METADATA,
  ...DM_OVERRIDE_TOOLS_METADATA,
  ...GEOSPATIAL_TOOLS_METADATA,
].forEach((tool) => {
  TOOL_REGISTRY[tool.id] = tool;
});

/**
 * Get all registered tools
 */
export function getAllTools(): ToolMetadata[] {
  return Object.values(TOOL_REGISTRY);
}

/**
 * Get tool by ID
 */
export function getToolById(id: string): ToolMetadata | undefined {
  return TOOL_REGISTRY[id];
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolMetadata['category']): ToolMetadata[] {
  return Object.values(TOOL_REGISTRY).filter((t) => t.category === category);
}

/**
 * Get tools available to specific agent
 */
export function getToolsForAgent(agentName: string): ToolMetadata[] {
  return Object.values(TOOL_REGISTRY).filter((t) => !t.agentRestrictions || t.agentRestrictions.includes(agentName));
}

/**
 * Get actual tool instances (for binding to model)
 */
export function getToolInstances(toolIds: string[]): unknown[] {
  const toolMap: Record<string, unknown> = {
    // Combat
    start_combat: startCombatTool,
    attack: attackTool,
    move: moveTool,
    end_turn: endTurnTool,
    end_combat: endCombatTool,
    // Planning
    create_todo: createTodoTool,
    update_todo: updateTodoTool,
    complete_todo: completeTodoTool,
    list_todos: listTodosTool,
    // Human interaction
    ask_human: askHumanTool,
    // Memory
    recall_memory: recallMemoryTool,
    store_memory: storeMemoryTool,
    // SRD queries
    query_races: queryRacesTool,
    query_classes: queryClassesTool,
    query_spells: querySpellsTool,
    query_monsters: queryMonstersTool,
    query_conditions: queryConditionsTool,
    query_abilities: queryAbilitiesTool,
    query_skills: querySkillsTool,
    query_equipment: queryEquipmentTool,
    // State queries
    query_character_sheet: queryCharacterSheetTool,
    query_combat_log: queryCombatLogTool,
    query_tactical_grid: queryTacticalGridTool,
    query_combat_status: queryCombatStatusTool,
    // State mutations
    update_character_hp: updateCharacterHPTool,
    apply_condition: applyConditionTool,
    remove_condition: removeConditionTool,
    update_inventory: updateInventoryTool,
    grant_xp: grantXPTool,
    // DM overrides
    override_dice_roll: overrideDiceRollTool,
    veto_tool_result: vetoToolResultTool,
    apply_narrative_modifier: applyNarrativeModifierTool,
    invoke_legendary_action: invokeLegendaryActionTool,
    apply_rule_of_cool: applyRuleOfCoolTool,
    declare_narrative_immunity: declareNarrativeImmunityTool,
    // Geospatial
    query_geospatial_context: queryGeospatialContextTool,
  };

  return toolIds.map((id) => toolMap[id]).filter(Boolean);
}
