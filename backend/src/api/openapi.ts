/**
 * OpenAPI documentation endpoints
 * Serves Swagger UI at /api-docs and spec JSON at /api-docs/spec
 */

import { Router, type Request, type Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from '@/config/openapi';
import { logger } from '@/utils/logger';

const router = Router();

// Generate OpenAPI specification
let swaggerSpec: object;

try {
  swaggerSpec = swaggerJsdoc(swaggerOptions);
  logger.info('OpenAPI spec generated successfully');
} catch (error) {
  logger.error('Failed to generate OpenAPI spec:', error);
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'DAICE API',
      version: '1.0.0',
      description: 'Error generating OpenAPI spec',
    },
    paths: {},
  };
}

// Serve Swagger UI
const swaggerUiHandler = swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DAICE API Documentation',
});

router.use('/', swaggerUi.serve as any);
router.get('/', swaggerUiHandler as any);

// Serve raw OpenAPI spec as JSON
router.get('/spec', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve OpenAPI spec as YAML (optional)
router.get('/spec.yaml', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/yaml');
  // Convert to YAML if needed, or just send JSON
  res.send(JSON.stringify(swaggerSpec, null, 2));
});

export default router;
