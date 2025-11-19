/**
 * LangGraph Studio Server
 * Exposes graphs via MCP protocol for LangGraph Studio debugging
 *
 * Run: yarn workspace @daicer/backend studio
 * Connect Studio to: http://localhost:3002
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeFirebase } from './config/firebase';
import { logger } from './utils/logger';
import { registerAssistantsRoutes } from './api/langgraph-studio/assistants';
import { registerMCPRoutes } from './api/langgraph-studio/mcp';
import { registerRegistryRoutes } from './api/langgraph-studio/registry';

// Load environment
const appRoot = process.cwd();
dotenv.config({ path: path.resolve(appRoot, '.env.local') });
dotenv.config({ path: path.resolve(appRoot, '../.env.local') });
dotenv.config({ path: path.resolve(appRoot, '.env') });

// Initialize Firebase
initializeFirebase();

const app = express();
const PORT = process.env.LANGGRAPH_STUDIO_PORT || 3002;

// Middleware
app.use(cors({ origin: '*' })); // Studio needs CORS
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'langgraph-studio',
    timestamp: new Date().toISOString(),
  });
});

// Server info
app.get('/info', (_req, res) => {
  res.json({
    version: '1.0.0',
    type: 'langgraph-server',
    server: 'daicer-langgraph-studio',
    config: {
      assistants: ['gameplay', 'character-creation'],
      features: ['streaming', 'checkpoints', 'registry'],
    },
  });
});

// Register route modules
registerAssistantsRoutes(app);
registerMCPRoutes(app);
registerRegistryRoutes(app);

// Start server
app.listen(PORT, () => {
  logger.info(`🎯 LangGraph Studio server running on port ${PORT}`);
  logger.info(`📊 Connect LangGraph Studio to: http://localhost:${PORT}`);
  logger.info(`🔍 Available endpoints: /assistants, /mcp/graphs, /mcp/registry`);
});
