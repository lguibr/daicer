/**
 * time-frame service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::time-frame.time-frame', ({ strapi }) => ({
  async createSnapshot(roomId: string, gameState: any) {
    const room = await strapi.entityService.findOne('api::room.room', roomId, {
      populate: ['turns'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    const currentTurnNumber = (room as any).turns?.length || 0;

    return await strapi.entityService.create('api::time-frame.time-frame', {
      data: {
        turnNumber: currentTurnNumber,
        timestamp: new Date(),
        room: roomId,
        gameState: gameState, // Full snapshot of the world/entities/settings at this moment
      },
    });
  },

  async getPOV(timeFrameId: string, playerId: string) {
    const timeFrame = await strapi.entityService.findOne('api::time-frame.time-frame', timeFrameId, {
      populate: ['room'],
    });

    if (!timeFrame) {
      throw new Error('Time frame not found');
    }

    // Logic to filter gameState based on playerId (e.g. Fog of War)
    // For now returning full state, to be refined.
    return timeFrame.gameState;
  },
}));
