import { RoomRuneGenerator } from '@daicer/shared';

const generator = new RoomRuneGenerator();

export default {
  async afterCreate(event) {
    const { result } = event;

    // Strapi v5: result might use documentId, but the numeric id is often still available on the object
    // or we might need to fetch it if not present.
    // However, usually 'id' (database PK) is returned in afterCreate result for SQL databases.

    if (result.id && !result.code) {
      try {
        const code = generator.encode(result.id);

        await strapi.documents('api::room.room').update({
          documentId: result.documentId,
          data: {
            code: code,
          },
        });
      } catch (error) {
        strapi.log.error(`Failed to generate rune for room ${result.id}:`, error);
      }
    }
  },
};
