import { gameError, requireUser } from '@/api/game/services/room-access';

/** Legacy executors stay available internally, but cannot bypass the room pipeline. */
export const getMutationResolvers = (strapi) => {
  const unavailable = () => gameError('OPERATION_UNAVAILABLE', 'Use the room lifecycle contract.');
  const asset = (method: string) => (_parent, args, context) => {
    requireUser(context?.state?.user);
    return strapi.service('api::assets.assets')[method](args);
  };
  return {
    generateWorld: unavailable, processTurn: unavailable, addCharacter: unavailable,
    spawnCreature: unavailable, executeTool: unavailable, submitAgentAnswer: unavailable,
    generateTerrain: unavailable,
    generateAvatarPortrait: asset('generatePortrait'),
    generateAvatarUpperBody: asset('generateUpperBody'),
    generateAvatarFullBody: asset('generateFullBody'),
  };
};
