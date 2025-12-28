import { v4 as uuidv4 } from 'uuid';

export const getMutationResolvers = (strapi) => ({
  createRoom: async (_parent, args, context) => {
    const { data } = args;
    const { state } = context;
    const { user } = state;

    if (!user) throw new Error('You must be logged in to create a room');

    // split fields
    const worldFields = [
      'seed',
      'language',
      'chunkSize',
      'detail',
      'fogRadius',
      'globalScale',
      'seaLevel',
      'elevationScale',
      'roughness',
      'moistureScale',
      'temperatureOffset',
      'roadDensity',
      'structureChance',
      'structureSpacing',
      'structureSizeAvg',
      'worldSize',
      'worldType',
      'worldBackground',
    ];

    const dmFields = [
      'adventureLength',
      'difficulty',
      'theme',
      'setting',
      'tone',
      'dmSystemPrompt',
      'playerCount',
      'startingLevel',
      'attributePointBudget',
      'dmStyle',
    ];

    const worldData: any = { name: `${user.username}'s World` };
    const dmData: any = {};
    const roomData: any = { ...data };

    // Helper to extract fields
    const extract = (source: any) => {
      worldFields.forEach((field) => {
        if (source[field] !== undefined) {
          worldData[field] = source[field];
          delete roomData[field];
        }
      });
      dmFields.forEach((field) => {
        if (source[field] !== undefined) {
          dmData[field] = source[field];
          delete roomData[field];
        }
      });
    };

    extract(data);
    if (data.settings) {
      extract(data.settings);
      delete roomData.settings;
    }

    // Create World Entity
    const world = await strapi.documents('api::world.world').create({
      data: worldData,
      status: 'published',
    });

    // Create DMSetting Entity
    const dmSetting = await strapi.documents('api::dm-setting.dm-setting').create({
      data: dmData,
      status: 'published',
    });

    const tempCode = uuidv4();
    const finalRoomData = {
      ...roomData,
      roomId: tempCode,
      code: tempCode,
      owner: user.documentId,
      phase: 'lobby',
      isActive: true,
      world: world.documentId,
      dmSettings: dmSetting.documentId,
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

    return strapi.documents('api::room.room').create({
      data: finalRoomData,
      status: 'published',
    });
  },

  generateWorld: async (_parent, args, _context) => {
    const { roomId, language } = args;
    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { roomId },
      populate: ['world', 'dmSettings'],
    });
    if (!rooms || rooms.length === 0) throw new Error('Room not found');
    const room = rooms[0];

    // Merge world and dmSettings
    const settings = { ...room.world, ...room.dmSettings };
    const description = await strapi.service('api::game.game').generateWorld(settings, language);

    // Update World entity instead of Room
    await strapi.documents('api::world.world').update({
      documentId: room.world.documentId,
      data: { description: description },
    });

    return strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: { phase: 'world_generation' },
    });
  },

  processTurn: async (_parent, args, _context) => {
    const { roomId, messages, language } = args;
    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { roomId },
      populate: [
        'players',
        'players.character',
        'players.character.race',
        'players.character.class',
        'players.character.baseStats',
        'world',
        'dmSettings',
      ],
    });
    if (!rooms || rooms.length === 0) throw new Error('Room not found');
    const room = rooms[0];

    const settings = { ...room.world, ...room.dmSettings };

    return strapi.service('api::game.game').processTurn(
      roomId,
      room.world?.description || '',
      messages || [],
      room.players || [],
      [],
      language || room.world?.language || 'en',
      settings, // Pass merged settings
      room.worldConditions
    );
  },

  joinRoom: async (_parent, args, context) => {
    const { code } = args;
    const { user } = context.state;
    if (!user) throw new Error('You must be logged in to join a room');

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { $or: [{ roomId: code }, { code: code }] },
      populate: ['players', 'players.user'],
    });

    if (!rooms || rooms.length === 0) throw new Error('Room not found');
    const targetRoom = rooms[0];
    const players = targetRoom.players || [];

    if (players.some((p) => p.user?.documentId === user.documentId || p.user?.id === user.id)) {
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

    return strapi.documents('api::room.room').update({
      documentId: targetRoom.documentId,
      data: { players: [...players, newPlayer] },
    });
  },

  addCharacter: async (_parent, args, context) => {
    const { roomId, character } = args;
    const { user } = context.state;
    if (!user) throw new Error('Unauthorized');
    return strapi.service('api::game.game').addCharacter(roomId, character, user);
  },

  startGame: async (_parent, args, _context) => {
    const { roomId, language } = args;
    return strapi.service('api::game.game').startGame(roomId, language);
  },

  submitAction: async (_parent, args, context) => {
    const { roomId, action } = args;
    const { user } = context.state;
    if (!user) throw new Error('Unauthorized');
    return strapi.service('api::game.game').submitAction(roomId, action, user);
  },

  spawnCreature: async (_parent, args, _context) => {
    const { roomId, creature } = args;
    return strapi.service('api::game.game').spawnCreature(roomId, creature);
  },

  generateAvatarPortrait: async (_parent, args, _context) => {
    const { payload, referenceImage } = args;
    return strapi.service('api::assets.assets').generatePortrait({ ...payload, referenceImage });
  },

  generateAvatarUpperBody: async (_parent, args, _context) => {
    const { payload, portrait, referenceImage } = args;
    return strapi.service('api::assets.assets').generateUpperBody({ payload, portrait, referenceImage });
  },

  generateAvatarFullBody: async (_parent, args, _context) => {
    const { payload, portrait, upperBody, referenceImage } = args;
    return strapi.service('api::assets.assets').generateFullBody({ payload, portrait, upperBody, referenceImage });
  },

  generateTerrainChunk: async (_parent, args, _context) => {
    const { roomId, chunkX, chunkY, chunkSize } = args;
    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { roomId },
      populate: ['world'],
    });
    if (!rooms || rooms.length === 0) throw new Error('Room not found');
    const room = rooms[0];

    const config = {
      seed: room.world?.seed || room.roomId || 'default_seed',
      chunkSize: chunkSize || room.world?.chunkSize || 16,
      ...room.world, // Pass full world config as it likely contains seaLevel etc
    };

    return strapi.service('api::voxel-engine.voxel-engine').getChunk(chunkX, chunkY, config);
  },

  generateTerrain: async () => true,
});
