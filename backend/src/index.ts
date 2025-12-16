import type { Core } from '@strapi/strapi';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { streamManager } from './utils/llm/stream-manager';

// Force reload for new API

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
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
        }
      `,
      resolvers: {
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
            // Add more as needed or keep minimal for now
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

              // Initial Owner Player
              const ownerPlayer = {
                id: user.id || user.documentId,
                userId: user.id || user.documentId,
                name: user.username || 'Room Owner',
                character: null,
                action: null,
                isReady: false,
                isOnline: true,
                joinedAt: Date.now(),
              };

              // Prepare Room Data
              const roomData = {
                ...data, // spread input data (settings, structures, etc)
                roomId: tempCode,
                code: tempCode,
                owner: user.documentId, // Use relation
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
                    joinedAt: new Date().toISOString(), // Component expects datetime/string
                  },
                ],
              };

              // Create Room
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

              if (!rooms || rooms.length === 0) {
                throw new Error('Room not found');
              }
              const room = rooms[0] as any;

              const description = await strapi.service('api::game.game').generateWorld(room.settings, language);

              // Update Room
              const updatedRoom = await strapi.documents('api::room.room').update({
                documentId: room.documentId,
                data: {
                  worldDescription: description,
                  phase: 'world_generation', // or 'gameplay'? Assuming world gen completes it
                } as any,
              });

              return updatedRoom;
            },
          },
          processTurn: {
            resolve: async (_parent, args, _context) => {
              const { roomId, messages, language } = args;

              // Fetch room to get context
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

              if (!rooms || rooms.length === 0) {
                throw new Error('Room not found');
              }
              const room = rooms[0] as any;
              const players = room.players || [];

              return strapi.service('api::game.game').processTurn(
                room.worldDescription,
                messages || [],
                players,
                [], // creatures stub
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

              if (!user) {
                throw new Error('You must be logged in to join a room');
              }

              // Reuse the logic from the controller or re-implement
              // Using query directly for better granular control here
              // Using query directly for better granular control here
              const room = await strapi.documents('api::room.room').findMany({
                filters: {
                  $or: [{ roomId: code }, { code: code }],
                },
                populate: ['players', 'players.user'],
              });

              if (!room || room.length === 0) {
                throw new Error('Room not found');
              }
              const targetRoom = room[0];

              const players = targetRoom.players || [];
              const isAlreadyJoined = players.some(
                (p: any) => p.user?.documentId === user.documentId || p.user?.id === user.id
              );

              if (isAlreadyJoined) {
                return targetRoom;
              }

              const newPlayer = {
                user: user.documentId,
                name: user.username || 'Player',
                character: null,
                action: null,
                isReady: false,
                isOnline: true,
                joinedAt: new Date().toISOString(),
              };

              // Update room with new player
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

              if (!user) {
                throw new Error('Unauthorized');
              }

              // Call the existing service method or controller logic
              // Since service requires user context, pass it
              // Assuming service method signature: addCharacter(roomId, characterData, user)
              // We need to look at service signature
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
              // TODO: Implement submit action logic here or via service
              const { roomId, action } = args;
              // We need to see if there is a service for this
              // For now, returning a stub or implementing simple logic
              // We likely want to perform the action logic that was in `submitAction` if it existed.
              // Logic usually involves updating the player's action state in the room.

              const rooms = await strapi.documents('api::room.room').findMany({
                filters: { roomId },
                populate: ['players', 'players.user'],
              });
              if (!rooms || rooms.length === 0) throw new Error('Room not found');
              const room = rooms[0] as any;

              // We should update the player's action. This logic is likely custom.
              // Assuming we just updated the room players
              // But who is the user? We need context.
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
                // Return descriptive error if possible
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
        },
      },
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      // 1. Initialize Socket.IO
      // @ts-ignore - Strapi 5 server access might differ slightly but this is standard for accessing underlying HTTP server
      const httpServer = strapi.server.httpServer;

      const io = new Server(httpServer, {
        cors: {
          origin: process.env.PUBLIC_CLIENT_URL || 'http://localhost:3000', // Update with your frontend URL
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

            // Join the socket room
            socket.join(roomId);
            strapi.log.info(`[Socket Debug] Joining room id: "${roomId}"`);

            const debugQuery = {
              filters: {
                $or: [{ roomId: roomId }, { code: roomId }, { documentId: roomId }],
              },
            };
            strapi.log.info(`[Socket Debug] Query: ${JSON.stringify(debugQuery)}`);

            // Fetch Room Data (using Strapi Entity Service or Documents API)
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
                // 'creatures' // Removed to fix TS error, likely a JSON field or missing from schema
              ],
            });

            if (!rooms || rooms.length === 0) {
              socket.emit('error', { message: 'Room not found' });
              return;
            }

            const room = rooms[0] as any;

            // Construct Game State
            // Note: History is JSON, Messages used to be separate but now often aggregated.
            // If message aggregation is in 'history' or separate.
            // Based on schemas, 'history' is likely the message log.
            // We need to ensure we send 'messages' in the format frontend expects.

            const messages = Array.isArray(room.history) ? room.history : [];

            const gameState = {
              room: {
                id: room.documentId,
                roomId: room.roomId,
                name: room.settings?.name || 'Adventure',
                phase: room.phase,
                worldDescription: room.worldDescription,
                terrain: room.terrainData, // Send terrain data if available
              },
              players: room.players,
              messages: messages, // Send history as messages
              creatures: room.creatures || [],
              isProcessing: false,
            };

            // Emit initial game state to this socket
            socket.emit('gameState', gameState);

            strapi.log.info(`Sent initial gameState to ${socket.id} for room ${roomId}`);
          } catch (error) {
            strapi.log.error('Error in room:join socket handler:', error);
            socket.emit('error', { message: 'Failed to join room' });
          }
        });

        socket.on('disconnect', () => {
          // strapi.log.info(`Socket disconnected: ${socket.id}`);
        });
      });

      strapi.log.info('Socket.IO server initialized successfully');

      const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
        populate: ['permissions'],
      });

      // Grant permissions for all Game Data types
      const gameContentTypes = [
        'api::room.room',
        'api::race.race',
        'api::class.class',
        'api::magic-school.magic-school',
        'api::damage-type.damage-type',
        'api::equipment.equipment',
        'api::monster.monster',
        'api::feature.feature',
        'api::trait.trait',
        'api::subclass.subclass',
        'api::proficiency.proficiency',
        'api::language.language',
        'api::magic-item.magic-item',
        'api::spell.spell',
        'api::character.character',
        'api::character-sheet.character-sheet',
      ];

      if (authenticatedRole) {
        for (const type of gameContentTypes) {
          const actions = [`${type}.find`, `${type}.findOne`];
          if (type === 'api::room.room') actions.push(`${type}.join`); // custom action logic if exists, otherwise assume controller actions

          for (const action of actions) {
            const hasPermission = authenticatedRole.permissions.some((p: any) => p.action === action);
            if (!hasPermission) {
              try {
                await strapi.db.query('plugin::users-permissions.permission').create({
                  data: {
                    action,
                    role: authenticatedRole.id,
                  },
                });
                strapi.log.info(`Granted ${action} permission to Authenticated role`);
              } catch (e) {
                strapi.log.warn(`Failed to grant ${action} (might not exist as controller action)`);
              }
            }
          }
        }
      }
    } catch (error) {
      strapi.log.error('Bootstrap permission grant failed:', error);
    }
  },
};
