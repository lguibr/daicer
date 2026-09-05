/**
 * Authoritative, side-effect-free basic command kernel. See core/README.md for
 * units, supported mechanics, persistence obligations, and replay boundaries.
 */
import { z } from 'zod';
import { Alea, AleaState } from '@daicer/engine/voxel/utils/math';
import { roll } from '@daicer/engine/rules/dice';

export const BASIC_RULES_VERSION = 'basic-v1' as const;
const Id = z.string().min(1).max(200);
const NonnegativeInteger = z.number().int().nonnegative();
const PositionSchema = z
  .object({
    x: z.number().int(),
    y: z.number().int(),
    z: z.number().int().min(-3).max(3),
  })
  .strict();
export type KernelPosition = z.infer<typeof PositionSchema>;

const AttackSchema = z
  .object({
    id: Id,
    attackBonus: z.number().int().min(-1000).max(1000),
    rangeFeet: z.number().int().positive().max(1000),
    damage: z
      .object({
        count: z.number().int().min(1).max(100),
        sides: z.number().int().min(2).max(1000),
        bonus: z.number().int().min(-10000).max(10000),
      })
      .strict(),
  })
  .strict();
export type BasicAttack = z.infer<typeof AttackSchema>;

export const KernelRulesSchema = z
  .object({
    version: z.literal(BASIC_RULES_VERSION),
    feetPerTile: z.literal(5),
    attacks: z.array(AttackSchema).max(1000),
  })
  .strict();
export type KernelRules = z.infer<typeof KernelRulesSchema>;

const EntitySchema = z
  .object({
    id: Id,
    position: PositionSchema,
    hp: NonnegativeInteger.max(1000000000),
    maxHp: z.number().int().positive().max(1000000000),
    armorClass: z.number().int().min(0).max(1000),
    movementRemainingFeet: NonnegativeInteger.max(10000),
    actionsRemaining: NonnegativeInteger.max(1000),
    attackIds: z.array(Id),
  })
  .strict()
  .refine((entity) => entity.hp <= entity.maxHp, 'HP exceeds maximum');
export type KernelEntity = z.infer<typeof EntitySchema>;

export const KernelStateSchema = z
  .object({
    schemaVersion: z.literal(1),
    rulesVersion: z.literal(BASIC_RULES_VERSION),
    roomId: Id,
    worldId: Id,
    eventSequence: NonnegativeInteger,
    entities: z.array(EntitySchema).max(10000),
  })
  .strict();
export type KernelState = z.infer<typeof KernelStateSchema>;

export const KernelTerrainSchema = z
  .object({
    worldId: Id,
    revision: Id,
    walkableTiles: z.array(PositionSchema).max(100000),
  })
  .strict();
export type KernelTerrain = z.infer<typeof KernelTerrainSchema>;

const CommandBase = { commandId: Id, actorId: Id };
export const KernelCommandSchema = z.discriminatedUnion('type', [
  z
    .object({ ...CommandBase, type: z.literal('MOVE'), payload: z.object({ targetPosition: PositionSchema }).strict() })
    .strict(),
  z
    .object({ ...CommandBase, type: z.literal('ATTACK'), payload: z.object({ targetId: Id, actionId: Id }).strict() })
    .strict(),
  z.object({ ...CommandBase, type: z.literal('PASS'), payload: z.object({}).strict() }).strict(),
]);
export type KernelCommand = z.infer<typeof KernelCommandSchema>;

const RngSchema = z
  .object({
    algorithm: z.literal('alea-v1'),
    s0: z.number().min(0).lt(1),
    s1: z.number().min(0).lt(1),
    s2: z.number().min(0).lt(1),
    c: NonnegativeInteger.max(2091639),
  })
  .strict();
const EventBase = {
  schemaVersion: z.literal(1),
  rulesVersion: z.literal(BASIC_RULES_VERSION),
  roomId: Id,
  worldId: Id,
  terrainRevision: Id,
  sequence: z.number().int().positive(),
  commandId: Id,
  actorId: Id,
  eventId: z.string().min(1),
  rngBefore: RngSchema,
  rngAfter: RngSchema,
};
export const MechanicalEventSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...EventBase,
      type: z.literal('ENTITY_MOVED'),
      payload: z
        .object({
          from: PositionSchema,
          to: PositionSchema,
          path: z.array(PositionSchema).min(2).max(100000),
          costFeet: z.number().int().positive(),
          movementBefore: NonnegativeInteger,
          movementAfter: NonnegativeInteger,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...EventBase,
      type: z.literal('ATTACK_RESOLVED'),
      payload: z
        .object({
          targetId: Id,
          action: AttackSchema,
          targetArmorClass: NonnegativeInteger,
          naturalRoll: z.number().int().min(1).max(20),
          total: z.number().int(),
          hit: z.boolean(),
          critical: z.boolean(),
          damageRolls: z.array(z.number().int().positive()).max(200),
          damage: NonnegativeInteger,
          hpBefore: NonnegativeInteger,
          hpAfter: NonnegativeInteger,
          actionsBefore: NonnegativeInteger,
          actionsAfter: NonnegativeInteger,
        })
        .strict(),
    })
    .strict(),
  z.object({ ...EventBase, type: z.literal('PASSED'), payload: z.object({}).strict() }).strict(),
]);
export type MechanicalEvent = z.infer<typeof MechanicalEventSchema>;

export type RejectionCode =
  | 'INVALID_COMMAND'
  | 'DUPLICATE_COMMAND'
  | 'ACTOR_NOT_FOUND'
  | 'ACTOR_DEFEATED'
  | 'TARGET_NOT_FOUND'
  | 'TARGET_DEFEATED'
  | 'INVALID_TARGET'
  | 'UNSUPPORTED_ACTION'
  | 'INSUFFICIENT_RESOURCE'
  | 'OUT_OF_RANGE'
  | 'PATH_BLOCKED'
  | 'NO_MOVEMENT';
export type CommandOutcome =
  | {
      commandIndex: number;
      commandId: string | null;
      status: 'resolved';
      eventIds: string[];
    }
  | {
      commandIndex: number;
      commandId: string | null;
      status: 'rejected';
      code: RejectionCode;
      eventIds: [];
    };
export interface CommandBatchInput {
  state: KernelState;
  /** Untrusted at runtime: malformed commands get individual rejection outcomes. */
  commands: readonly unknown[];
  rules: KernelRules;
  terrain: KernelTerrain;
  rngState: AleaState;
}
export interface CommandBatchResult {
  nextState: KernelState;
  events: MechanicalEvent[];
  outcomes: CommandOutcome[];
  nextRngState: AleaState;
}

const key = (p: KernelPosition) => `${p.x},${p.y},${p.z}`;
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const distance = (a: KernelPosition, b: KernelPosition) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const eventId = (roomId: string, sequence: number) => `${roomId}:${sequence}`;

function requireInvariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function unique(values: string[], label: string) {
  requireInvariant(new Set(values).size === values.length, `Duplicate ${label}`);
}
function parseState(input: KernelState): KernelState {
  const state = KernelStateSchema.parse(input);
  unique(
    state.entities.map((e) => e.id),
    'entity ID'
  );
  unique(
    state.entities.map((e) => key(e.position)),
    'occupied position'
  );
  for (const entity of state.entities) unique(entity.attackIds, 'entity attack ID');
  return state;
}

/** Finite cardinal BFS; supplied cell order never influences path selection. */
function findCardinalPath(
  from: KernelPosition,
  to: KernelPosition,
  cells: Set<string>,
  occupied: Set<string>
): KernelPosition[] | undefined {
  if (from.z !== to.z || !cells.has(key(from)) || !cells.has(key(to)) || occupied.has(key(to))) return undefined;
  const queue = [from];
  const parents = new Map<string, KernelPosition | null>([[key(from), null]]);
  const offsets = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (key(current) === key(to)) {
      const path: KernelPosition[] = [];
      let step: KernelPosition | null = current;
      while (step) {
        path.push(step);
        step = parents.get(key(step))!;
      }
      return path.reverse();
    }
    for (const [dx, dy] of offsets) {
      const next = { x: current.x + dx, y: current.y + dy, z: current.z };
      const nextKey = key(next);
      if (!parents.has(nextKey) && cells.has(nextKey) && !occupied.has(nextKey)) {
        parents.set(nextKey, current);
        queue.push(next);
      }
    }
  }
  return undefined;
}

/**
 * Apply one validated outcome. Both live execution and reconstruction use this
 * reducer. It checks continuity and recorded arithmetic, and never rolls dice.
 */
function applyEvent(state: KernelState, rngState: AleaState, event: MechanicalEvent): AleaState {
  requireInvariant(
    event.roomId === state.roomId && event.worldId === state.worldId && event.rulesVersion === state.rulesVersion,
    'Event context mismatch'
  );
  requireInvariant(event.sequence === state.eventSequence + 1, 'Event sequence gap or duplicate');
  requireInvariant(event.eventId === eventId(state.roomId, event.sequence), 'Invalid event ID');
  requireInvariant(equal(event.rngBefore, rngState), 'Event RNG before-state mismatch');
  const actor = state.entities.find((e) => e.id === event.actorId);
  requireInvariant(!!actor, 'Event actor not found');
  if (event.type !== 'PASSED') requireInvariant(actor.hp > 0, 'Defeated actor cannot act');

  if (event.type === 'ENTITY_MOVED') {
    const p = event.payload;
    requireInvariant(
      equal(actor.position, p.from) && actor.movementRemainingFeet === p.movementBefore,
      'Movement before-state mismatch'
    );
    requireInvariant(equal(p.path[0], p.from) && equal(p.path[p.path.length - 1], p.to), 'Invalid movement endpoints');
    requireInvariant(
      p.path.every((point, i) => i === 0 || (point.z === p.path[i - 1].z && distance(point, p.path[i - 1]) === 1)),
      'Invalid cardinal path'
    );
    requireInvariant(
      p.costFeet === (p.path.length - 1) * 5 && p.movementAfter === p.movementBefore - p.costFeet,
      'Movement budget mismatch'
    );
    requireInvariant(
      !state.entities.some((e) => e.id !== actor.id && key(e.position) === key(p.to)),
      'Occupied movement destination'
    );
    requireInvariant(equal(event.rngBefore, event.rngAfter), 'Movement changed RNG');
    actor.position = { ...p.to };
    actor.movementRemainingFeet = p.movementAfter;
  } else if (event.type === 'ATTACK_RESOLVED') {
    const p = event.payload;
    const target = state.entities.find((e) => e.id === p.targetId);
    requireInvariant(!!target && target.id !== actor.id && target.hp > 0, 'Invalid attack target');
    requireInvariant(actor.attackIds.includes(p.action.id), 'Unsupported attack in event');
    requireInvariant(
      target.hp === p.hpBefore &&
        target.armorClass === p.targetArmorClass &&
        actor.actionsRemaining === p.actionsBefore,
      'Attack before-state mismatch'
    );
    requireInvariant(
      actor.position.z === target.position.z && distance(actor.position, target.position) * 5 <= p.action.rangeFeet,
      'Attack event out of range'
    );
    const critical = p.naturalRoll === 20;
    const hit = critical || (p.naturalRoll !== 1 && p.total >= p.targetArmorClass);
    requireInvariant(
      p.total === p.naturalRoll + p.action.attackBonus && p.critical === critical && p.hit === hit,
      'Attack roll mismatch'
    );
    requireInvariant(
      p.damageRolls.length === (hit ? p.action.damage.count * (critical ? 2 : 1) : 0) &&
        p.damageRolls.every((value) => value <= p.action.damage.sides),
      'Invalid damage dice'
    );
    const damage = hit ? Math.max(0, p.damageRolls.reduce((sum, value) => sum + value, 0) + p.action.damage.bonus) : 0;
    requireInvariant(
      p.damage === damage && p.hpAfter === Math.max(0, p.hpBefore - damage) && p.actionsAfter === p.actionsBefore - 1,
      'Attack effect mismatch'
    );
    // Verify continuation length without resolving the recorded dice outcome again.
    const continuation = Alea.fromState(event.rngBefore);
    for (let i = 0; i < 1 + p.damageRolls.length; i++) continuation.next();
    requireInvariant(equal(continuation.snapshot(), event.rngAfter), 'Attack RNG continuation mismatch');
    target.hp = p.hpAfter;
    actor.actionsRemaining = p.actionsAfter;
  } else {
    requireInvariant(equal(event.rngBefore, event.rngAfter), 'Pass changed RNG');
  }
  state.eventSequence = event.sequence;
  return { ...event.rngAfter };
}

/** Restore committed state AND RNG continuation, with no terrain lookup or reroll. */
export function replayMechanicalEvents(input: {
  state: KernelState;
  rngState: AleaState;
  events: readonly unknown[];
}): { nextState: KernelState; nextRngState: AleaState } {
  const nextState = parseState(input.state);
  let nextRngState = Alea.fromState(input.rngState).snapshot();
  for (const raw of input.events) {
    const event = MechanicalEventSchema.parse(raw);
    nextRngState = applyEvent(nextState, nextRngState, event);
  }
  return { nextState, nextRngState };
}

/**
 * Resolve the supplied order against one evolving state. Context errors throw
 * before any commands execute; command rejection changes neither state nor RNG.
 * Caller owns authentication, command order, budget grants, and atomic storage.
 */
export function resolveCommandBatch(input: CommandBatchInput): CommandBatchResult {
  const nextState = parseState(input.state);
  const rules = KernelRulesSchema.parse(input.rules);
  const terrain = KernelTerrainSchema.parse(input.terrain);
  requireInvariant(terrain.worldId === nextState.worldId, 'Terrain world mismatch');
  requireInvariant(rules.version === nextState.rulesVersion, 'Rules version mismatch');
  unique(
    rules.attacks.map((a) => a.id),
    'rule attack ID'
  );
  unique(terrain.walkableTiles.map(key), 'terrain cell');
  const attacks = new Map(rules.attacks.map((a) => [a.id, a]));
  for (const actor of nextState.entities) {
    requireInvariant(
      actor.attackIds.every((id) => attacks.has(id)),
      'Unknown actor attack definition'
    );
  }
  requireInvariant(Array.isArray(input.commands) && input.commands.length <= 10000, 'Invalid command batch');
  requireInvariant(Number.isSafeInteger(nextState.eventSequence + input.commands.length), 'Event sequence overflow');
  let nextRngState = Alea.fromState(input.rngState).snapshot();
  const cells = new Set(terrain.walkableTiles.map(key));
  const events: MechanicalEvent[] = [];
  const outcomes: CommandOutcome[] = [];
  const commandIds = new Set<string>();

  for (const [commandIndex, raw] of input.commands.entries()) {
    const parsed = KernelCommandSchema.safeParse(raw);
    const commandId =
      raw && typeof raw === 'object' && 'commandId' in raw && typeof raw.commandId === 'string' ? raw.commandId : null;
    const reject = (code: RejectionCode) =>
      outcomes.push({ commandIndex, commandId, status: 'rejected', code, eventIds: [] });
    if (!parsed.success) {
      reject('INVALID_COMMAND');
      continue;
    }
    const command = parsed.data;
    if (commandIds.has(command.commandId)) {
      reject('DUPLICATE_COMMAND');
      continue;
    }
    commandIds.add(command.commandId);
    const actor = nextState.entities.find((e) => e.id === command.actorId);
    if (!actor) {
      reject('ACTOR_NOT_FOUND');
      continue;
    }
    if (actor.hp === 0 && command.type !== 'PASS') {
      reject('ACTOR_DEFEATED');
      continue;
    }
    const sequence = nextState.eventSequence + 1;
    const base = {
      schemaVersion: 1 as const,
      rulesVersion: rules.version,
      roomId: nextState.roomId,
      worldId: nextState.worldId,
      terrainRevision: terrain.revision,
      sequence,
      eventId: eventId(nextState.roomId, sequence),
      commandId: command.commandId,
      actorId: actor.id,
      rngBefore: { ...nextRngState },
      rngAfter: { ...nextRngState },
    };
    let event: MechanicalEvent;
    if (command.type === 'MOVE') {
      const to = command.payload.targetPosition;
      if (key(actor.position) === key(to)) {
        reject('NO_MOVEMENT');
        continue;
      }
      if (actor.movementRemainingFeet < rules.feetPerTile) {
        reject('INSUFFICIENT_RESOURCE');
        continue;
      }
      const occupied = new Set(nextState.entities.filter((e) => e.id !== actor.id).map((e) => key(e.position)));
      const path = findCardinalPath(actor.position, to, cells, occupied);
      if (!path) {
        reject('PATH_BLOCKED');
        continue;
      }
      const costFeet = (path.length - 1) * rules.feetPerTile;
      if (costFeet > actor.movementRemainingFeet) {
        reject('INSUFFICIENT_RESOURCE');
        continue;
      }
      event = {
        ...base,
        type: 'ENTITY_MOVED',
        payload: {
          from: { ...actor.position },
          to,
          path,
          costFeet,
          movementBefore: actor.movementRemainingFeet,
          movementAfter: actor.movementRemainingFeet - costFeet,
        },
      };
    } else if (command.type === 'ATTACK') {
      const target = nextState.entities.find((e) => e.id === command.payload.targetId);
      if (!target) {
        reject('TARGET_NOT_FOUND');
        continue;
      }
      if (target.id === actor.id) {
        reject('INVALID_TARGET');
        continue;
      }
      if (target.hp === 0) {
        reject('TARGET_DEFEATED');
        continue;
      }
      const action = attacks.get(command.payload.actionId);
      if (!action || !actor.attackIds.includes(action.id)) {
        reject('UNSUPPORTED_ACTION');
        continue;
      }
      if (actor.actionsRemaining < 1) {
        reject('INSUFFICIENT_RESOURCE');
        continue;
      }
      if (
        actor.position.z !== target.position.z ||
        distance(actor.position, target.position) * rules.feetPerTile > action.rangeFeet
      ) {
        reject('OUT_OF_RANGE');
        continue;
      }
      const occupied = new Set(
        nextState.entities.filter((e) => e.id !== actor.id && e.id !== target.id).map((e) => key(e.position))
      );
      const path = findCardinalPath(actor.position, target.position, cells, occupied);
      if (!path || (path.length - 1) * rules.feetPerTile > action.rangeFeet) {
        reject('PATH_BLOCKED');
        continue;
      }
      const rng = Alea.fromState(nextRngState);
      const hitRoll = roll({ count: 1, sides: 20, bonus: action.attackBonus }, () => rng.next());
      const naturalRoll = hitRoll.rolls[0];
      const critical = naturalRoll === 20;
      const hit = critical || (naturalRoll !== 1 && hitRoll.total >= target.armorClass);
      const damageRoll = hit
        ? roll({ ...action.damage, count: action.damage.count * (critical ? 2 : 1) }, () => rng.next())
        : null;
      const damage = damageRoll ? Math.max(0, damageRoll.total) : 0;
      event = {
        ...base,
        rngAfter: rng.snapshot(),
        type: 'ATTACK_RESOLVED',
        payload: {
          targetId: target.id,
          action,
          targetArmorClass: target.armorClass,
          naturalRoll,
          total: hitRoll.total,
          hit,
          critical,
          damageRolls: damageRoll?.rolls || [],
          damage,
          hpBefore: target.hp,
          hpAfter: Math.max(0, target.hp - damage),
          actionsBefore: actor.actionsRemaining,
          actionsAfter: actor.actionsRemaining - 1,
        },
      };
    } else {
      event = { ...base, type: 'PASSED', payload: {} };
    }
    // Parsing detaches event payloads from working state and validates resolver output.
    event = MechanicalEventSchema.parse(event);
    nextRngState = applyEvent(nextState, nextRngState, event);
    events.push(event);
    outcomes.push({ commandIndex, commandId: command.commandId, status: 'resolved', eventIds: [event.eventId] });
  }
  return { nextState, events, outcomes, nextRngState };
}
