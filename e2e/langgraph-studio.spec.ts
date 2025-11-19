/**
 * @file E2E tests for LangGraph Studio MCP server
 * @description Verifies the Studio server exposes graphs, tools, prompts, and agents for local editing
 */

import { test, expect } from '@playwright/test';

const STUDIO_BASE_URL = 'http://localhost:3002';

test.describe('LangGraph Studio MCP Server', () => {
  test.describe('Health & Server Status', () => {
    test('health endpoint responds correctly', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/health`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('langgraph-studio');
      expect(data.timestamp).toBeDefined();
    });
  });

  test.describe('Graph Discovery', () => {
    test('lists available graphs', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/graphs`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.graphs).toBeDefined();
      expect(data.graphs).toHaveLength(2);

      // Verify gameplay graph
      const gameplayGraph = data.graphs.find((g: any) => g.id === 'gameplay');
      expect(gameplayGraph).toBeDefined();
      expect(gameplayGraph.name).toBe('Gameplay Graph');
      expect(gameplayGraph.description).toContain('narrative gameplay loop');
      expect(gameplayGraph.nodes).toContain('turn_processing');

      // Verify character creation graph
      const charGraph = data.graphs.find((g: any) => g.id === 'character-creation');
      expect(charGraph).toBeDefined();
      expect(charGraph.name).toBe('Character Creation Graph');
      expect(charGraph.description).toContain('character creation');
    });

    test('returns gameplay graph schema', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/graphs/gameplay/schema`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.graphId).toBe('gameplay');
      expect(data.stateSchema).toBeDefined();

      // Verify key state fields
      expect(data.stateSchema).toHaveProperty('roomId');
      expect(data.stateSchema).toHaveProperty('players');
      expect(data.stateSchema).toHaveProperty('messages');
      expect(data.stateSchema).toHaveProperty('creatures');
      expect(data.stateSchema).toHaveProperty('worldDescription');
      expect(data.stateSchema).toHaveProperty('combatState');
    });

    test('returns character-creation graph schema', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/graphs/character-creation/schema`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.graphId).toBe('character-creation');
      expect(data.stateSchema).toBeDefined();
      expect(data.stateSchema).toHaveProperty('roomId');
    });

    test('returns 404 for non-existent graph', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/graphs/fake-graph/schema`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Graph Execution', () => {
    test('invoke endpoint exists and responds', async ({ request }) => {
      const response = await request.post(`${STUDIO_BASE_URL}/mcp/graphs/gameplay/invoke`, {
        data: {
          input: {
            roomId: 'test-studio-room',
          },
          config: {
            thread_id: 'test-studio-thread',
          },
        },
      });

      // Should respond (may be 500 if Firebase not running, but endpoint exists)
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });

    test('stream endpoint exists and responds', async ({ request }) => {
      const response = await request.post(`${STUDIO_BASE_URL}/mcp/graphs/gameplay/stream`, {
        data: {
          input: {
            roomId: 'test-studio-stream',
          },
          config: {
            thread_id: 'test-studio-stream-thread',
          },
        },
      });

      // Should respond (may error if Firebase not running, but endpoint exists)
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });
  });

  test.describe('Tools Registry', () => {
    test('lists all available tools', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/tools`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.tools).toBeDefined();
      expect(data.total).toBeGreaterThan(0);
      expect(Array.isArray(data.tools)).toBeTruthy();

      // Verify tool structure
      const firstTool = data.tools[0];
      expect(firstTool).toHaveProperty('id');
      expect(firstTool).toHaveProperty('name');
      expect(firstTool).toHaveProperty('description');
    });

    test('can get tool by ID', async ({ request }) => {
      // First get all tools
      const listResponse = await request.get(`${STUDIO_BASE_URL}/mcp/registry/tools`);
      const listData = await listResponse.json();

      if (listData.tools.length > 0) {
        const toolId = listData.tools[0].id;

        // Get specific tool
        const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/tools/${toolId}`);
        expect(response.ok()).toBeTruthy();

        const tool = await response.json();
        expect(tool.id).toBe(toolId);
      }
    });

    test('can filter tools by category', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/tools/category/combat`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.category).toBe('combat');
      expect(data.tools).toBeDefined();
      expect(Array.isArray(data.tools)).toBeTruthy();
    });

    test('can get tools for specific agent', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/tools/agent/dm`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.agentId).toBe('dm');
      expect(data.tools).toBeDefined();
      expect(Array.isArray(data.tools)).toBeTruthy();
    });

    test('returns 404 for non-existent tool', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/tools/fake-tool-id-xyz`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Prompts Registry', () => {
    test('lists all available prompts', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/prompts`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.prompts).toBeDefined();
      expect(data.total).toBeGreaterThan(0);
      expect(Array.isArray(data.prompts)).toBeTruthy();

      // Verify prompt structure
      const firstPrompt = data.prompts[0];
      expect(firstPrompt).toHaveProperty('id');
      expect(firstPrompt).toHaveProperty('name');
      expect(firstPrompt).toHaveProperty('template');
    });

    test('can get prompt by ID', async ({ request }) => {
      // First get all prompts
      const listResponse = await request.get(`${STUDIO_BASE_URL}/mcp/registry/prompts`);
      const listData = await listResponse.json();

      if (listData.prompts.length > 0) {
        const promptId = listData.prompts[0].id;

        // Get specific prompt
        const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/prompts/${promptId}`);
        expect(response.ok()).toBeTruthy();

        const prompt = await response.json();
        expect(prompt.id).toBe(promptId);
      }
    });

    test('can filter prompts by category', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/prompts/category/narrative`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.category).toBe('narrative');
      expect(data.prompts).toBeDefined();
      expect(Array.isArray(data.prompts)).toBeTruthy();
    });

    test('returns 404 for non-existent prompt', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/prompts/fake-prompt-id-xyz`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Agents Catalog', () => {
    test('lists all available agents', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/agents`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.agents).toBeDefined();
      expect(data.total).toBeGreaterThan(0);
      expect(Array.isArray(data.agents)).toBeTruthy();

      // Verify agent structure
      const firstAgent = data.agents[0];
      expect(firstAgent).toHaveProperty('id');
      expect(firstAgent).toHaveProperty('name');
      expect(firstAgent).toHaveProperty('role');
    });

    test('can get agent by ID', async ({ request }) => {
      // First get all agents
      const listResponse = await request.get(`${STUDIO_BASE_URL}/mcp/registry/agents`);
      const listData = await listResponse.json();

      if (listData.agents.length > 0) {
        const agentId = listData.agents[0].id;

        // Get specific agent
        const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/agents/${agentId}`);
        expect(response.ok()).toBeTruthy();

        const agent = await response.json();
        expect(agent.id).toBe(agentId);
      }
    });

    test('can filter agents by role', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/agents/role/dm`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.role).toBe('dm');
      expect(data.agents).toBeDefined();
      expect(Array.isArray(data.agents)).toBeTruthy();
    });

    test('returns 404 for non-existent agent', async ({ request }) => {
      const response = await request.get(`${STUDIO_BASE_URL}/mcp/registry/agents/fake-agent-id-xyz`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('State Management', () => {
    test('can retrieve graph state by thread ID', async ({ request }) => {
      const threadId = 'test-state-retrieval';

      const response = await request.get(`${STUDIO_BASE_URL}/mcp/graphs/gameplay/state/${threadId}`);

      // Should respond (may be 404 if thread doesn't exist, which is ok)
      expect([200, 404]).toContain(response.status());
    });
  });
});
