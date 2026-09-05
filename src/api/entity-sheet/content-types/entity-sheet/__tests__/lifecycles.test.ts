import { describe, it, expect, vi, beforeEach } from 'vitest';
import lifecycles from '@/api/entity-sheet/content-types/entity-sheet/lifecycles';

describe('EntitySheet lifecycle derivation', () => {
  let derive: ReturnType<typeof vi.fn>;
  const event = () => ({ params: { data: { stats: {} } }, result: { documentId: 'sheet-1' } });
  beforeEach(() => {
    derive = vi.fn().mockResolvedValue(undefined);
    (global as any).strapi = { service: vi.fn(() => ({ deriveAndPersist: derive })), log: { error: vi.fn() } };
  });
  it('validates duplicate inventory slots before writes', async () => {
    const data = { inventory: [{ item: 'sword', slot: 'main_hand' }, { item: 'axe', slot: 'main_hand' }] };
    await expect(lifecycles.beforeCreate({ params: { data } })).rejects.toThrow('more than one item');
    await expect(lifecycles.beforeUpdate({ params: { data } })).rejects.toThrow('more than one item');
  });
  it('does not inject unsupported derived fields into source writes', async () => {
    const input = event();
    await lifecycles.beforeUpdate(input);
    expect(input.params.data).toEqual({ stats: {} });
    expect(derive).not.toHaveBeenCalled();
  });
  it.each([
    { inventory: [{ item: 'sword', slot: 'main_hand' }, { item: 'shield', slot: 'off_hand' }] },
    { inventory: [{ item: 'potion', slot: 'backpack' }, { item: 'scroll', slot: 'backpack' }] },
  ])('accepts valid inventory without changing the source write: %j', async (data) => {
    const input = { params: { data } };
    const original = structuredClone(input);
    await expect(lifecycles.beforeCreate(input)).resolves.toBeUndefined();
    await expect(lifecycles.beforeUpdate(input)).resolves.toBeUndefined();
    expect(input).toEqual(original);
    expect(derive).not.toHaveBeenCalled();
  });
  it('rejects inventory with an unsupported slot', async () => {
    const input = { params: { data: { inventory: [{ item: 'sword', slot: 'unknown' }] } } };
    await expect(lifecycles.beforeCreate(input)).rejects.toThrow('Invalid Inventory Structure');
    await expect(lifecycles.beforeUpdate(input)).rejects.toThrow('Invalid Inventory Structure');
  });
  it('derives changed class and level from the persisted sheet after the source write', async () => {
    const input = { params: { data: { class: 'new-class', level: 2 } }, result: { documentId: 'sheet-2' } };
    const original = structuredClone(input);
    await lifecycles.beforeUpdate(input);
    expect(derive).not.toHaveBeenCalled();
    await lifecycles.afterUpdate(input);
    expect(derive).toHaveBeenCalledExactlyOnceWith('sheet-2');
    expect(input).toEqual(original);
  });
  it('calls the existing derivation service and suppresses nested updates', async () => {
    derive.mockImplementation(() => lifecycles.afterUpdate(event()));
    await lifecycles.afterCreate(event());
    expect(strapi.service).toHaveBeenCalledWith('api::game.entity-derivation');
    expect(derive).toHaveBeenCalledTimes(1);
  });
  it('does not suppress independent concurrent requests for the same sheet', async () => {
    await Promise.all([lifecycles.afterCreate(event()), lifecycles.afterCreate(event())]);
    expect(derive).toHaveBeenCalledTimes(2);
  });
  it('propagates failures and clears recursion context', async () => {
    derive.mockRejectedValueOnce(new Error('broken'));
    await expect(lifecycles.afterCreate(event())).rejects.toThrow('EntitySheet derivation failed');
    await lifecycles.afterCreate(event());
    expect(derive).toHaveBeenCalledTimes(2);
  });
  it('ignores derived or mechanical-only writes', async () => {
    for (const data of [{ currentHp: 0 }, { tempHp: 5 }, { position: { x: 1, y: 2, z: 0 } }, { computedActions: [] }, { maxHp: 20, ac: 15 }]) {
      await lifecycles.afterUpdate({ params: { data }, result: { documentId: 'sheet-1' } });
    }
    expect(derive).not.toHaveBeenCalled();
  });
});
