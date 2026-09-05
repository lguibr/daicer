/** Persistence/terrain adaptation for the pure basic-v1 kernel. No LLM or state writes. */
import { createHash } from 'node:crypto';
import { KernelRulesSchema, KernelStateSchema, KernelTerrainSchema, type KernelState, type KernelTerrain } from '../src/engine/core/command-kernel';
import { normalizeWorldConfig } from '@/api/world/utils/world-config';
import { documentId, gameError } from './room-access';

// active_effects is a JSON scalar: Strapi returns it by default and rejects it in populate.
export const SHEET_POPULATE = { owner: true, room: true, entity: true, stats: true, position: true, race: true, defenses: true, conditions: true,
  actions: { populate: ['range_config', 'damage_instances', 'condition_instances', 'save', 'mechanics_config'] } };

/** Only explicit, single-instance, immediate basic weapon attacks enter the milestone. */
export function basicRules(sheets) {
  const attacks = [];
  const ids = new Map<string, string[]>();
  for (const sheet of sheets) {
    const allowed = [];
    for (const action of sheet.actions ?? []) {
      const damage = action.damage_instances?.[0], range = action.range_config;
      if (!['melee', 'ranged'].includes(action.type) || action.damage_instances?.length !== 1 || !damage ||
          damage.effect_type !== 'Damage' || (damage.timing && damage.timing !== 'Instant') ||
          action.condition_instances?.length || action.save || range?.aoe_shape ||
          (action.mechanics_config?.action_type && action.mechanics_config.action_type !== 'None') ||
          !['Touch', 'Ranged (Feet)'].includes(range?.type) || !Number.isInteger(action.toHit)) continue;
      const id = documentId(action);
      if (!id) continue;
      const candidate = { id, attackBonus: action.toHit, rangeFeet: range.type === 'Touch' ? 5 : range.distance,
        damage: { count: damage.dice_count, sides: damage.dice_value, bonus: damage.flat_bonus ?? 0 } };
      const parsed = KernelRulesSchema.safeParse({ version: 'basic-v1', feetPerTile: 5, attacks: [candidate] });
      if (!parsed.success) continue;
      const existing = attacks.find((entry) => entry.id === id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(candidate)) gameError('INVALID_STATE', 'Inconsistent action definition.');
      if (!existing) attacks.push(candidate);
      allowed.push(id);
    }
    ids.set(sheet.documentId, allowed);
  }
  return { rules: KernelRulesSchema.parse({ version: 'basic-v1', feetPerTile: 5, attacks }), ids };
}

export async function loadPlayerSheets(strapi, room) {
  const sheets = [];
  for (const player of room.players ?? []) {
    const id = documentId(player.characterSheet);
    if (!id) gameError('CHARACTER_REQUIRED', 'Every member must select a character.');
    const sheet = await strapi.documents('api::entity-sheet.entity-sheet').findOne({ documentId: id, populate: SHEET_POPULATE });
    if (!sheet || documentId(sheet.owner) !== documentId(player.user) || documentId(sheet.room) !== room.documentId) {
      gameError('FORBIDDEN', 'Character ownership is inconsistent.');
    }
    if ([sheet.defenses, sheet.conditions, sheet.active_effects].some((value) => value != null && (!Array.isArray(value) || value.length > 0))) gameError('LEGACY_STATE_UNSUPPORTED', 'Defenses, conditions and active effects require a supported rules adapter.');
    if ((sheet.tempHp ?? 0) !== 0) gameError('LEGACY_STATE_UNSUPPORTED', 'Temporary HP is not supported by basic-v1.');
    if (sheets.some((entry) => entry.documentId === id)) gameError('INVALID_STATE', 'Characters must be distinct instances.');
    sheets.push(sheet);
  }
  return sheets.sort((a, b) => a.documentId < b.documentId ? -1 : a.documentId > b.documentId ? 1 : 0);
}

/** Archive the actual loaded walkability and chunk revisions; unknown tiles remain blocked. */
export async function terrainSnapshot(strapi, world, origins = [{ x: 0, y: 0, z: 0 }], radius = 6): Promise<KernelTerrain> {
  if (!world?.documentId) gameError('INVALID_STATE', 'Room world is missing.');
  const config = normalizeWorldConfig(world), coordinates = new Map<string, { x: number; y: number }>();
  for (const origin of origins) {
    for (let y = Math.floor((origin.y - radius) / config.chunkSize); y <= Math.floor((origin.y + radius) / config.chunkSize); y++) {
      for (let x = Math.floor((origin.x - radius) / config.chunkSize); x <= Math.floor((origin.x + radius) / config.chunkSize); x++) coordinates.set(`${x},${y}`, { x, y });
    }
  }
  if (coordinates.size > 32) gameError('INVALID_STATE', 'Terrain window exceeds the supported room size.');
  const chunks = [];
  for (const coordinate of coordinates.values()) chunks.push(await strapi.service('api::voxel-engine.voxel-engine').getChunk(coordinate.x, coordinate.y, config, world.documentId));
  const levels = new Set(origins.map((origin) => origin.z)), walkableTiles = [];
  for (const chunk of chunks) {
    if (chunk.worldId !== world.documentId || typeof chunk.revision !== 'string') gameError('INVALID_STATE', 'Unversioned world chunk.');
    for (const z of levels) for (let y = 0; y < config.chunkSize; y++) for (let x = 0; x < config.chunkSize; x++) {
      if (chunk.tiles[z - chunk.minZ]?.[y]?.[x]?.isWalkable) walkableTiles.push({ x: chunk.x * config.chunkSize + x, y: chunk.y * config.chunkSize + y, z });
    }
  }
  const revision = createHash('sha256').update(JSON.stringify(chunks.map((chunk) => [chunk.x, chunk.y, chunk.revision]))).digest('hex');
  return KernelTerrainSchema.parse({ worldId: world.documentId, revision, walkableTiles });
}

export function initialState(room, sheets, terrain: KernelTerrain) {
  const { rules, ids } = basicRules(sheets);
  const level = [0, 1, -1, 2, -2, 3, -3].find((z) => terrain.walkableTiles.filter((tile) => tile.z === z).length >= sheets.length);
  const positions = terrain.walkableTiles.filter((tile) => tile.z === level).sort((a, b) => Math.abs(a.x) + Math.abs(a.y) - Math.abs(b.x) - Math.abs(b.y) || a.y - b.y || a.x - b.x);
  if (positions.length < sheets.length) gameError('INVALID_STATE', 'No distinct walkable starting positions.');
  const movementFeet = {};
  const entities = sheets.map((sheet, index) => {
    const speed = sheet.race?.speed ?? 30;
    if (!Number.isInteger(speed) || speed < 0 || speed > 100) gameError('INVALID_STATE', 'Unsupported movement speed.');
    movementFeet[sheet.documentId] = speed;
    return { id: sheet.documentId, position: positions[index], hp: sheet.currentHp, maxHp: sheet.maxHp,
      armorClass: sheet.ac ?? 10, movementRemainingFeet: speed, actionsRemaining: 1, attackIds: ids.get(sheet.documentId) };
  });
  return { state: KernelStateSchema.parse({ schemaVersion: 1, rulesVersion: 'basic-v1', roomId: room.documentId,
    worldId: room.world.documentId, eventSequence: 0, entities }), rules, movementFeet };
}
export function resetBudgets(state: KernelState, movementFeet): KernelState {
  return { ...state, entities: state.entities.map((entity) => ({ ...entity, movementRemainingFeet: movementFeet[entity.id], actionsRemaining: 1 })) };
}
export default () => ({ basicRules, loadPlayerSheets, terrainSnapshot, initialState, resetBudgets });
