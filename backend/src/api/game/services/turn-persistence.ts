import { createCharacterSnapshot } from '@daicer/engine';

// Helper to create character snapshots
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createSnapshot = (characterSheets: any[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapshot: Record<string, any> = {};
  for (const sheet of characterSheets) {
    if (sheet && sheet.documentId) {
      const snap = createCharacterSnapshot(sheet);
      if (snap) {
        snapshot[sheet.documentId] = snap;
      }
    }
  }
  return snapshot;
};

export default ({ strapi }) => ({
  async persistTurn(
    roomId: string,
    narrative: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    playerActions: any[],
    type: 'group' | 'engine' = 'group',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any = {}
  ) {
    // 1. Fetch Room with Character Sheets for Snapshot
    const roomWithSheets = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
      populate: ['character_sheets'],
    });

    if (!roomWithSheets) throw new Error('Room not found for persistence');

    // 2. Determine Turn Number
    const turnCount = await strapi.documents('api::turn.turn').count({
      filters: { room: { documentId: roomWithSheets.documentId } },
    });

    const snapshot = createSnapshot(roomWithSheets.character_sheets || []);

    // 3. Create Turn Entity
    const newTurn = await strapi.documents('api::turn.turn').create({
      data: {
        turnNumber: turnCount,
        room: roomWithSheets.documentId,
        narrative: narrative,
        status: 'complete',
        type: type,
        actions: playerActions,
        characterSnapshots: snapshot,
        metadata: metadata,
      },
      status: 'published',
    });

    // 4. Create Response Message (Only if narrative exists)
    let newMessage = null;
    if (narrative) {
      newMessage = await strapi.documents('api::message.message').create({
        data: {
          content: narrative,
          senderName: 'DM',
          senderType: 'dm',
          room: roomWithSheets.documentId,
          turn: newTurn.documentId,
          timestamp: Date.now(),
        },
        status: 'published',
      });
    }

    return {
      turn: newTurn,
      message: newMessage,
      room: roomWithSheets,
      snapshot,
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async clearPlayerActions(roomDocumentId: string, players: any[]) {
    const updatedPlayers = players.map((p) => ({
      ...p,
      action: null,
      isReady: false,
    }));

    await strapi.documents('api::room.room').update({
      documentId: roomDocumentId,
      data: {
        players: updatedPlayers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    return updatedPlayers;
  },

  async updateCharacterPosition(sheetId: string, x: number, y: number, z: number) {
    return strapi.documents('api::entity-sheet.entity-sheet').update({
      documentId: sheetId,
      data: {
        position: { x, y, z },
      },
    });
  },
});
