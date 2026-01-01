import { getMutationResolvers } from './mutation-resolvers';
import { typeDefs } from './type-defs';

export const registerGraphQLExtension = (strapi) => {
  const extensionService = strapi.plugin('graphql').service('extension');

  extensionService.use({
    typeDefs,
    resolvers: {
      Room: {
        messages: async (parent, _args, context) => {
          strapi.log.info(`[Resolver] Room.messages hit for ${parent.documentId}`);
          const { documentId } = parent;
          const user = context.state.user;

          const orFilters: Array<Record<string, unknown>> = [{ recipient: { $null: true } }];

          if (user) {
            orFilters.push({ recipient: { documentId: user.documentId } });
          }

          const filters: Record<string, unknown> = {
            room: { documentId: documentId },
            $or: orFilters,
          };

          return strapi.documents('api::message.message').findMany({
            filters,
            sort: 'timestamp:asc',
            limit: 100,
            populate: ['turn', 'recipient'],
          });
        },
        turns: async (parent, _args) => {
          strapi.log.info(`[Resolver] Room.turns hit for ${parent.documentId}`);
          return strapi.documents('api::turn.turn').findMany({
            filters: { room: { documentId: parent.documentId } },
            sort: 'turnNumber:desc',
            limit: 5,
            populate: ['messages'],
          });
        },
      },
      Query: {
        searchEntities: async (_parent, args, _context) => {
          const { query } = args;
          strapi.log.info(`[Resolver] searchEntities: "${query}"`);

          if (!query || query.length < 2) return [];

          try {
            // Special Keywords: "characters" or "monsters" list all (limit 50)
            const lowerQuery = query.toLowerCase();
            const showAllCharacters = lowerQuery === 'characters' || lowerQuery === 'character';
            const showAllMonsters = lowerQuery === 'monsters' || lowerQuery === 'monster';

            const filters: Record<string, unknown> = {};
            if (!showAllMonsters && !showAllCharacters) {
              // Standard fuzzy search
              filters.name = { $contains: query };
            }

            const [monsters, characters] = await Promise.all([
              !showAllCharacters
                ? strapi.documents('api::monster.monster').findMany({
                    filters: showAllMonsters ? {} : { name: { $contains: query } },
                    fields: ['name', 'documentId'],
                    limit: 50,
                    locale: 'en',
                  })
                : [],
              !showAllMonsters
                ? strapi.documents('api::character.character').findMany({
                    filters: showAllCharacters ? {} : { name: { $contains: query } },
                    fields: ['name', 'documentId'],
                    limit: 50,
                  })
                : [],
            ]);

            strapi.log.info(`[Resolver] Found ${monsters.length || 0} monsters, ${characters.length || 0} characters`);

            return [
              ...(monsters || []).map((m: { documentId: string; name: string }) => ({
                id: m.documentId,
                name: m.name,
                type: 'monster',
              })),
              ...(characters || []).map((c: { documentId: string; name: string }) => ({
                id: c.documentId,
                name: c.name,
                type: 'character',
              })),
            ];
          } catch (error) {
            strapi.log.error('[Resolver] searchEntities error:', error);
            return [];
          }
        },
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
          { id: 'con', documentId: 'con', name: 'CON', fullName: 'Constitution', description: 'Endurance', skills: [] },
          { id: 'int', documentId: 'int', name: 'INT', fullName: 'Intelligence', description: 'Reasoning', skills: [] },
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
          { id: 'acr', documentId: 'acr', name: 'Acrobatics', description: 'Tumbling', abilityScore: { name: 'DEX' } },
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
          { id: 'charmed', documentId: 'charmed', name: 'Charmed', description: 'Friendly to charmer' },
        ],
        voxelPreview: async (_parent, args, _context) => {
          const { chunks, config } = args;
          if (!config) throw new Error('Missing config');

          // Use the existing service to generate chunks
          const service = strapi.service('api::voxel-engine.voxel-engine');

          // Execute all chunk generations in parallel
          // Note: Since this is CPU bound (procedural generation),
          // Promise.all doesn't make it faster on single thread JS,
          // but it allows formatting the response efficiently.
          const results = await Promise.all(
            chunks.map(async (c: { x: number; y: number }) => {
              return service.getChunk(c.x, c.y, config);
            })
          );

          return results;
        },
      },
      Mutation: getMutationResolvers(strapi),
    },
    resolversConfig: {
      'Room.messages': { auth: false },
      'Room.turns': { auth: false },
      'Query.voxelPreview': {
        auth: {
          scope: ['api::voxel-engine.voxel-engine.voxelPreview'],
        },
      },
      'Query.searchEntities': { auth: false },
    },
  });
};
