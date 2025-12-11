/**
 * LangGraph Studio - Assistants API (Part 1)
 * Lists available graphs and provides basic metadata
 */

import type { Router } from 'express';
// import { zodToJsonSchema } from 'zod-to-json-schema';
import { logger } from '@/utils/logger';
import { getGameplayGraph } from '@/graph/gameplay-graph';
import { createGridGenerationGraph } from '@/graph/grid-generation-graph';
import { createDMStoryGraph } from '@/graph/world/dm-story';
import { createWorldConfigGraph } from '@/graph/world/world-config';
import { createCharacterSetupGraph } from '@/graph/character/setup';
import { GameplayStateSchema, CharacterCreationStateSchema } from '@/graph/state';
import { DMStoryStateSchema } from '@daicer/shared/graph-states/dm-story-state';
import { WorldConfigStateSchema } from '@daicer/shared/graph-states/world-config-state';
import { CharacterStateSchema } from '@daicer/shared/graph-states/character-state';

export function registerAssistantsRoutes(app: Router): void {
  /**
   * GET /assistants
   * List available graphs (called "assistants" in Studio)
   */
  app.get('/assistants', async (_req, res) => {
    try {
      res.json([
        {
          assistant_id: 'gameplay',
          graph_id: 'gameplay',
          name: 'Gameplay Graph',
          description: 'Main narrative gameplay loop with turn processing and combat coordination',
          metadata: {
            nodes: ['combat_check', 'turn_processing'],
            created_at: new Date().toISOString(),
          },
          config: { configurable: {} },
        },
        {
          assistant_id: 'session-initialization',
          graph_id: 'session-initialization',
          name: 'Session Initialization',
          description: 'Root coordinator graph (deprecated - use dm-story + world-config + character-setup)',
          metadata: {
            deprecated: true,
            nodes: ['world_generation', 'character_setup'],
            created_at: new Date().toISOString(),
          },
          config: { configurable: {} },
        },
        {
          assistant_id: 'dm-story',
          graph_id: 'dm-story',
          name: 'DM Story Graph',
          description: 'Section 1: Generate world history, conditions, and narrative seed',
          metadata: {
            nodes: ['init_world', 'generate_conditions', 'generate_history_period', 'synthesize_history'],
            section: 1,
            created_at: new Date().toISOString(),
          },
          config: { configurable: {} },
        },
        {
          assistant_id: 'world-config',
          graph_id: 'world-config',
          name: 'World Config Graph',
          description: 'Section 2: Generate physical world (structures, roads, terrain, chunks)',
          metadata: {
            nodes: [
              'place_structures',
              'materialize_structures',
              'generate_roads',
              'collapse_terrain',
              'pregenerate_chunks',
              'grid_generation',
              'generate_lore',
            ],
            section: 2,
            created_at: new Date().toISOString(),
          },
          config: { configurable: {} },
        },
        {
          assistant_id: 'character-setup',
          graph_id: 'character-setup',
          name: 'Character Setup Graph',
          description: 'Section 3: Generate character opening narratives and equipment bonuses',
          metadata: {
            nodes: ['character_openings', 'equipment_management'],
            section: 3,
            created_at: new Date().toISOString(),
          },
          config: { configurable: {} },
        },
        {
          assistant_id: 'grid-generation',
          graph_id: 'grid-generation',
          name: 'Grid Generation Graph',
          description: 'Deterministic infinite grid world generation with biomes, structures, caverns',
          metadata: {
            nodes: [
              'init_grid',
              'biome_map',
              'core_chunks',
              'wfc_structures',
              'ca_caverns',
              'bsp_rooms',
              'features',
              'persist_chunks',
            ],
            created_at: new Date().toISOString(),
          },
          config: { configurable: {} },
        },
      ]);
    } catch (error) {
      logger.error('[Studio] Error listing assistants:', error);
      res.status(500).json({ error: 'Failed to list assistants' });
    }
  });

  /**
   * POST /assistants/search
   * Search/filter assistants (required by Studio)
   */
  app.post('/assistants/search', async (req, res) => {
    try {
      const { limit = 10, offset = 0 } = req.body;

      const allAssistants = [
        {
          assistant_id: 'gameplay',
          graph_id: 'gameplay',
          name: 'Gameplay Graph',
          description: 'Main narrative gameplay loop',
          metadata: { nodes: 2, section: 'gameplay' },
          config: { configurable: {} },
        },
        {
          assistant_id: 'dm-story',
          graph_id: 'dm-story',
          name: 'DM Story Graph',
          description: 'Section 1: World history',
          metadata: { nodes: 4, section: 1 },
          config: { configurable: {} },
        },
        {
          assistant_id: 'world-config',
          graph_id: 'world-config',
          name: 'World Config Graph',
          description: 'Section 2: Physical world',
          metadata: { nodes: 7, section: 2 },
          config: { configurable: {} },
        },
        {
          assistant_id: 'character-setup',
          graph_id: 'character-setup',
          name: 'Character Setup Graph',
          description: 'Section 3: Character narratives',
          metadata: { nodes: 2, section: 3 },
          config: { configurable: {} },
        },
        {
          assistant_id: 'grid-generation',
          graph_id: 'grid-generation',
          name: 'Grid Generation Graph',
          description: 'Infinite grid world generation',
          metadata: { nodes: 8 },
          config: { configurable: {} },
        },
        {
          assistant_id: 'session-initialization',
          graph_id: 'session-initialization',
          name: 'Session Initialization (deprecated)',
          description: 'Use dm-story + world-config + character-setup',
          metadata: { deprecated: true },
          config: { configurable: {} },
        },
      ];

      const filtered = allAssistants.slice(offset, offset + limit);

      res.json(filtered);
    } catch (error) {
      logger.error('[Studio] Error searching assistants:', error);
      res.status(500).json({ error: 'Failed to search assistants' });
    }
  });

  /**
   * GET /assistants/:assistant_id
   * Get single assistant metadata
   */
  app.get('/assistants/:assistant_id', async (req, res) => {
    try {
      const { assistant_id } = req.params;

      const assistants: Record<string, unknown> = {
        gameplay: {
          assistant_id: 'gameplay',
          graph_id: 'gameplay',
          name: 'Gameplay Graph',
          description: 'Turn-based gameplay with DM responses',
          metadata: { nodes: 2 },
          config: { configurable: {} },
        },
        'dm-story': {
          assistant_id: 'dm-story',
          graph_id: 'dm-story',
          name: 'DM Story Graph',
          description: 'Section 1: World history',
          metadata: { nodes: 4, section: 1 },
          config: { configurable: {} },
        },
        'world-config': {
          assistant_id: 'world-config',
          graph_id: 'world-config',
          name: 'World Config Graph',
          description: 'Section 2: Physical world',
          metadata: { nodes: 7, section: 2 },
          config: { configurable: {} },
        },
        'character-setup': {
          assistant_id: 'character-setup',
          graph_id: 'character-setup',
          name: 'Character Setup Graph',
          description: 'Section 3: Character narratives',
          metadata: { nodes: 2, section: 3 },
          config: { configurable: {} },
        },
        'grid-generation': {
          assistant_id: 'grid-generation',
          graph_id: 'grid-generation',
          name: 'Grid Generation Graph',
          description: 'Infinite grid world',
          metadata: { nodes: 8 },
          config: { configurable: {} },
        },
        'session-initialization': {
          assistant_id: 'session-initialization',
          graph_id: 'session-initialization',
          name: 'Session Initialization (deprecated)',
          description: 'Use dm-story + world-config + character-setup',
          metadata: { deprecated: true },
          config: { configurable: {} },
        },
      };

      const assistant = assistants[assistant_id];

      if (!assistant) {
        res.status(404).json({ error: 'Assistant not found' });
        return;
      }

      res.json(assistant);
    } catch (error) {
      logger.error('[Studio] Error getting assistant:', error);
      res.status(500).json({ error: 'Failed to get assistant' });
    }
  });

  /**
   * GET /assistants/:assistant_id/schemas
   * Get state schema for an assistant in JSON Schema format
   */
  app.get('/assistants/:assistant_id/schemas', async (req, res) => {
    try {
      const { assistant_id } = req.params;

      const schemas: Record<string, unknown> = {
        gameplay: {}, // zodToJsonSchema(GameplayStateSchema, { name: 'GameplayState' }),
        'dm-story': {}, // zodToJsonSchema(DMStoryStateSchema, { name: 'DMStoryState' }),
        'world-config': {}, // zodToJsonSchema(WorldConfigStateSchema, { name: 'WorldConfigState' }),
        'character-setup': {}, // zodToJsonSchema(CharacterStateSchema, { name: 'CharacterState' }),
        'grid-generation': {}, // zodToJsonSchema(CharacterCreationStateSchema, { name: 'GridGenerationState' }),
        'session-initialization': {}, // zodToJsonSchema(CharacterCreationStateSchema, { name: 'SessionInitializationState' }),
      };

      const schema = schemas[assistant_id];

      if (!schema) {
        res.status(404).json({ error: 'Assistant not found' });
        return;
      }

      res.json(schema);
    } catch (error) {
      logger.error('[Studio] Error getting schemas:', error);
      res.status(500).json({ error: 'Failed to get schemas' });
    }
  });

  /**
   * GET /assistants/:assistant_id/subgraphs
   * Get subgraph hierarchy for an assistant
   */
  app.get('/assistants/:assistant_id/subgraphs', async (req, res) => {
    try {
      const { assistant_id } = req.params;

      const subgraphsMap: Record<string, unknown[]> = {
        gameplay: [],
        'dm-story': [],
        'world-config': [],
        'character-setup': [],
        'grid-generation': [],
        'session-initialization': [],
      };

      const subgraphs = subgraphsMap[assistant_id];

      if (subgraphs === undefined) {
        res.status(404).json({ error: 'Assistant not found' });
        return;
      }

      res.json(subgraphs);
    } catch (error) {
      logger.error('[Studio] Error getting subgraphs:', error);
      res.status(500).json({ error: 'Failed to get subgraphs' });
    }
  });

  /**
   * GET /assistants/:assistant_id/graph
   * Get graph topology (nodes, edges, entry/exit points)
   */
  app.get('/assistants/:assistant_id/graph', async (req, res) => {
    try {
      const { assistant_id } = req.params;
      // const _xray = req.query.xray === 'true';

      // Helper to convert graph.getGraph() to Studio format
      const convertGraphData = (graph: any, _schema: any) => {
        const graphData = graph.getGraph();
        const nodesArray = Object.entries(graphData.nodes).map(([id, node]) => ({
          id,
          name: id,
          metadata: (node as any).metadata || {},
        }));
        const edgesArray = graphData.edges.map((edge: any) => ({
          source: edge.source,
          target: edge.target,
          data: edge.data || null,
        }));
        return {
          nodes: nodesArray,
          edges: edgesArray,
          entry_point: '__start__',
          // ...(xray && { config_schema: zodToJsonSchema(schema) }),
        };
      };

      switch (assistant_id) {
        case 'gameplay':
          res.json(convertGraphData(getGameplayGraph(), GameplayStateSchema));
          break;

        case 'dm-story':
          res.json(convertGraphData(createDMStoryGraph(), DMStoryStateSchema));
          break;

        case 'world-config':
          res.json(convertGraphData(createWorldConfigGraph(), WorldConfigStateSchema));
          break;

        case 'character-setup':
          res.json(convertGraphData(createCharacterSetupGraph(), CharacterStateSchema));
          break;

        case 'grid-generation':
          res.json(convertGraphData(createGridGenerationGraph(), CharacterCreationStateSchema));
          break;

        case 'session-initialization':
          res.json({
            nodes: [
              { id: '__start__', name: '__start__', metadata: {} },
              { id: 'dm-story', name: 'DM Story (Section 1)', metadata: { section: 1, type: 'subgraph' } },
              { id: 'world-config', name: 'World Config (Section 2)', metadata: { section: 2, type: 'subgraph' } },
              {
                id: 'character-setup',
                name: 'Character Setup (Section 3)',
                metadata: { section: 3, type: 'subgraph' },
              },
              { id: '__end__', name: '__end__', metadata: {} },
            ],
            edges: [
              { source: '__start__', target: 'dm-story', data: null },
              { source: 'dm-story', target: 'world-config', data: null },
              { source: 'world-config', target: 'character-setup', data: null },
              { source: 'character-setup', target: '__end__', data: null },
            ],
            entry_point: '__start__',
            // ...(xray && { config_schema: zodToJsonSchema(CharacterCreationStateSchema) }),
          });
          break;

        default:
          res.status(404).json({ error: 'Assistant not found' });
      }
    } catch (error) {
      logger.error('[Studio] Error getting graph:', error);
      res.status(500).json({ error: 'Failed to get graph' });
    }
  });
}
