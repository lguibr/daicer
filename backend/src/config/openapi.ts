/**
 * OpenAPI 3.0 configuration for DAICE backend API
 */

import type { Options } from 'swagger-jsdoc';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

/**
 * Common API response schema
 */
const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  meta: z.record(z.unknown()).optional(),
});

/**
 * API error response schema
 */
const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

/**
 * Room schema
 */
const RoomSchema = z.object({
  id: z.string(),
  code: z.string(),
  ownerId: z.string(),
  worldSettings: z
    .object({
      theme: z.string(),
      setting: z.string(),
      tone: z.string(),
      playerCount: z.number(),
      adventureLength: z.enum(['short', 'medium', 'epic']),
      difficulty: z.enum(['easy', 'medium', 'hard']),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Player schema
 */
const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  class: z.string(),
  race: z.string(),
  level: z.number(),
  hp: z.number(),
  maxHp: z.number(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
});

/**
 * User profile schema
 */
const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  createdAt: z.string(),
});

/**
 * Swagger JSDoc configuration
 */
export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DAICE API',
      version: '1.0.0',
      description:
        'Multiplayer D&D backend with Express, Socket.io, and Firebase. Powered by LangGraph for deterministic gameplay.',
      contact: {
        name: 'DAICE Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'http://localhost:3101',
        description: 'E2E testing server',
      },
      {
        url: 'https://api.daice.app',
        description: 'Production server (TBD)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase ID token obtained from Firebase Authentication',
        },
      },
      schemas: {
        ApiSuccessResponse:
          zodToJsonSchema(ApiSuccessResponseSchema, {
            name: 'ApiSuccessResponse',
            target: 'openApi3',
          }).definitions?.ApiSuccessResponse || {},
        ApiErrorResponse:
          zodToJsonSchema(ApiErrorResponseSchema, {
            name: 'ApiErrorResponse',
            target: 'openApi3',
          }).definitions?.ApiErrorResponse || {},
        Room:
          zodToJsonSchema(RoomSchema, {
            name: 'Room',
            target: 'openApi3',
          }).definitions?.Room || {},
        Player:
          zodToJsonSchema(PlayerSchema, {
            name: 'Player',
            target: 'openApi3',
          }).definitions?.Player || {},
        UserProfile:
          zodToJsonSchema(UserProfileSchema, {
            name: 'UserProfile',
            target: 'openApi3',
          }).definitions?.UserProfile || {},
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'No authentication token provided',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid request parameters',
                  details: {
                    field: 'error message',
                  },
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse',
              },
              example: {
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'An unexpected error occurred',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Rooms',
        description: 'Multiplayer room management',
      },
      {
        name: 'Game',
        description: 'Game lifecycle and turn processing',
      },
      {
        name: 'Users',
        description: 'User profile management',
      },
      {
        name: 'Characters',
        description: 'Character sheet CRUD',
      },
      {
        name: 'Spells',
        description: 'D&D 5e spell catalog',
      },
      {
        name: 'Game Data',
        description: 'Static SRD reference data',
      },
      {
        name: 'Assets',
        description: 'AI-generated assets (avatars, maps)',
      },
      {
        name: 'Equipment',
        description: 'D&D 5e equipment catalog',
      },
      {
        name: 'Tactical',
        description: 'Grid-based tactical combat',
      },
    ],
  },
  // Scan all API files for JSDoc annotations
  apis: ['./src/server.ts', './src/api/*.ts', './src/api/**/*.ts'],
};
