import { describe, it, expect, vi } from 'vitest';
import { basicRules, initialState, terrainSnapshot, resetBudgets, loadPlayerSheets, SHEET_POPULATE } from '../turn-kernel-adapter';
import sheetSchema from '../../../entity-sheet/content-types/entity-sheet/schema.json';
import actionSchema from '../../../action/content-types/action/schema.json';
const action = { documentId: 'sword', type: 'melee', toHit: 4, range_config: { type: 'Touch' },
  damage_instances: [{ effect_type: 'Damage', dice_count: 1, dice_value: 6, flat_bonus: 2, timing: 'Instant' }] };
describe('basic kernel persistence adapter', () => {
  it('populates only relation and component fields from the real Strapi schemas', () => {
    for (const key of Object.keys(SHEET_POPULATE)) {
      expect(['relation', 'component']).toContain(sheetSchema.attributes[key]?.type);
    }
    for (const key of SHEET_POPULATE.actions.populate) {
      expect(['relation', 'component']).toContain(actionSchema.attributes[key]?.type);
    }
  });
  it('accepts explicit basic actions and rejects unsupported mechanics', () => {
    const sheets = [{ documentId: 's1', actions: [action, { ...action, documentId: 'spell', type: 'spell' },
      { ...action, documentId: 'delayed', damage_instances: [{ ...action.damage_instances[0], timing: 'End of Turn' }] }] }];
    expect(basicRules(sheets).rules.attacks).toEqual([{ id: 'sword', attackBonus: 4, rangeFeet: 5, damage: { count: 1, sides: 6, bonus: 2 } }]);
  });
  it('initializes distinct walkable positions and preserves defeated HP', () => {
    const sheets = [0, 1].map((index) => ({ documentId: `s${index}`, currentHp: index * 10, maxHp: 10, ac: 14, race: { speed: 25 }, actions: [action] }));
    const terrain = { worldId: 'w1', revision: 'terrain', walkableTiles: [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }] };
    const initial = initialState({ documentId: 'r1', world: { documentId: 'w1' } }, sheets, terrain);
    expect(initial.state.entities.map((entity) => entity.position.x)).toEqual([0, 1]);
    expect(initial.state.entities[0].hp).toBe(0);
    initial.state.entities[1].movementRemainingFeet = 0;
    expect(resetBudgets(initial.state, initial.movementFeet).entities[1].movementRemainingFeet).toBe(25);
  });
  it.each([16, 32])('captures actual versioned %i-sized world chunks', async (chunkSize) => {
    const getChunk = vi.fn(async (x, y, config, worldId) => ({ x, y, worldId, minZ: 0, revision: `${x}:${y}`, tiles: [Array.from({ length: config.chunkSize }, () => Array.from({ length: config.chunkSize }, () => ({ isWalkable: true })))] }));
    const terrain = await terrainSnapshot({ service: () => ({ getChunk }) }, { documentId: 'world', seed: 'seed', chunkSize }, [{ x: -1, y: -1, z: 0 }], 0);
    expect(getChunk).toHaveBeenCalledWith(-1, -1, expect.objectContaining({ chunkSize }), 'world');
    expect(terrain.walkableTiles).toHaveLength(chunkSize * chunkSize);
    expect(terrain.walkableTiles[0]).toEqual({ x: -chunkSize, y: -chunkSize, z: 0 });
    expect(terrain.revision).toHaveLength(64);
  });
  it.each([['defenses', [{ name: 'effect' }]], ['conditions', [{ name: 'effect' }]], ['active_effects', [{ name: 'effect' }]], ['active_effects', { incapacitated: true }]])('rejects unsupported persisted %s', async (field, value) => {
    const sheet = { documentId: 'sheet', owner: { documentId: 'user' }, room: { documentId: 'room' }, [field as string]: value };
    const strapi = { documents: () => ({ findOne: async () => sheet }) };
    const room = { documentId: 'room', players: [{ user: { documentId: 'user' }, characterSheet: { documentId: 'sheet' } }] };
    await expect(loadPlayerSheets(strapi, room)).rejects.toMatchObject({ extensions: { code: 'LEGACY_STATE_UNSUPPORTED' } });
  });

});
