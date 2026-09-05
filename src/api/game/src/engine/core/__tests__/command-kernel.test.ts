import { describe, expect, it, vi } from 'vitest';
import {
  BASIC_RULES_VERSION,
  CommandBatchInput,
  KernelCommand,
  KernelEntity,
  KernelPosition,
  MechanicalEvent,
  replayMechanicalEvents,
  resolveCommandBatch,
} from '@daicer/engine/core/command-kernel';
import { Alea, AleaState } from '@daicer/engine/voxel/utils/math';

const pos = (x: number, y = 0, z = 0): KernelPosition => ({ x, y, z });
const entity = (id: string, x: number): KernelEntity => ({
  id,
  position: pos(x),
  hp: 100,
  maxHp: 100,
  armorClass: 12,
  movementRemainingFeet: 30,
  actionsRemaining: 2,
  attackIds: ['sword'],
});
const command = (commandId: string, type: KernelCommand['type'], actorId = 'a', payload = {}): unknown => ({
  commandId,
  type,
  actorId,
  payload,
});
const attack = (id: string, actorId = 'a', targetId = 'b') =>
  command(id, 'ATTACK', actorId, { targetId, actionId: 'sword' });
const move = (id: string, x: number, actorId = 'a', y = 0) =>
  command(id, 'MOVE', actorId, { targetPosition: pos(x, y) });
const fixture = (commands: unknown[] = []): CommandBatchInput => ({
  state: {
    schemaVersion: 1,
    rulesVersion: BASIC_RULES_VERSION,
    roomId: 'room',
    worldId: 'world',
    eventSequence: 0,
    entities: [entity('a', 0), entity('b', 1)],
  },
  rules: {
    version: BASIC_RULES_VERSION,
    feetPerTile: 5,
    attacks: [{ id: 'sword', attackBonus: 100, rangeFeet: 5, damage: { count: 1, sides: 6, bonus: 2 } }],
  },
  terrain: {
    worldId: 'world',
    revision: 'overlay-7',
    walkableTiles: Array.from({ length: 11 }, (_, x) => Array.from({ length: 11 }, (_, y) => pos(x - 5, y - 5))).flat(),
  },
  commands,
  rngState: new Alea('kernel-fixture').snapshot(),
});
const freeze = (value: unknown) => {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
};
const rejection = (input: CommandBatchInput, code: string) => {
  const result = resolveCommandBatch(input);
  expect(result.outcomes).toMatchObject([{ status: 'rejected', code }]);
  expect(result.events).toEqual([]);
  expect(result.nextState).toEqual(input.state);
  expect(result.nextRngState).toEqual(input.rngState);
};
const firstAttack = (events: MechanicalEvent[]) => {
  const event = events.find((e) => e.type === 'ATTACK_RESOLVED');
  if (!event || event.type !== 'ATTACK_RESOLVED') throw new Error('Expected attack event');
  return event;
};

describe('deterministic command kernel', () => {
  it('accumulates damage against evolving HP and consumes actions', () => {
    const result = resolveCommandBatch(fixture([attack('one'), attack('two')]));
    const damage = result.events.reduce((sum, e) => sum + (e.type === 'ATTACK_RESOLVED' ? e.payload.damage : 0), 0);
    expect(result.events).toHaveLength(2);
    expect(damage).toBeGreaterThan(0);
    expect(result.nextState.entities[1].hp).toBe(100 - damage);
    expect(result.nextState.entities[0].actionsRemaining).toBe(0);
    expect(firstAttack(result.events.slice(1)).payload.hpBefore).toBe(firstAttack(result.events).payload.hpAfter);
  });
  it('sees a vacated tile and rejects a conflicting later destination', () => {
    const result = resolveCommandBatch(
      fixture([move('b-away', 2, 'b'), move('a-follow', 1), move('collision', 1, 'b')])
    );
    expect(result.outcomes.map((o) => o.status)).toEqual(['resolved', 'resolved', 'rejected']);
    expect(result.outcomes[2]).toMatchObject({ code: 'PATH_BLOCKED' });
    expect(result.nextState.entities.map((e) => e.position.x)).toEqual([1, 2]);
    expect(result.nextState.entities.map((e) => e.movementRemainingFeet)).toEqual([25, 25]);
  });
  it('uses the previous move for attack range and cumulatively spends movement', () => {
    const input = fixture([move('step', 1), attack('hit'), move('return', 0), move('over-budget', -1)]);
    input.state.entities[1].position = pos(2);
    input.state.entities[0].movementRemainingFeet = 10;
    const result = resolveCommandBatch(input);
    expect(result.outcomes.map((o) => o.status)).toEqual(['resolved', 'resolved', 'resolved', 'rejected']);
    expect(result.outcomes[3]).toMatchObject({ code: 'INSUFFICIENT_RESOURCE' });
    expect(result.nextState.entities[0].movementRemainingFeet).toBe(0);
  });
  it('records misses as resolved, consumes an action, and draws no damage dice', () => {
    const input = fixture([attack('miss')]);
    input.rules.attacks[0].attackBonus = -1000;
    const result = resolveCommandBatch(input);
    expect(result.outcomes[0].status).toBe('resolved');
    expect(firstAttack(result.events).payload).toMatchObject({ hit: false, damage: 0, damageRolls: [], hpAfter: 100 });
    expect(result.nextState.entities[0].actionsRemaining).toBe(1);
    const rng = Alea.fromState(input.rngState);
    rng.next();
    expect(result.nextRngState).toEqual(rng.snapshot());
  });
  it('honors natural one, natural twenty, and zero armor class', () => {
    const findState = (natural: number): AleaState => {
      for (let n = 0; n < 1000; n++) {
        const rng = new Alea(String(n));
        const snapshot = rng.snapshot();
        if (Math.floor(rng.next() * 20) + 1 === natural) return snapshot;
      }
      throw new Error('Missing deterministic fixture');
    };
    const input = fixture([attack('one')]);
    input.state.entities[1].armorClass = 0;
    input.rngState = findState(1);
    expect(firstAttack(resolveCommandBatch(input).events).payload.hit).toBe(false);
    input.rngState = findState(20);
    input.rules.attacks[0].attackBonus = -1000;
    const critical = firstAttack(resolveCommandBatch(input).events);
    expect(critical.payload.hit).toBe(true);
    expect(critical.payload.damageRolls).toHaveLength(2);
    input.rngState = findState(2);
    input.rules.attacks[0].attackBonus = 0;
    expect(firstAttack(resolveCommandBatch(input).events).payload.hit).toBe(true);
  });
  it('clamps damage at zero instead of healing with a negative damage bonus', () => {
    const input = fixture([attack('weak')]);
    input.rules.attacks[0].damage.bonus = -100;
    expect(firstAttack(resolveCommandBatch(input).events).payload.damage).toBe(0);
  });
  it('preserves zero HP, rejects defeated actors/targets, and permits pass', () => {
    const input = fixture([attack('dead')]);
    input.state.entities[0].hp = 0;
    rejection(input, 'ACTOR_DEFEATED');
    input.commands = [attack('target', 'b', 'a')];
    rejection(input, 'TARGET_DEFEATED');
    input.commands = [command('pass', 'PASS')];
    const result = resolveCommandBatch(input);
    expect(result.outcomes[0].status).toBe('resolved');
    expect(result.nextState.entities).toEqual(input.state.entities);
    expect(result.nextRngState).toEqual(input.rngState);
  });
  it('clamps lethal HP and later commands see defeat', () => {
    const input = fixture([attack('lethal'), attack('after')]);
    input.state.entities[1].hp = 1;
    const result = resolveCommandBatch(input);
    expect(result.nextState.entities[1].hp).toBe(0);
    expect(result.outcomes[1]).toMatchObject({ code: 'TARGET_DEFEATED' });
    expect(result.nextState.entities[0].actionsRemaining).toBe(1);
  });
  it.each([
    [command('unknown', 'PASS', 'missing'), 'ACTOR_NOT_FOUND'],
    [attack('missing', 'a', 'missing'), 'TARGET_NOT_FOUND'],
    [attack('self', 'a', 'a'), 'INVALID_TARGET'],
    [command('action', 'ATTACK', 'a', { targetId: 'b', actionId: 'spell' }), 'UNSUPPORTED_ACTION'],
    [{ commandId: 'spell', actorId: 'a', type: 'CAST_SPELL', payload: {} }, 'INVALID_COMMAND'],
    [move('stay', 0), 'NO_MOVEMENT'],
    [move('infinite', Infinity), 'INVALID_COMMAND'],
    [move('nan', NaN), 'INVALID_COMMAND'],
    [move('fractional', 0.5), 'INVALID_COMMAND'],
    [null, 'INVALID_COMMAND'],
  ])('rejects invalid command %# without effects', (cmd, code) => rejection(fixture([cmd]), code as string));
  it('rejects exhausted resources and actor-disallowed attacks', () => {
    const input = fixture([attack('empty')]);
    input.state.entities[0].actionsRemaining = 0;
    rejection(input, 'INSUFFICIENT_RESOURCE');
    input.state.entities[0].actionsRemaining = 1;
    input.state.entities[0].attackIds = [];
    rejection(input, 'UNSUPPORTED_ACTION');
  });
  it('rejects range beyond one five-foot tile and attacks on another plane', () => {
    const input = fixture([attack('range')]);
    input.state.entities[1].position = pos(2);
    rejection(input, 'OUT_OF_RANGE');
    input.state.entities[1].position = pos(1, 0, 1);
    rejection(input, 'OUT_OF_RANGE');
  });
  it('uses final terrain, blocks missing cells, and never cuts diagonal corners', () => {
    const input = fixture([move('diagonal', 1, 'a', 1)]);
    input.state.entities[1].position = pos(3);
    input.terrain.walkableTiles = [pos(0), pos(1, 1), pos(3)];
    rejection(input, 'PATH_BLOCKED');
    input.commands = [move('missing', -1)];
    rejection(input, 'PATH_BLOCKED');
    input.commands = [command('vertical', 'MOVE', 'a', { targetPosition: pos(0, 0, 1) })];
    input.terrain.walkableTiles.push(pos(0, 0, 1));
    rejection(input, 'PATH_BLOCKED');
    input.commands = [attack('wall')];
    input.state.entities[1].position = pos(1);
    rejection(input, 'PATH_BLOCKED');
  });
  it('counts cardinal detours in feet and is independent of terrain input order', () => {
    const input = fixture([move('detour', 2)]);
    input.state.entities[1].position = pos(4);
    input.terrain.walkableTiles = [pos(0), pos(0, 1), pos(1, 1), pos(2, 1), pos(2), pos(4)];
    const result = resolveCommandBatch(input);
    expect(result.events[0]).toMatchObject({ payload: { costFeet: 20, movementAfter: 10 } });
    input.terrain.walkableTiles.reverse();
    expect(resolveCommandBatch(input)).toEqual(result);
    input.state.entities[0].movementRemainingFeet = 15;
    rejection(input, 'INSUFFICIENT_RESOURCE');
  });
  it('does not apply duplicate command IDs twice within a batch', () => {
    const result = resolveCommandBatch(fixture([attack('same'), attack('same')]));
    expect(result.events).toHaveLength(1);
    expect(result.outcomes[1]).toMatchObject({ code: 'DUPLICATE_COMMAND' });
  });
  it('produces identical JSON with frozen inputs and forbidden ambient clock/random', () => {
    const input = fixture([attack('hit'), command('pass', 'PASS')]);
    const before = JSON.stringify(input);
    freeze(input);
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Ambient RNG');
    });
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('Ambient clock');
    });
    try {
      const first = resolveCommandBatch(input);
      expect(JSON.stringify(resolveCommandBatch(input))).toBe(JSON.stringify(first));
      expect(JSON.stringify(input)).toBe(before);
      first.nextState.entities[0].hp = 0;
      expect(input.state.entities[0].hp).toBe(100);
    } finally {
      random.mockRestore();
      clock.mockRestore();
    }
  });
  it('reconstructs state/RNG and continues after a JSON round-trip at every boundary', () => {
    const input = fixture([move('approach', 1), attack('first'), attack('second'), command('pass', 'PASS', 'b')]);
    input.state.entities[1].position = pos(2);
    const live = resolveCommandBatch(input);
    const reconstructed = replayMechanicalEvents({ state: input.state, rngState: input.rngState, events: live.events });
    expect(reconstructed).toEqual({ nextState: live.nextState, nextRngState: live.nextRngState });
    for (let split = 0; split <= input.commands.length; split++) {
      const prefix = resolveCommandBatch({ ...input, commands: input.commands.slice(0, split) });
      const snapshot = JSON.parse(JSON.stringify({ state: prefix.nextState, rngState: prefix.nextRngState }));
      const suffix = resolveCommandBatch({ ...input, ...snapshot, commands: input.commands.slice(split) });
      expect(suffix.nextState).toEqual(live.nextState);
      expect(suffix.nextRngState).toEqual(live.nextRngState);
      expect([...prefix.events, ...suffix.events]).toEqual(live.events);
      expect(replayMechanicalEvents({ ...snapshot, events: live.events.slice(prefix.events.length) })).toEqual(
        reconstructed
      );
    }
  });
  it('rejects malformed canonical context before execution', () => {
    const input = fixture([command('pass', 'PASS')]);
    input.state.entities[0].hp = NaN;
    expect(() => resolveCommandBatch(input)).toThrow();
    input.state.entities[0].hp = 101;
    expect(() => resolveCommandBatch(input)).toThrow();
    input.state.entities[0].hp = 100;
    input.terrain.worldId = 'other';
    expect(() => resolveCommandBatch(input)).toThrow('Terrain world mismatch');
    input.terrain.worldId = 'world';
    input.rules.attacks.push(input.rules.attacks[0]);
    expect(() => resolveCommandBatch(input)).toThrow('Duplicate rule attack ID');
    input.rules.attacks.pop();
    input.state.entities[1].id = 'a';
    expect(() => resolveCommandBatch(input)).toThrow('Duplicate entity ID');
    input.state.entities[1].id = 'b';
    input.state.entities[0].attackIds = ['unknown'];
    expect(() => resolveCommandBatch(input)).toThrow('Unknown actor attack definition');
  });
  it('fails replay closed on gaps, versions, contexts, before-state, or RNG corruption', () => {
    const input = fixture([attack('first'), attack('second')]);
    const live = resolveCommandBatch(input);
    const replay = (events: unknown[]) =>
      replayMechanicalEvents({ state: input.state, rngState: input.rngState, events });
    expect(() => replay([live.events[1]])).toThrow('sequence');
    expect(() => replay([live.events[0], live.events[0]])).toThrow('sequence');
    expect(() => replay([{ ...live.events[0], schemaVersion: 2 }])).toThrow();
    expect(() => replay([{ ...live.events[0], type: 'SPELL_CAST' }])).toThrow();
    expect(() => replay([{ ...live.events[0], roomId: 'other' }])).toThrow('context');
    expect(() => replay([{ ...live.events[0], worldId: 'other' }])).toThrow('context');
    expect(() => replay([{ ...live.events[0], rngBefore: new Alea('other').snapshot() }])).toThrow('RNG before');
    expect(() => replay([{ ...live.events[0], rngAfter: new Alea('other').snapshot() }])).toThrow('RNG continuation');
    const event = firstAttack(live.events);
    expect(() => replay([{ ...event, payload: { ...event.payload, hpBefore: 99 } }])).toThrow('before-state');
    expect(input.state.entities[1].hp).toBe(100);
  });
});

describe('Alea continuation', () => {
  it('keeps accepted fractional boundary states restorable after every draw', () => {
    for (const s0 of [0, Number.MIN_VALUE, 0.5, 0.9999999999999999]) {
      for (const c of [0, 1, 2091638, 2091639]) {
        let state: AleaState = { algorithm: 'alea-v1', s0, s1: 0.5, s2: 0.5, c };
        for (let i = 0; i < 20; i++) {
          const rng = Alea.fromState(state);
          expect(rng.next()).toBeGreaterThanOrEqual(0);
          state = JSON.parse(JSON.stringify(rng.snapshot()));
          expect(state.s2).toBeLessThan(1);
          expect(() => Alea.fromState(state)).not.toThrow();
        }
      }
    }
    const input = fixture([attack('boundary')]);
    input.rngState = { algorithm: 'alea-v1', s0: 0.9999999999999999, s1: 0.5, s2: 0.5, c: 2091638 };
    const result = resolveCommandBatch(input);
    expect(replayMechanicalEvents({ state: input.state, rngState: input.rngState, events: result.events })).toEqual({
      nextState: result.nextState,
      nextRngState: result.nextRngState,
    });
  });
  it('preserves seeded sequences and resumes after detached JSON snapshots', () => {
    const rng = new Alea('continuation');
    const control = new Alea('continuation');
    for (let i = 0; i < 23; i++) expect(rng.next()).toBe(control.next());
    const snapshot = rng.snapshot();
    const restored = Alea.fromState(JSON.parse(JSON.stringify(snapshot)));
    snapshot.s0 = 0;
    for (let i = 0; i < 100; i++) expect(restored.next()).toBe(rng.next());
  });
  it.each([{ algorithm: 'unknown' }, { s0: NaN }, { s1: 1 }, { s2: -1 }, { c: 1.5 }, { c: -1 }, { c: 2091640 }])(
    'rejects invalid serialized state %j',
    (patch) => {
      expect(() => Alea.fromState({ ...new Alea('fixture').snapshot(), ...patch } as AleaState)).toThrow(
        'Invalid Alea state'
      );
    }
  );
});
