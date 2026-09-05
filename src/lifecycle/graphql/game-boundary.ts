/** Raw state has no public schema surface, including reverse relations from catalog records. */
export const PRIVATE_GAME_MODELS = [
  'room', 'entity-sheet', 'turn', 'message', 'game-event', 'time-frame', 'world',
  'dm-setting', 'knowledge-snippet', 'turn-lock', 'game-operation', 'voxel-change', 'chunk', 'anchor', 'agent-log',
].map((name) => `api::${name}.${name}`);

export function installGameBoundary(strapi, extension) {
  const privateModels = new Set(PRIVATE_GAME_MODELS);
  for (const uid of privateModels) extension.shadowCRUD(uid).disable();
  for (const [uid, model] of Object.entries({ ...strapi.contentTypes, ...strapi.components }) as Array<[string, any]>) {
    if (uid.startsWith('api::')) extension.shadowCRUD(uid).disableMutations();
    for (const [field, attribute] of Object.entries(model.attributes ?? {}) as Array<[string, any]>) {
      if (privateModels.has(uid) || privateModels.has(attribute.target)) extension.shadowCRUD(uid).field(field).disable();
    }
  }
}
