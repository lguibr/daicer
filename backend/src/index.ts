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
          generateAvatarPortrait(payload: JSON!, referenceImage: String): JSON
          generateAvatarUpperBody(payload: JSON!, portrait: JSON!, referenceImage: String): JSON
          generateAvatarFullBody(payload: JSON!, portrait: JSON!, upperBody: JSON!, referenceImage: String): JSON
          spawnCreature(roomId: ID!, creature: JSON): JSON
          generateTerrain(roomId: ID!): JSON
          generateTerrainChunk(roomId: ID!, chunkX: Int!, chunkY: Int!, chunkSize: Int): JSON
        }
      `,
      resolvers: {
        Room: {
          messages: async (parent, args, context) => {
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
          turns: async (parent, args) => {
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
          generateAvatarPortrait: {
            resolve: async (_parent, args, _context) => {
              const { payload, referenceImage } = args;
              try {
                return await strapi.service('api::assets.assets').generatePortrait({ ...payload, referenceImage });
              } catch (e) {
                strapi.log.error('generateAvatarPortrait service call failed', e);
                throw new Error('Failed to generate avatar: ' + (e instanceof Error ? e.message : String(e)));
              }
            },
          },
          generateAvatarUpperBody: {
            resolve: async (_parent, args, _context) => {
              const { payload, portrait, referenceImage } = args;
              try {
                return await strapi
                  .service('api::assets.assets')
                  .generateUpperBody({ payload, portrait, referenceImage });
              } catch (e) {
                strapi.log.error('generateAvatarUpperBody service call failed', e);
                throw new Error('Failed to generate upper body: ' + (e instanceof Error ? e.message : String(e)));
              }
            },
          },
          generateAvatarFullBody: {
            resolve: async (_parent, args, _context) => {
              const { payload, portrait, upperBody, referenceImage } = args;
              try {
                return await strapi
                  .service('api::assets.assets')
                  .generateFullBody({ payload, portrait, upperBody, referenceImage });
              } catch (e) {
                strapi.log.error('generateAvatarFullBody service call failed', e);
                throw new Error('Failed to generate full body: ' + (e instanceof Error ? e.message : String(e)));
              }
            },
          },
          spawnCreature: {
            resolve: async (_parent, args, _context) => {
              const { roomId, creature } = args;
              return strapi.service('api::game.game').spawnCreature(roomId, creature);
            },
          },
          generateTerrain: {
            resolve: async (_parent, args, _context) => {
              const { roomId } = args;

              try {
                // Return array of chunks (ChunkDTO[])
                // roomId arg IS the documentId in our current architecture
                const chunks = await strapi.service('api::terrain.terrain').generateInitialMap(roomId);

                return {
                  chunks,
                };
              } catch (e) {
                strapi.log.error('generateTerrain failed', e);
                throw new Error('Failed to generate terrain');
              }
            },
          },
          generateTerrainChunk: {
            resolve: async (_parent, args, _context) => {
              const { roomId, chunkX, chunkY, chunkSize } = args;
              try {
                return await strapi
                  .service('api::terrain.terrain')
                  .generateChunk(roomId, chunkX, chunkY, chunkSize || 16);
              } catch (e) {
                strapi.log.error('generateTerrainChunk failed', e);
                throw new Error('Failed to generate terrain chunk');
              }
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
                terrain: room.terrainData,
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
    } catch (error) {
      strapi.log.error('Bootstrap failed:', error);
    }
  },
};
