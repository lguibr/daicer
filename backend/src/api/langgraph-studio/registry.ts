/**
 * LangGraph Studio - Registry Routes
 * Prompts, Tools, and Agents catalog endpoints
 */

import type { Router } from 'express';
import { logger } from '@/utils/logger';
import { getAllPrompts, getPromptById, getPromptsByCategory } from '@/prompts/registry';
import { getAllTools, getToolById, getToolsByCategory, getToolsForAgent } from '@/tools/registry';
import { getAllAgents, getAgentById, getAgentsByRole } from '@/agents/catalog';

export function registerRegistryRoutes(app: Router): void {
  // ============================================================================
  // PROMPTS REGISTRY
  // ============================================================================

  /**
   * GET /mcp/registry/prompts
   * List all prompts
   */
  app.get('/mcp/registry/prompts', (_req, res) => {
    try {
      const prompts = getAllPrompts();
      res.json({ prompts });
    } catch (error) {
      logger.error('[Registry] Error listing prompts:', error);
      res.status(500).json({ error: 'Failed to list prompts' });
    }
  });

  /**
   * GET /mcp/registry/prompts/:id
   * Get single prompt by ID
   */
  app.get('/mcp/registry/prompts/:id', (req, res) => {
    try {
      const prompt = getPromptById(req.params.id);
      if (!prompt) {
        res.status(404).json({ error: 'Prompt not found' });
        return;
      }
      res.json({ prompt });
    } catch (error) {
      logger.error('[Registry] Error getting prompt:', error);
      res.status(500).json({ error: 'Failed to get prompt' });
    }
  });

  /**
   * GET /mcp/registry/prompts/category/:category
   * Get prompts by category
   */
  app.get('/mcp/registry/prompts/category/:category', (req, res) => {
    try {
      const prompts = getPromptsByCategory(req.params.category);
      res.json({ prompts });
    } catch (error) {
      logger.error('[Registry] Error getting prompts by category:', error);
      res.status(500).json({ error: 'Failed to get prompts' });
    }
  });

  // ============================================================================
  // TOOLS REGISTRY
  // ============================================================================

  /**
   * GET /mcp/registry/tools
   * List all tools
   */
  app.get('/mcp/registry/tools', (_req, res) => {
    try {
      const tools = getAllTools();
      res.json({ tools });
    } catch (error) {
      logger.error('[Registry] Error listing tools:', error);
      res.status(500).json({ error: 'Failed to list tools' });
    }
  });

  /**
   * GET /mcp/registry/tools/:id
   * Get single tool by ID
   */
  app.get('/mcp/registry/tools/:id', (req, res) => {
    try {
      const tool = getToolById(req.params.id);
      if (!tool) {
        res.status(404).json({ error: 'Tool not found' });
        return;
      }
      res.json({ tool });
    } catch (error) {
      logger.error('[Registry] Error getting tool:', error);
      res.status(500).json({ error: 'Failed to get tool' });
    }
  });

  /**
   * GET /mcp/registry/tools/category/:category
   * Get tools by category
   */
  app.get('/mcp/registry/tools/category/:category', (req, res) => {
    try {
      const tools = getToolsByCategory(req.params.category);
      res.json({ tools });
    } catch (error) {
      logger.error('[Registry] Error getting tools by category:', error);
      res.status(500).json({ error: 'Failed to get tools' });
    }
  });

  /**
   * GET /mcp/registry/tools/agent/:agentId
   * Get tools for specific agent
   */
  app.get('/mcp/registry/tools/agent/:agentId', (req, res) => {
    try {
      const tools = getToolsForAgent(req.params.agentId);
      res.json({ tools });
    } catch (error) {
      logger.error('[Registry] Error getting tools for agent:', error);
      res.status(500).json({ error: 'Failed to get tools' });
    }
  });

  // ============================================================================
  // AGENTS REGISTRY
  // ============================================================================

  /**
   * GET /mcp/registry/agents
   * List all agents
   */
  app.get('/mcp/registry/agents', (_req, res) => {
    try {
      const agents = getAllAgents();
      res.json({ agents });
    } catch (error) {
      logger.error('[Registry] Error listing agents:', error);
      res.status(500).json({ error: 'Failed to list agents' });
    }
  });

  /**
   * GET /mcp/registry/agents/:id
   * Get single agent by ID
   */
  app.get('/mcp/registry/agents/:id', (req, res) => {
    try {
      const agent = getAgentById(req.params.id);
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }
      res.json({ agent });
    } catch (error) {
      logger.error('[Registry] Error getting agent:', error);
      res.status(500).json({ error: 'Failed to get agent' });
    }
  });

  /**
   * GET /mcp/registry/agents/role/:role
   * Get agents by role
   */
  app.get('/mcp/registry/agents/role/:role', (req, res) => {
    try {
      const agents = getAgentsByRole(req.params.role);
      res.json({ agents });
    } catch (error) {
      logger.error('[Registry] Error getting agents by role:', error);
      res.status(500).json({ error: 'Failed to get agents' });
    }
  });

  /**
   * GET /mcp/registry
   * Registry overview
   */
  app.get('/mcp/registry', (_req, res) => {
    try {
      res.json({
        prompts: getAllPrompts().length,
        tools: getAllTools().length,
        agents: getAllAgents().length,
      });
    } catch (error) {
      logger.error('[Registry] Error getting registry overview:', error);
      res.status(500).json({ error: 'Failed to get registry' });
    }
  });
}
