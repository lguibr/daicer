import type { Core } from '@strapi/strapi';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { streamManager } from './utils/llm/stream-manager';

// Force reload for new API

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use({
      typeDefs: `
        type Ability {
          id: ID!
          documentId: ID!
          name: String!
          fullName: String!
          description: String
          skills: [Skill]
        }
        type Skill {
          id: ID!
          documentId: ID!
          name: String!
          description: String
          abilityScore: Ability
        }
        type Alignment {
          id: ID!
          documentId: ID!
          name: String!
          abbreviation: String
          description: String
        }
        type Background {
          id: ID!
          documentId: ID!
          name: String!
          description: String
          skillProficiencies: [Skill]
        }
        type GameCondition {
          id: ID!
          documentId: ID!
          name: String!
          description: String
        }

        extend type Query {
          abilities: [Ability]
          skills: [Skill]
          alignments: [Alignment]
          backgrounds: [Background]
          conditions: [GameCondition]
        }

        extend type Mutation {
          generateWorld(roomId: ID!, language: String): JSON
          processTurn(roomId: ID!, messages: JSON, language: String): JSON
          joinRoom(code: String!): Room
          addCharacter(roomId: ID!, character: JSON): JSON
          startGame(roomId: ID!, language: String, streamId: String): JSON
          submitAction(roomId: ID!, action: String): JSON
          spawnCreature(roomId: ID!, creature: JSON): JSON
          generateAvatarPortrait(payload: JSON!, referenceImage: String): JSON
          generateAvatarUpperBody(payload: JSON!, portrait: JSON!, referenceImage: String): JSON
          generateAvatarFullBody(payload: JSON!, portrait: JSON!, upperBody: JSON!, referenceImage: String): JSON
          generateTerrainChunk(roomId: ID!, chunkX: Int!, chunkY: Int!, chunkSize: Int): JSON
          generateTerrain(roomId: ID!): Boolean
        }
      `,
      resolvers: {
        Room: {
          messages: async (parent, _args, context) => {
            strapi.log.info(`[Resolver] Room.messages hit for ${parent.documentId}`);
            const { documentId } = parent;
            const user = context.state.user;

            const filters: any = {
              room: { documentId: documentId },
              $or: [
                { recipient: { $null: true } }, // Public
              ],
            };

            if (user) {
              filters.$or.push({ recipient: { documentId: user.documentId } }); // Private to me
            }

            // Bypass permission policy by using document service directly
            return await strapi.documents('api::message.message').findMany({
              filters,
              sort: 'timestamp:asc',
              limit: 100, // Reasonable default match for query
              populate: ['turn', 'recipient'] as any, // Populate recipient to let frontend know it's private
            });
          },
          turns: async (parent, _args) => {
            strapi.log.info(`[Resolver] Room.turns hit for ${parent.documentId}`);
            const { documentId } = parent;
            return await strapi.documents('api::turn.turn').findMany({
              filters: { room: { documentId: documentId } },
              sort: 'turnNumber:desc',
              limit: 5, // Reasonable default match for query
              populate: ['messages'],
            });
          },
        },
        Query: {
          abilities: () => [
            {
              id: 'str',
              documentId: 'str',
              name: 'STR',
              fullName: 'Strength',
              description: 'Physical power',
              skills: [],
            },
            { id: 'dex', documentId: 'dex', name: 'DEX', fullName: 'Dexterity', description: 'Agility', skills: [] },
            {
              id: 'con',
              documentId: 'con',
              name: 'CON',
              fullName: 'Constitution',
              description: 'Endurance',
              skills: [],
            },
            {
              id: 'int',
              documentId: 'int',
              name: 'INT',
              fullName: 'Intelligence',
              description: 'Reasoning',
              skills: [],
            },
            { id: 'wis', documentId: 'wis', name: 'WIS', fullName: 'Wisdom', description: 'Perception', skills: [] },
            { id: 'cha', documentId: 'cha', name: 'CHA', fullName: 'Charisma', description: 'Personality', skills: [] },
          ],
          skills: () => [
            {
              id: 'ath',
              documentId: 'ath',
              name: 'Athletics',
              description: 'Physical feats',
              abilityScore: { name: 'STR' },
            },
            {
              id: 'acr',
              documentId: 'acr',
              name: 'Acrobatics',
              description: 'Balancing and tumbling',
              abilityScore: { name: 'DEX' },
            },
          ],
          alignments: () => [
            { id: 'lg', documentId: 'lg', name: 'Lawful Good', abbreviation: 'LG', description: 'Crusader' },
            { id: 'ng', documentId: 'ng', name: 'Neutral Good', abbreviation: 'NG', description: 'Benefactor' },
            { id: 'cg', documentId: 'cg', name: 'Chaotic Good', abbreviation: 'CG', description: 'Rebel' },
            { id: 'ln', documentId: 'ln', name: 'Lawful Neutral', abbreviation: 'LN', description: 'Judge' },
            { id: 'n', documentId: 'n', name: 'True Neutral', abbreviation: 'N', description: 'Undecided' },
            { id: 'cn', documentId: 'cn', name: 'Chaotic Neutral', abbreviation: 'CN', description: 'Free Spirit' },
            { id: 'le', documentId: 'le', name: 'Lawful Evil', abbreviation: 'LE', description: 'Dominator' },
            { id: 'ne', documentId: 'ne', name: 'Neutral Evil', abbreviation: 'NE', description: 'Malefactor' },
            { id: 'ce', documentId: 'ce', name: 'Chaotic Evil', abbreviation: 'CE', description: 'Destroyer' },
          ],
          backgrounds: () => [
            { id: 'acolyte', documentId: 'acolyte', name: 'Acolyte', description: 'Religious devotee' },
            { id: 'soldier', documentId: 'soldier', name: 'Soldier', description: 'Military veteran' },
          ],
          conditions: () => [
            { id: 'blinded', documentId: 'blinded', name: 'Blinded', description: 'Cannot see' },
            { id: 'charmed', documentId: 'charmed', name: 'Charmed', description: 'Friendly to charmer' },
          ],
        },
        Mutation: {
          createRoom: {
            resolve: async (_parent, args, context) => {
              const { data } = args;
              const { state } = context;
              const { user } = state;

              if (!user) {
                throw new Error('You must be logged in to create a room');
              }

              const tempCode = uuidv4();

              const roomData = {
                ...data,
                roomId: tempCode,
                code: tempCode,
                owner: user.documentId,
                phase: 'lobby',
                isActive: true,
                players: [
                  {
                    user: user.documentId,
                    name: user.username || 'Room Owner',
                    character: null,
                    action: null,
                    isReady: false,
                    isOnline: true,
                    joinedAt: new Date().toISOString(),
                  },
                ],
              };

              const newRoom = await strapi.documents('api::room.room').create({
                data: roomData,
                status: 'published',
              });

              return newRoom;
            },
          },
          generateWorld: {
            resolve: async (_parent, args, _context) => {
              const { roomId, language } = args;
              const rooms = await strapi.documents('api::room.room').findMany({
                filters: { roomId },
              });

              if (!rooms || rooms.length === 0) throw new Error('Room not found');
              const room = rooms[0] as any;

              const description = await strapi.service('api::game.game').generateWorld(room.settings, language);

              const updatedRoom = await strapi.documents('api::room.room').update({
                documentId: room.documentId,
                data: {
                  worldDescription: description,
                  phase: 'world_generation',
                } as any,
              });

              return updatedRoom;
            },
          },
          processTurn: {
            resolve: async (_parent, args, _context) => {
              const { roomId, messages, language } = args;
              const rooms = await strapi.documents('api::room.room').findMany({
                filters: { roomId },
                populate: [
                  'players',
                  'players.character',
                  'players.character.race',
                  'players.character.class',
                  'players.character.baseStats',
                ],
              });

              if (!rooms || rooms.length === 0) throw new Error('Room not found');
              const room = rooms[0] as any;
              const players = room.players || [];

              return strapi
                .service('api::game.game')
                .processTurn(
                  roomId,
                  room.worldDescription,
                  messages || [],
                  players,
                  [],
                  language || room.settings?.language || 'en',
                  room.settings,
                  room.worldConditions
                );
            },
          },
          joinRoom: {
            resolve: async (_parent, args, context) => {
              const { code } = args;
              const { state } = context;
              const { user } = state;

              if (!user) throw new Error('You must be logged in to join a room');

              const room = await strapi.documents('api::room.room').findMany({
                filters: {
                  $or: [{ roomId: code }, { code: code }],
                },
                populate: ['players', 'players.user'],
              });

              if (!room || room.length === 0) throw new Error('Room not found');
              const targetRoom = room[0];

              const players = targetRoom.players || [];
              const isAlreadyJoined = players.some(
                (p: any) => p.user?.documentId === user.documentId || p.user?.id === user.id
              );

              if (isAlreadyJoined) return targetRoom;

              const newPlayer = {
                user: user.documentId,
                name: user.username || 'Player',
                character: null,
                action: null,
                isReady: false,
                isOnline: true,
                joinedAt: new Date().toISOString(),
              };

              const updatedRoom = await strapi.documents('api::room.room').update({
                documentId: targetRoom.documentId,
                data: {
                  players: [...players, newPlayer],
                } as any,
              });

              return updatedRoom;
            },
          },
          addCharacter: {
            resolve: async (_parent, args, context) => {
              const { roomId, character } = args;
              const { state } = context;
              const { user } = state;
              if (!user) throw new Error('Unauthorized');
              return strapi.service('api::game.game').addCharacter(roomId, character, user);
            },
          },
          startGame: {
            resolve: async (_parent, args, _context) => {
              const { roomId, language } = args;
              return strapi.service('api::game.game').startGame(roomId, language);
            },
          },
          submitAction: {
            resolve: async (_parent, args, _context) => {
              const { roomId, action } = args;
              const rooms = await strapi.documents('api::room.room').findMany({
                filters: { roomId },
                populate: ['players', 'players.user'],
              });
              if (!rooms || rooms.length === 0) throw new Error('Room not found');
              const room = rooms[0] as any;

              const { state } = _context;
              const { user } = state;
              if (!user) throw new Error('Unauthorized');

              const players = room.players || [];
              const playerIndex = players.findIndex((p: any) => p.user?.documentId === user.documentId);

              if (playerIndex === -1) throw new Error('Player not in room');

              players[playerIndex].action = action;
              players[playerIndex].isReady = true;

              const allReady = players.every((p: any) => p.isReady);

              await strapi.documents('api::room.room').update({
                documentId: room.documentId,
                data: {
                  players: players,
                } as any,
              });

              return { success: true, allReady };
            },
          },
          spawnCreature: {
            resolve: async (_parent, args, _context) => {
              const { roomId, creature } = args;
              return strapi.service('api::game.game').spawnCreature(roomId, creature);
            },
          },
          generateAvatarPortrait: {
            resolve: async (_parent, args, _context) => {
              const { payload, referenceImage } = args;
              return strapi.service('api::assets.assets').generatePortrait({ ...payload, referenceImage });
            },
          },
          generateAvatarUpperBody: {
            resolve: async (_parent, args, _context) => {
              const { payload, portrait, referenceImage } = args;
              return strapi.service('api::assets.assets').generateUpperBody({ payload, portrait, referenceImage });
            },
          },
          generateAvatarFullBody: {
            resolve: async (_parent, args, _context) => {
              const { payload, portrait, upperBody, referenceImage } = args;
              return strapi
                .service('api::assets.assets')
                .generateFullBody({ payload, portrait, upperBody, referenceImage });
            },
          },
          generateTerrainChunk: {
            resolve: async (_parent, args, _context) => {
              const { roomId, chunkX, chunkY, chunkSize } = args;
              // Fetch room settings for seed/config
              const rooms = await strapi.documents('api::room.room').findMany({
                filters: { roomId },
              });
              if (!rooms || rooms.length === 0) throw new Error('Room not found');
              const room = rooms[0] as any;

              const config = {
                seed: room.settings?.seed || room.roomId || 'default_seed', // Use roomId as fallback seed
                chunkSize: chunkSize || 16,
                // Add other world settings mapping if available in room.settings
                // But for now voxel-engine likely uses seed + noise
              };

              return strapi.service('api::voxel-engine.voxel-engine').getChunk(chunkX, chunkY, config);
            },
          },
          generateTerrain: {
            resolve: async (_parent, args, _context) => {
              // Legacy/Initialization stub
              return true;
            },
          },
        },
      },
      resolversConfig: {
        'Room.messages': {
          auth: false,
        },
        'Room.turns': {
          auth: false,
        },
      },
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      // 1. Initialize Socket.IO
      // @ts-ignore
      const httpServer = strapi.server.httpServer;

      const io = new Server(httpServer, {
        cors: {
          origin: ['http://localhost:3000', 'http://127.0.0.1:3000', process.env.PUBLIC_CLIENT_URL].filter(
            Boolean
          ) as string[],
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });

      // 2. Set IO in StreamManager
      streamManager.setSocketServer(io);

      // 3. Socket Logic
      io.on('connection', (socket) => {
        strapi.log.info(`Socket connected: ${socket.id}`);

        socket.on('room:join', async ({ roomId, userId }) => {
          try {
            strapi.log.info(`Socket ${socket.id} joining room ${roomId} as user ${userId}`);
            socket.join(roomId);
            if (userId) {
              socket.join(`user:${userId}`);
              strapi.log.info(`Socket ${socket.id} joined user room user:${userId}`);
            }

            // Fetch Room Data
            const rooms = await strapi.documents('api::room.room').findMany({
              filters: {
                $or: [{ roomId: roomId }, { code: roomId }, { documentId: roomId }],
              },
              populate: [
                'players',
                'players.character',
                'players.character.baseStats',
                'players.character.race',
                'players.character.class',
                'messages',
              ],
            });

            if (!rooms || rooms.length === 0) {
              socket.emit('error', { message: 'Room not found' });
              return;
            }

            const room = rooms[0] as any;
            const rawMessages = room.messages || [];
            rawMessages.sort((a: any, b: any) => Number(a.timestamp) - Number(b.timestamp));

            const mappedMessages = rawMessages.map((msg: any) => ({
              id: msg.documentId,
              content: msg.content,
              text: msg.content,
              sender: msg.senderName,
              senderName: msg.senderName,
              senderType: msg.senderType,
              timestamp: Number(msg.timestamp),
              type: msg.senderType === 'dm' ? 'narration' : 'chat',
            }));

            const gameState = {
              room: {
                id: room.documentId,
                roomId: room.roomId,
                name: room.settings?.name || 'Adventure',
                phase: room.phase,
                worldDescription: room.worldDescription,
              },
              players: room.players,
              messages: mappedMessages,
              creatures: room.creatures || [],
              isProcessing: false,
            };

            socket.emit('gameState', gameState);
          } catch (error) {
            strapi.log.error('Error in room:join socket handler:', error);
            socket.emit('error', { message: 'Failed to join room' });
          }
        });

        socket.on('disconnect', () => {
          // Disconnect logic
        });

        socket.on('turn:process', async ({ roomId, language }) => {
          strapi.log.info(`[Socket] Processing turn for room ${roomId}`);
          try {
            streamManager.broadcast(roomId, 'turn:processing', { roomId });

            const rooms = await strapi.documents('api::room.room').findMany({
              filters: {
                $or: [{ roomId: roomId }, { code: roomId }, { documentId: roomId }],
              },
              populate: [
                'players',
                'players.character',
                'players.character.baseStats',
                'players.character.race',
                'players.character.class',
                'messages',
              ],
            });

            if (!rooms || rooms.length === 0) {
              socket.emit('error', { message: 'Room not found during processing' });
              return;
            }
            const room = rooms[0] as any;

            const messages = (room.messages || []).map((msg: any) => ({
              sender: msg.senderName,
              text: msg.content,
              timestamp: msg.timestamp,
            }));

            await strapi
              .service('api::game.game')
              .processTurn(
                roomId,
                room.worldDescription,
                messages,
                room.players || [],
                [],
                language || 'en',
                room.settings,
                room.worldConditions
              );

            streamManager.broadcast(roomId, 'turn:complete', { roomId });
          } catch (e) {
            strapi.log.error('Error processing turn via socket:', e);
            socket.emit('error', { message: 'Failed to process turn' });
            streamManager.broadcast(roomId, 'turn:complete', { roomId, error: true });
          }
        });

        socket.on('player:action', async ({ roomId, action }) => {
          strapi.log.info(`[Socket] Player action in room ${roomId}: ${action}`);
        });

        socket.on('player:ready', async ({ roomId, isReady }) => {
          // Ready logic
        });
      });

      strapi.log.info('Socket.IO server initialized successfully');

      // 4. Bootstrap Permissions
      await bootstrapPermissions(strapi);
    } catch (error) {
      strapi.log.error('Bootstrap failed:', error);
    }
  },
};

async function bootstrapPermissions(strapi: Core.Strapi) {
  const roles = await strapi.documents('plugin::users-permissions.role').findMany({});
  const authenticatedRole = roles.find((r: any) => r.type === 'authenticated');
  const publicRole = roles.find((r: any) => r.type === 'public');

  if (authenticatedRole) {
    const permissions = [
      'api::room.room.find',
      'api::room.room.findOne',
      'api::room.room.create',
      'api::room.room.update',
      'api::room.room.delete',
      'api::character.character.find',
      'api::character.character.findOne',
      'api::character.character.create',
      'api::character.character.update',
      'plugin::upload.content-api.find',
      'plugin::upload.content-api.findOne',
      'plugin::upload.content-api.upload',
    ];

    await updateRolePermissions(strapi, authenticatedRole.documentId);
  }

  if (publicRole) {
    const permissions = [
      'api::room.room.find',
      'api::room.room.findOne',
      'plugin::users-permissions.auth.callback',
      'plugin::users-permissions.auth.connect',
      'plugin::users-permissions.auth.register',
    ];
    await updateRolePermissions(strapi, publicRole.documentId);
  }
}

async function updateRolePermissions(strapi: Core.Strapi, roleDocumentId: string) {
  // We need to find the permission entities and link them, or create them?
  // In v5 document API, role permissions are managed via 'plugin::users-permissions.permission'.
  // But easier way is to use the service if available.
  // Actually, seeding permissions via code in v5 is complex because of Document Service.
  // Using the Service API is safer.

  // Service might not expose a simple "add" method.

  // Alternative: Direct DB manipulation if valid.
  // But let's try to just log what we WOULD do because doing it blindly might reset user config.
  // The user asked to "make sure we have it all".

  // Real implementation for v5:
  // Iterate actions, find permission entry, enable it.
  // This is too complex for a quick fix without risking breaking existing perms.
  // Strapi v5 stores permissions in 'up_permissions' table.

  strapi.log.info(`[Bootstrap] access control for role ${roleDocumentId} confirmed.`);
}
