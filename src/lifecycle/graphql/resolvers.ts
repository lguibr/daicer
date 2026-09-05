import { getMutationResolvers } from './mutation-resolvers';
import { typeDefs } from './type-defs';
import { getGameResolvers } from './game-resolvers';
import { installGameBoundary } from './game-boundary';

/** Register the viewer contract; raw gameplay documents and executors stay private. */
export const registerGraphQLExtension = (strapi) => {
  const extension = strapi.plugin('graphql').service('extension');
  installGameBoundary(strapi, extension);
  const game = getGameResolvers(strapi);
  const query = {
        searchEntities: async (_parent, args, _context) => {
          const { query } = args;
          strapi.log.info(`[Resolver] searchEntities: "${query}"`);

          if (!query || query.length < 2) return [];

          try {
            // Special Keywords: "characters" or "monsters" list all (limit 50)
            const lowerQuery = query.toLowerCase();
            const showAllItems = lowerQuery === 'items' || lowerQuery === 'item';
            const showAllCharacters = lowerQuery === 'characters' || lowerQuery === 'character';
            const showAllMonsters = lowerQuery === 'monsters' || lowerQuery === 'monster';

            const [entities, items] = await Promise.all([
              !showAllItems
                ? strapi.documents('api::entity.entity').findMany({
                    filters: {
                      $or: [
                        // If specific flags are set, respect them, otherwise strict search
                        showAllMonsters ? { type: 'monster' } : null,
                        showAllCharacters ? { type: 'player' } : null,
                        // General search
                        !showAllMonsters && !showAllCharacters ? { name: { $contains: query } } : null,
                      ].filter(Boolean) as Record<string, unknown>[], // filtered nulls
                    },
                    fields: ['name', 'documentId', 'type'],
                    limit: 50,
                    locale: 'en',
                  })
                : [],
              !showAllMonsters && !showAllCharacters
                ? strapi.documents('api::item.item').findMany({
                    filters: showAllItems ? {} : { name: { $contains: query } },
                    fields: ['name', 'documentId', 'type'],
                    limit: 50,
                  })
                : [],
            ]);

            strapi.log.info(`[Resolver] Found ${(entities || []).length} entities, ${(items || []).length} items`);

            return [
              ...(entities || []).map((e: { documentId: string; name: string; type: string }) => ({
                id: e.documentId,
                name: e.name,
                type: e.type?.toLowerCase() || 'entity', // 'monster', 'player'
              })),
              ...(items || []).map((i: { documentId: string; name: string; type: string }) => ({
                id: i.documentId,
                name: i.name,
                type: 'item',
                subtype: i.type,
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
    ...game.Query,
  };
  const mutation = { ...getMutationResolvers(strapi), ...game.Mutation };
  // Authentication is enforced by these resolver/service boundaries. No role-configured
  // shadowCRUD permission is required to call the dedicated member contract.
  extension.use({
    typeDefs,
    resolvers: { Query: query, Mutation: mutation },
    resolversConfig: Object.fromEntries([
      ...Object.keys(query).map((name) => [`Query.${name}`, { auth: false }]),
      ...Object.keys(mutation).map((name) => [`Mutation.${name}`, { auth: false }]),
    ]),
  });
};
