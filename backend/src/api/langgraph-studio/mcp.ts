/**
 * LangGraph Studio - MCP Protocol Routes
 * Graph invocation, streaming, and state management
 */

import type { Router } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '@/utils/logger';
import { getGameplayGraph } from '@/graph/gameplay-graph';

export function registerMCPRoutes(app: Router): void {
  /**
   * GET /mcp/graphs
   * List available graphs
   */
  app.get('/mcp/graphs', async (_req, res) => {
    try {
      res.json([
        {
          graph_id: 'gameplay',
          name: 'Gameplay Graph',
          description: 'Main narrative gameplay loop',
        },
      ]);
    } catch (error) {
      logger.error('[MCP] Error listing graphs:', error);
      res.status(500).json({ error: 'Failed to list graphs' });
    }
  });

  /**
   * GET /mcp/graphs/:graphId/schema
   * Get graph state schema
   */
  app.get('/mcp/graphs/:graphId/schema', async (req, res) => {
    try {
      const { graphId } = req.params;

      if (graphId !== 'gameplay') {
        res.status(404).json({ error: 'Graph not found' });
        return;
      }

      res.json({
        title: 'GameplayState',
        type: 'object',
        properties: {
          roomId: { type: 'string' },
          players: { type: 'array' },
          messages: { type: 'array' },
        },
      });
    } catch (error) {
      logger.error('[MCP] Error getting schema:', error);
      res.status(500).json({ error: 'Failed to get schema' });
    }
  });

  /**
   * POST /mcp/graphs/:graphId/invoke
   * Invoke graph execution
   */
  app.post('/mcp/graphs/:graphId/invoke', async (req, res) => {
    try {
      const { graphId } = req.params;
      const { input, config } = req.body;

      if (graphId !== 'gameplay') {
        res.status(404).json({ error: 'Graph not found' });
        return;
      }

      const graph = getGameplayGraph();
      const threadId = config?.configurable?.thread_id || randomUUID();
      const result = await graph.invoke(input, { configurable: { thread_id: threadId } });

      res.json({ output: result, metadata: { threadId } });
    } catch (error) {
      logger.error('[MCP] Error invoking graph:', error);
      res.status(500).json({ error: 'Graph invocation failed' });
    }
  });

  /**
   * POST /mcp/graphs/:graphId/stream
   * Stream graph execution
   */
  app.post('/mcp/graphs/:graphId/stream', async (req, res) => {
    try {
      const { graphId } = req.params;
      const { input, config } = req.body;

      if (graphId !== 'gameplay') {
        res.status(404).json({ error: 'Graph not found' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const graph = getGameplayGraph();
      const threadId = config?.configurable?.thread_id || randomUUID();

      const stream = await graph.stream(input, { configurable: { thread_id: threadId }, streamMode: 'values' });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      logger.error('[MCP] Error streaming graph:', error);
      res.status(500).json({ error: 'Graph streaming failed' });
    }
  });

  /**
   * GET /mcp/graphs/:graphId/state/:threadId
   * Get graph state for thread
   */
  app.get('/mcp/graphs/:graphId/state/:threadId', async (req, res) => {
    try {
      const { graphId, threadId } = req.params;

      if (graphId !== 'gameplay') {
        res.status(404).json({ error: 'Graph not found' });
        return;
      }

      const graph = getGameplayGraph();
      const state = await graph.getState({ configurable: { thread_id: threadId } });

      res.json({ state: state.values, next: state.next });
    } catch (error) {
      logger.error('[MCP] Error getting state:', error);
      res.status(500).json({ error: 'Failed to get state' });
    }
  });
}
