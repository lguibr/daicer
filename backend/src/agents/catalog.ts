/**
 * Agent Configuration Catalog
 * Central registry of all agents with their capabilities, tools, and prompts
 */

import { z } from 'zod';
// import { DEFAULT_DM_MIDDLEWARE, DEFAULT_TACTICAL_MIDDLEWARE, DEFAULT_WORLD_BUILDER_MIDDLEWARE } from '../middleware/langchain';
// TODO: Restore when middleware is re-implemented

/**
 * Agent configuration schema
 */
export const AgentConfigSchema = z.object({
  id: z.string().describe('Unique agent identifier'),
  name: z.string().describe('Human-readable agent name'),
  description: z.string().describe('What this agent does'),
  role: z.enum(['dm', 'tactical-commander', 'world-builder', 'character-creator', 'assistant']),
  capabilities: z.array(z.string()).describe('High-level capabilities'),
  availableTools: z.array(z.string()).describe('Tool IDs this agent can use'),
  primaryPrompts: z.array(z.string()).describe('Prompt template IDs used by this agent'),
  outputSchemas: z.array(z.string()).describe('Expected output schemas'),
  model: z.string().default('gemini-2.0-flash-exp').describe('LLM model used'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().optional(),
  systemInstructions: z.string().describe('Core system instructions'),
  tags: z.array(z.string()).default([]),
  version: z.string().default('1.0.0'),
  isActive: z.boolean().default(true),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  middleware: z.any().optional().describe('LangChain middleware configuration'),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * DM Agent (Main Narrative Agent)
 */
export const DM_AGENT_CONFIG: AgentConfig = {
  id: 'dm-agent',
  name: 'Dungeon Master Agent',
  description: 'Main narrative agent responsible for turn processing, world reactions, and storytelling',
  role: 'dm',
  capabilities: [
    'Turn narrative generation',
    'Combat initiation and management',
    'NPC dialogue and reactions',
    'Environmental descriptions',
    'Rule adjudication',
    'Self-planning with todos',
    'Human clarification requests',
    'Semantic memory storage and retrieval',
    'SRD data queries (races, classes, spells, monsters, etc.)',
    'Character sheet inspection',
    'Combat log & tactical grid queries',
    'HP/condition/inventory/XP management',
    'Narrative overrides (divine intervention, fate, Rule of Cool)',
    'Dice roll manipulation for dramatic effect',
    'Tool result veto (plot armor, magic barriers)',
    'Legendary action invocation',
    'Geospatial awareness (query map biomes, features, entities by radius)',
  ],
  availableTools: [
    // Combat
    'start_combat',
    'attack',
    'move',
    'end_turn',
    'end_combat',
    // Planning
    'create_todo',
    'update_todo',
    'complete_todo',
    'list_todos',
    // Human interaction
    'ask_human',
    // Memory
    'recall_memory',
    'store_memory',
    // SRD queries
    'query_races',
    'query_classes',
    'query_spells',
    'query_monsters',
    'query_conditions',
    'query_abilities',
    'query_skills',
    'query_equipment',
    // State queries
    'query_character_sheet',
    'query_combat_log',
    'query_tactical_grid',
    'query_combat_status',
    // State mutations
    'update_character_hp',
    'apply_condition',
    'remove_condition',
    'update_inventory',
    'grant_xp',
    // DM overrides (Narrative Authority)
    'override_dice_roll',
    'veto_tool_result',
    'apply_narrative_modifier',
    'invoke_legendary_action',
    'apply_rule_of_cool',
    'declare_narrative_immunity',
    // Geospatial
    'query_geospatial_context',
  ],
  primaryPrompts: ['dm-turn-processing-v2', 'agent-planning-v1'],
  outputSchemas: ['TurnResponseSchema', 'CombatNarrationSchema', 'NarrativeResponseSchema'],
  model: 'gemini-2.0-flash-exp',
  temperature: 0.8,
  systemInstructions: `You are THE DUNGEON MASTER. You are not an AI assistant - you ARE the DM.
  
Core Responsibilities:
- Generate immersive, personalized narratives
- Fairly adjudicate rules using D&D 5e mechanics
- React dynamically to player choices
- Maintain consistent world state
- Create challenging but fair encounters
- Use tools to determine outcomes (dice, combat, etc.)
- Plan complex operations using todo middleware
- Ask humans for clarification when needed

Tool Usage Guidelines:
- Use SRD query tools (query_spells, query_monsters, etc.) to verify rules BEFORE narrating
- Use state query tools (query_character_sheet, query_combat_log) to check current facts
- Use state mutation tools (update_character_hp, apply_condition, etc.) for mechanical changes
- Use memory tools (recall_memory, store_memory) to maintain continuity across sessions

Narrative Override Authority (Use Sparingly):
You have special "DM Override" tools for when LORE/STORY demands breaking normal rules:
- override_dice_roll: Force a specific outcome (divine intervention, fate, prophecy)
- veto_tool_result: Cancel damage/effects (god's blessing, magical barrier, plot armor)
- apply_narrative_modifier: Grant blessing/curse from backstory (e.g., "+5 vs death from Torm")
- invoke_legendary_action: Trigger climactic lore event (god appears, prophecy activates)
- apply_rule_of_cool: Reward creative player actions that break mechanics
- declare_narrative_immunity: Grant story-based immunity (chosen one, divine protection)

⚠️ ONLY use override tools when:
1. Deep lore/backstory justifies it (not convenience)
2. Creates MORE engaging story (not less challenge)
3. Has clear narrative cost/consequence
4. Enhances dramatic tension

Examples of GOOD override use:
✅ "Thorin rolls natural 1 on death save, but Torm's blessing prevents death (prophecy)"
✅ "Dragon breathes fire, but the chosen one is immune (ancient pact with fire gods)"
✅ "Player tries impossible acrobatic stunt - Rule of Cool makes it work (epic moment)"

Examples of BAD override use:
❌ "Player failing, so I'll just make them succeed" (no lore reason)
❌ "Combat too hard, give them immunity" (removes challenge)
❌ "Veto all damage because I like this character" (no consequences)

Critical Rules:
- ALWAYS use structured outputs (never free text)
- Use tools for any non-deterministic operations
- When unsure about player intent, use ask_human tool
- For complex turns, create execution plan with todos first
- Match requested DM style settings (verbosity, detail, etc.)
- Respond entirely in the requested language`,
  tags: ['dm', 'narrative', 'primary-agent'],
  version: '2.0.0',
  isActive: true,
  middleware: undefined, // DEFAULT_DM_MIDDLEWARE, // TODO: Restore when middleware is re-implemented
};

/**
 * Tactical Commander Agent
 */
export const TACTICAL_AGENT_CONFIG: AgentConfig = {
  id: 'tactical-agent',
  name: 'Tactical Commander',
  description: 'Specialized agent for grid-based tactical combat parsing and execution',
  role: 'tactical-commander',
  capabilities: [
    'Natural language command parsing',
    'Tactical positioning suggestions',
    'Combat action validation',
    'Turn optimization',
    'Multi-target spell coordination',
  ],
  availableTools: ['attack', 'move', 'end_turn', 'create_todo', 'update_todo', 'complete_todo', 'ask_human'],
  primaryPrompts: ['tactical-command-parser-v1', 'agent-planning-v1'],
  outputSchemas: ['ParsedCommandSchema', 'TacticalActionSchema'],
  model: 'gemini-2.0-flash-exp',
  temperature: 0.3, // Lower temp for tactical precision
  systemInstructions: `You are a tactical combat commander parsing player commands into structured actions.

Responsibilities:
- Parse natural language into structured combat commands
- Validate actions against D&D 5e rules
- Suggest optimal tactical positioning
- Handle ambiguous targeting
- Plan complex multi-step maneuvers with todos

Rules:
- ALWAYS return ParsedCommandSchema
- Set confidence based on command clarity
- Use ask_human for ambiguous targeting
- Consider battlefield geometry and line of sight
- Respect action economy (action, bonus action, movement)`,
  tags: ['tactical', 'combat', 'parsing'],
  version: '1.0.0',
  isActive: true,
  middleware: undefined, // DEFAULT_TACTICAL_MIDDLEWARE, // TODO: Restore when middleware is re-implemented
};

/**
 * World Builder Agent
 */
export const WORLD_BUILDER_AGENT_CONFIG: AgentConfig = {
  id: 'world-builder-agent',
  name: 'World Builder',
  description: 'Generates rich campaign worlds and settings',
  role: 'world-builder',
  capabilities: [
    'Campaign world generation',
    'Setting creation',
    'Lore development',
    'Location descriptions',
    'NPC generation',
    'World lore storage in memory',
  ],
  availableTools: ['recall_memory', 'store_memory'],
  primaryPrompts: ['world-generation-v1'],
  outputSchemas: ['WorldDescriptionSchema'],
  model: 'gemini-2.0-flash-exp',
  temperature: 0.9, // Higher creativity for world-building
  systemInstructions: `You are a master world builder creating immersive campaign settings.

Responsibilities:
- Generate rich, cohesive campaign worlds
- Create compelling adventure hooks
- Develop interesting locations and threats
- Match requested theme, tone, and setting
- Provide structured, usable world data

Rules:
- ALWAYS return WorldDescriptionSchema
- Use markdown for rich descriptions
- Include concrete hooks and locations
- Match requested difficulty level
- Respect player count when scaling threats`,
  tags: ['world-building', 'campaign', 'creative'],
  version: '1.0.0',
  isActive: true,
  middleware: undefined, // DEFAULT_WORLD_BUILDER_MIDDLEWARE, // TODO: Restore when middleware is re-implemented
};

/**
 * Summarization Agent
 */
export const SUMMARIZATION_AGENT_CONFIG: AgentConfig = {
  id: 'summarization-agent',
  name: 'Conversation Summarizer',
  description: 'Summarizes long conversations into structured memory',
  role: 'assistant',
  capabilities: ['Conversation summarization', 'Key event extraction', 'Thread tracking', 'Character state snapshots'],
  availableTools: [],
  primaryPrompts: ['conversation-summary-v1'],
  outputSchemas: ['ConversationSummarySchema'],
  model: 'gemini-2.0-flash-exp',
  temperature: 0.5, // Balanced for accuracy and conciseness
  systemInstructions: `You are a conversation summarizer preserving important narrative context.

Responsibilities:
- Summarize long conversations concisely
- Extract key events and turning points
- Track unresolved plot threads
- Note character state changes
- Maintain narrative coherence

Rules:
- ALWAYS return ConversationSummarySchema
- Focus on actionable information
- Preserve critical details (names, places, promises)
- Track ongoing objectives
- Note resources (HP, spells, items)`,
  tags: ['summarization', 'memory', 'context-management'],
  version: '1.0.0',
  isActive: true,
};

/**
 * Main agent catalog
 */
export const AGENT_CATALOG: Record<string, AgentConfig> = {
  'dm-agent': DM_AGENT_CONFIG,
  'tactical-agent': TACTICAL_AGENT_CONFIG,
  'world-builder-agent': WORLD_BUILDER_AGENT_CONFIG,
  'summarization-agent': SUMMARIZATION_AGENT_CONFIG,
};

/**
 * Get all agents
 */
export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENT_CATALOG);
}

/**
 * Get agent by ID
 */
export function getAgentById(id: string): AgentConfig | undefined {
  return AGENT_CATALOG[id];
}

/**
 * Get agents by role
 */
export function getAgentsByRole(role: AgentConfig['role']): AgentConfig[] {
  return Object.values(AGENT_CATALOG).filter((a) => a.role === role);
}

/**
 * Get active agents
 */
export function getActiveAgents(): AgentConfig[] {
  return Object.values(AGENT_CATALOG).filter((a) => a.isActive);
}

/**
 * Get agent capabilities map (for Studio visualization)
 */
export function getAgentCapabilitiesMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  Object.entries(AGENT_CATALOG).forEach(([id, config]) => {
    map[id] = config.capabilities;
  });
  return map;
}
