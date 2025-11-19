#!/usr/bin/env node
/**
 * Convert Postman Collection to OpenAPI 3.0 Specification
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionPath = path.join(__dirname, '../postman/daicer-api.postman_collection.json');
const outputPath = path.join(__dirname, '../openapi/daicer-api.openapi.yaml');

const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Build OpenAPI spec
const openapi = {
  openapi: '3.0.3',
  info: {
    title: collection.info.name,
    description: collection.info.description,
    version: '1.0.0',
    contact: {
      name: 'DAICE Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development (emulator-data)',
    },
    {
      url: 'http://localhost:3101',
      description: 'E2E Testing (emulator-data-e2e)',
    },
  ],
  tags: [],
  paths: {},
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID Token',
      },
    },
    schemas: {},
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
};

// Convert Postman items to OpenAPI paths
function convertItems(items, tagName) {
  if (!items) return;

  items.forEach((item) => {
    if (item.item) {
      // Folder - recurse
      const folderTag = { name: item.name, description: item.description || '' };
      openapi.tags.push(folderTag);
      convertItems(item.item, item.name);
    } else if (item.request) {
      // Request - convert to path
      const req = item.request;
      const method = req.method.toLowerCase();
      
      // Parse URL
      let pathStr = '';
      if (req.url && req.url.path) {
        pathStr = '/' + req.url.path.join('/');
        // Replace :param with {param}
        pathStr = pathStr.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
      }

      if (!openapi.paths[pathStr]) {
        openapi.paths[pathStr] = {};
      }

      const operation = {
        summary: item.name,
        description: req.description || '',
        tags: tagName ? [tagName] : [],
        operationId: item.name.replace(/\s+/g, '-').toLowerCase(),
        parameters: [],
        responses: {
          200: {
            description: 'Successful response',
          },
        },
      };

      // Auth
      if (req.auth && req.auth.type === 'noauth') {
        operation.security = [];
      }

      // Path parameters
      if (req.url && req.url.variable) {
        req.url.variable.forEach((v) => {
          operation.parameters.push({
            name: v.key,
            in: 'path',
            required: true,
            description: v.description || '',
            schema: {
              type: 'string',
              example: v.value || '',
            },
          });
        });
      }

      // Query parameters
      if (req.url && req.url.query) {
        req.url.query.forEach((q) => {
          operation.parameters.push({
            name: q.key,
            in: 'query',
            required: !q.disabled,
            description: q.description || '',
            schema: {
              type: 'string',
              example: q.value || '',
            },
          });
        });
      }

      // Request body
      if (req.body && req.body.mode === 'raw') {
        try {
          const exampleBody = JSON.parse(req.body.raw);
          operation.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: exampleBody,
                },
              },
            },
          };
        } catch (e) {
          // Not JSON
        }
      }

      openapi.paths[pathStr][method] = operation;
    }
  });
}

convertItems(collection.item);

// Ensure output dir exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write YAML
const yaml = toYAML(openapi, 0);
fs.writeFileSync(outputPath, yaml, 'utf8');

console.log(`✅ OpenAPI spec generated: ${outputPath}`);

// Simple YAML serializer
function toYAML(obj, indent) {
  const spaces = '  '.repeat(indent);
  let result = '';

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}- `;
        result += toYAML(item, indent + 1).trim() + '\n';
      } else {
        result += `${spaces}- ${escapeYAML(item)}\n`;
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        result += `${spaces}${key}:\n`;
        result += toYAML(value, indent + 1);
      } else {
        result += `${spaces}${key}: ${escapeYAML(value)}\n`;
      }
    });
  } else {
    result = escapeYAML(obj);
  }

  return result;
}

function escapeYAML(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  const str = value.toString();
  if (str.includes('\n') || str.includes(':') || str.includes('#')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}

