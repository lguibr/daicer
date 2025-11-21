/**
 * Centralized Prompt Registry
 * All system prompts stored here with metadata for Studio discovery
 */

import { z } from 'zod';

/**
 * Schema for a registered prompt template
 */
export const PromptTemplateSchema = z.object({
  id: z.string().describe('Unique identifier for the prompt'),
  name: z.string().describe('Human-readable name'),
  description: z.string().describe('What this prompt does'),
  category: z.enum([
    'dm-narrative',
    'world-building',
    'combat',
    'character',
    'tactical',
    'agent-planning',
    'summarization',
  ]),
  template: z.string().describe('The actual prompt template with {{variable}} placeholders'),
  variables: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'array', 'object']),
      description: z.string(),
      required: z.boolean().default(true),
    })
  ),
  outputSchema: z.string().optional().describe('Name of the Zod schema this prompt produces'),
  tags: z.array(z.string()).default([]),
  version: z.string().default('1.0.0'),
  author: z.string().default('DAICE Team'),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * DM Narrative Turn Processing Prompt
 */
export const DM_TURN_PROCESSING_PROMPT: PromptTemplate = {
  id: 'dm-turn-processing-v2',
  name: 'DM Turn Processing',
  description: 'Main DM narrative generation for player actions with structured output',
  category: 'dm-narrative',
  template: `You are THE DUNGEON MASTER for a {{theme}} D&D 5e campaign.

**World Context:**
{{worldDescription}}

**Current World State:**
{{worldConditions}}

**Campaign Settings:**
- Theme: {{theme}}
- Setting: {{setting}}
- Tone: {{tone}}
- Difficulty: {{difficulty}}
- Language: {{language}}

**DM Style Settings:**
- Verbosity: {{verbosity}}/6 (0=terse, 6=extremely detailed)
- Detail: {{detail}}/6 (0=abstract, 6=granular)
- Engagement: {{engagement}}/6 (0=passive, 6=interactive)
- Narrative: {{narrative}}/6 (0=mechanical, 6=cinematic)

**Current Party:**
{{playerList}}

**Active Creatures:**
{{creatureList}}

**Conversation History:**
{{conversationHistory}}

**Current Turn Actions:**
{{currentActions}}

{{relevantRules}}

**Your Task:**
As the Dungeon Master, narrate what happens this turn. You MUST:

1. Generate an 'overall_summary' describing events that all players witness
2. Create personalized 'player_perspectives' for each character with unique sensory details from their POV
3. Use the provided tools (roll_dice, attack_roll, saving_throw, etc.) to determine outcomes fairly
4. Apply D&D 5e rules accurately
5. Match the requested DM style settings
6. Respond entirely in {{language}}
7. Consider the current World State conditions when narrating (e.g., if Political Climate is Tense, NPCs may be more suspicious)
8. **Be the Guide:** Don't just simulate a world; GUIDE the players. Give them clear calls to action if they are lost.
9. **Weave Lore:** Every description should reinforce the world's history and current threats.
10. **High Stakes:** Constantly remind players of the risks.

CRITICAL: Return ONLY structured JSON conforming to TurnResponseSchema. No prose outside the JSON.`,
  variables: [
    { name: 'theme', type: 'string', description: 'Campaign theme (e.g., "High Fantasy")', required: true },
    { name: 'worldDescription', type: 'string', description: 'Full world description markdown', required: true },
    { name: 'worldConditions', type: 'string', description: 'Current dynamic world conditions', required: false },
    { name: 'setting', type: 'string', description: 'Physical setting', required: true },
    { name: 'tone', type: 'string', description: 'Campaign tone', required: true },
    { name: 'difficulty', type: 'string', description: 'Challenge level', required: true },
    { name: 'language', type: 'string', description: 'Response language (en/es/pt-BR)', required: true },
    { name: 'verbosity', type: 'number', description: 'Verbosity level 0-6', required: false },
    { name: 'detail', type: 'number', description: 'Detail level 0-6', required: false },
    { name: 'engagement', type: 'number', description: 'Engagement level 0-6', required: false },
    { name: 'narrative', type: 'number', description: 'Narrative style 0-6', required: false },
    { name: 'playerList', type: 'string', description: 'Formatted list of players', required: true },
    { name: 'creatureList', type: 'string', description: 'Formatted list of creatures', required: false },
    { name: 'conversationHistory', type: 'string', description: 'Previous messages', required: true },
    { name: 'currentActions', type: 'string', description: 'Player actions this turn', required: true },
    { name: 'relevantRules', type: 'string', description: 'RAG-retrieved D&D rules', required: false },
  ],
  outputSchema: 'TurnResponseSchema',
  tags: ['dm', 'narrative', 'turn-processing', 'structured-output'],
  version: '2.0.0',
  author: 'DAICE Team',
  createdAt: '2025-11-14T00:00:00Z',
  updatedAt: '2025-11-14T00:00:00Z',
};

/**
 * World Generation Prompt
 */
export const WORLD_GENERATION_PROMPT: PromptTemplate = {
  id: 'world-generation-v1',
  name: 'World Generation',
  description: 'Generates rich campaign world descriptions with structured metadata',
  category: 'world-building',
  template: `You are a world-class Dungeon Master creating immersive RPG campaign backgrounds.

**Campaign Requirements:**
- Player Count: {{playerCount}}
- Adventure Length: {{adventureLength}}
- Difficulty: {{difficulty}}
- Theme: {{theme}}
- Setting: {{setting}}
- Tone: {{tone}}
- Starting Level: {{startingLevel}}
- Language: {{language}}

**Output Requirements:**
Create a compelling world description with:
1. A catchy campaign title
2. Rich 2-3 paragraph description (use markdown)
3. One-sentence atmosphere summary
4. 2-4 key locations with brief descriptions
5. Primary threats or antagonistic forces
6. **Call to Adventure**: Explicitly state why the party is together and what their immediate goal is.
7. **Risks & Stakes**: Clearly define what happens if they fail.
8. 2-3 adventure hooks to engage players
9. Metadata (difficulty, theme, setting)

Return ONLY structured JSON conforming to WorldDescriptionSchema.`,
  variables: [
    { name: 'playerCount', type: 'number', description: 'Number of players', required: true },
    {
      name: 'adventureLength',
      type: 'string',
      description: 'Campaign length (oneshot/short/medium/long/epic)',
      required: true,
    },
    { name: 'difficulty', type: 'string', description: 'Challenge level', required: true },
    { name: 'theme', type: 'string', description: 'Campaign theme', required: true },
    { name: 'setting', type: 'string', description: 'World setting', required: true },
    { name: 'tone', type: 'string', description: 'Narrative tone', required: true },
    { name: 'startingLevel', type: 'number', description: 'Character starting level', required: true },
    { name: 'language', type: 'string', description: 'Output language', required: true },
  ],
  outputSchema: 'WorldDescriptionSchema',
  tags: ['world-building', 'campaign', 'structured-output'],
  version: '1.0.0',
  author: 'DAICE Team',
  createdAt: '2025-11-14T00:00:00Z',
  updatedAt: '2025-11-14T00:00:00Z',
};

/**
 * Conversation Summarization Prompt
 */
export const CONVERSATION_SUMMARY_PROMPT: PromptTemplate = {
  id: 'conversation-summary-v1',
  name: 'Conversation Summarization',
  description: 'Summarizes long conversation history into structured key events and threads',
  category: 'summarization',
  template: `You are an expert summarizer for D&D RPG game sessions.

**Current Message Count:** {{messageCount}}
**Time Span:** {{timeSpan}}

**Full Conversation History:**
{{conversationHistory}}

**Your Task:**
Create a concise, structured summary focusing on:
1. Overall narrative progression (2-3 paragraphs)
2. Key events or turning points (list format)
3. Important character decisions/actions
4. Discoveries, encounters, or plot twists
5. Unresolved plot threads or open questions
6. Current character states (wounds, conditions, resources)

Return ONLY structured JSON conforming to ConversationSummarySchema in {{language}}.`,
  variables: [
    { name: 'messageCount', type: 'number', description: 'Total message count', required: true },
    { name: 'timeSpan', type: 'string', description: 'In-game time span', required: false },
    { name: 'conversationHistory', type: 'string', description: 'Full message history', required: true },
    { name: 'language', type: 'string', description: 'Output language', required: true },
  ],
  outputSchema: 'ConversationSummarySchema',
  tags: ['summarization', 'context-management', 'structured-output'],
  version: '1.0.0',
  author: 'DAICE Team',
  createdAt: '2025-11-14T00:00:00Z',
  updatedAt: '2025-11-14T00:00:00Z',
};

/**
 * Tactical Command Parser Prompt
 */
export const TACTICAL_COMMAND_PARSER_PROMPT: PromptTemplate = {
  id: 'tactical-command-parser-v1',
  name: 'Tactical Command Parser',
  description: 'Parses natural language combat commands into structured actions',
  category: 'tactical',
  template: `You are a D&D 5e combat command parser.

**Current Encounter State:**
Round: {{round}}
Active Unit: {{activeUnit}}

**Units in Combat:**
{{unitList}}

**Available Spells:**
{{spellList}}

**Player Command:**
"{{command}}"

**Your Task:**
Parse this command into structured action data:
1. Identify the actor (who is performing the action)
2. Determine the intent (what they want to do)
3. Identify the target (who/what/where they're targeting)
4. Extract spell names and modifiers

**Rules:**
- Match unit names case-insensitively
- Handle partial name matches
- Set IDs to null if not found
- Use descriptors like "nearest enemy" when position unclear
- Extract modifiers (carefully, recklessly, stealthily)
- Set confidence 0.0-1.0 based on clarity
- Note ambiguities

Return ONLY structured JSON conforming to ParsedCommandSchema.`,
  variables: [
    { name: 'round', type: 'number', description: 'Current combat round', required: true },
    { name: 'activeUnit', type: 'string', description: 'Current active unit name', required: false },
    { name: 'unitList', type: 'string', description: 'Formatted list of units', required: true },
    { name: 'spellList', type: 'string', description: 'Available spells', required: false },
    { name: 'command', type: 'string', description: 'Player natural language command', required: true },
  ],
  outputSchema: 'ParsedCommandSchema',
  tags: ['tactical', 'combat', 'parsing', 'structured-output'],
  version: '1.0.0',
  author: 'DAICE Team',
  createdAt: '2025-11-14T00:00:00Z',
  updatedAt: '2025-11-14T00:00:00Z',
};

/**
 * Agent Planning Prompt (for todo middleware)
 */
export const AGENT_PLANNING_PROMPT: PromptTemplate = {
  id: 'agent-planning-v1',
  name: 'Agent Execution Planning',
  description: 'Helps agent create structured execution plan before complex operations',
  category: 'agent-planning',
  template: `You are an AI agent planning a complex operation in a D&D 5e game.

**Current Context:**
{{context}}

**Operation Type:** {{operationType}}
**Expected Complexity:** {{complexity}}

**Your Task:**
Before executing this operation, create a structured execution plan by breaking it into discrete steps.

Use the create_todo tool to create a checklist:
1. Identify all sub-tasks required
2. Determine order of execution
3. Note any dependencies
4. Flag potential blockers or ambiguities
5. Create a todo for each atomic step

If you need clarification from the human user, use the ask_human tool to request it.

**Guidelines:**
- Each todo should be atomic (one clear action)
- Include reasoning for why each step is needed
- Set appropriate priority (low/medium/high)
- Note estimated complexity
- Flag if human input may be needed

Think step-by-step and be thorough.`,
  variables: [
    { name: 'context', type: 'string', description: 'Current game context', required: true },
    {
      name: 'operationType',
      type: 'string',
      description: 'Type of operation (combat/exploration/social)',
      required: true,
    },
    { name: 'complexity', type: 'string', description: 'Expected complexity level', required: false },
  ],
  outputSchema: 'AgentPlanSchema',
  tags: ['agent', 'planning', 'todo-middleware', 'human-in-loop'],
  version: '1.0.0',
  author: 'DAICE Team',
  createdAt: '2025-11-14T00:00:00Z',
  updatedAt: '2025-11-14T00:00:00Z',
};

/**
 * Main prompt registry - all prompts indexed here
 */
export const PROMPT_REGISTRY: Record<string, PromptTemplate> = {
  'dm-turn-processing-v2': DM_TURN_PROCESSING_PROMPT,
  'world-generation-v1': WORLD_GENERATION_PROMPT,
  'conversation-summary-v1': CONVERSATION_SUMMARY_PROMPT,
  'tactical-command-parser-v1': TACTICAL_COMMAND_PARSER_PROMPT,
  'agent-planning-v1': AGENT_PLANNING_PROMPT,
};

/**
 * Get all registered prompts
 */
export function getAllPrompts(): PromptTemplate[] {
  return Object.values(PROMPT_REGISTRY);
}

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): PromptTemplate | undefined {
  return PROMPT_REGISTRY[id];
}

/**
 * Get prompts by category
 */
export function getPromptsByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return Object.values(PROMPT_REGISTRY).filter((p) => p.category === category);
}

/**
 * Get prompts by tag
 */
export function getPromptsByTag(tag: string): PromptTemplate[] {
  return Object.values(PROMPT_REGISTRY).filter((p) => p.tags.includes(tag));
}

/**
 * Search prompts by name or description
 */
export function searchPrompts(query: string): PromptTemplate[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(PROMPT_REGISTRY).filter(
    (p) => p.name.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery)
  );
}
