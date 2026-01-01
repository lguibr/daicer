import {
  Command,
  MoveCommand,
  AttackCommand,
  SkillCheckCommand,
  CastSpellCommand,
  InteractCommand,
  LongRestCommand,
  ModifyTerrainCommand,
} from '../types';
import { GameState, ActionResult } from '../types/engine';
import { ActionType } from '../rules/actions';
import { Alea } from '../voxel/utils/math';
import { resolveAttack } from '../rules/combat';
import { findPath } from '../rules/spatial';
import { TerrainGenerator } from '../voxel/terrain-generator';
import { WorldConfig, ZLevel } from '../types';

export class ActionDispatcher {
  private rng: Alea;

  constructor(seed: string = 'default-seed') {
    this.rng = new Alea(seed);
  }

  public dispatch(state: GameState, command: Command): ActionResult {
    switch (command.type) {
      case 'MOVE':
        return this.handleMove(state, command as MoveCommand);
      case 'ATTACK':
        return this.handleAttack(state, command as AttackCommand);
      case 'SKILL_CHECK':
        return this.handleSkillCheck(state, command as SkillCheckCommand);
      case 'CAST_SPELL':
        return this.handleCastSpell(state, command as CastSpellCommand);
      case 'INTERACT':
        return this.handleInteract(state, command as InteractCommand);
      case 'LONG_REST':
        return this.handleLongRest(state, command as LongRestCommand);
      case 'MODIFY_TERRAIN':
        return this.handleModifyTerrain(state, command as ModifyTerrainCommand);
      // @ts-expect-error - ROLL_SAVE is not in standard Command union yet
      case 'ROLL_SAVE':
        // Reuse Skill Check logic or simplified version
        return this.handleSkillCheck(state, {
          ...(command as object),
          type: 'SKILL_CHECK',
          payload: {
            // @ts-expect-error - Inference on payload union is tricky here
            actorId: command.payload.actorId || command.payload.targetId, // Adapt payload
            // @ts-expect-error - stat property might be missing on some payloads
            attribute: command.payload.stat,
            difficultyClass: 10,
          },
        } as SkillCheckCommand);
      default:
        return {
          success: false,
          message: `Unknown command type: ${(command as { type: string }).type}`,
          events: [],
        };
    }
  }

  private handleMove(state: GameState, command: MoveCommand): ActionResult {
    const { actorId, targetPosition } = command.payload;
    const entity = state.entities.find((e) => e.id === actorId);

    if (!entity) return { success: false, message: 'Actor not found', events: [] };

    const targetPos = targetPosition; // Rename for clarity

    // 1. Setup Collision Checker
    let checkCollision = (p: { x: number; y: number; z: number }): boolean => {
      // Check Entities (Basic 1x1 size assumption for now)
      const occupied = state.entities.some(
        (e) =>
          e.id !== actorId &&
          Math.round(e.position.x) === p.x &&
          Math.round(e.position.y) === p.y &&
          Math.round(e.position.z) === p.z
      );
      if (occupied) return true;
      return false; // Default open if no map
    };

    // If Room Config exists, use Terrain Generator for walls
    if (state.room && (state.room as { config?: WorldConfig }).config) {
      const config = (state.room as { config: WorldConfig }).config;
      // We create a generator on the fly - assumption: seed is stable.
      // Note: This might be slow for massive batch moves, but fine for turn-based 1 action.
      const generator = new TerrainGenerator(config);

      const baseCheck = checkCollision;
      checkCollision = (p: { x: number; y: number; z: number }) => {
        if (baseCheck(p)) return true;
        // Check Terrain
        // ZLevel cast needed
        const tile = generator.getTileAt(p.x, p.y, Math.round(p.z) as ZLevel);
        return !tile.isWalkable;
      };
    }

    // 2. Find Path
    // Limit A* to 500 iterations for safety
    const path = findPath(entity.position, targetPos, checkCollision, 500);

    if (path.length === 0) {
      // No path found or blocked immediately?
      // Or maybe start equals end?
      // Fallback: If close, try direct linear check?
      // For now, fail if blocked.

      // Edge case: User clicked ON an entity or wall.
      // If target is blocked, findPath fails.
      // We should try to move adjacent to target?
      // Current behavior: Fail.
      return { success: false, message: 'Path blocked or unreachable', events: [] };
    }

    // 3. Walk the Path up to Speed
    const speed = typeof entity.speed === 'number' ? entity.speed : 30;

    // Path includes start? usually not. findPath returns [start, ... nodes, end].
    // Let's check `spatial.ts` implementation.
    // It returns `reconstructPath(current)` which pushes `curr.pos` up to start.
    // So path[0] is Start, path[last] is End.

    let traveled = 0;
    let finalPos = path[0]; // Start at 0

    // Iterate steps (skip start)
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const next = path[i];

      // Calculate cost (Diagonals = 1.414 ~ 1.5, Straight = 1)
      // D&D 5e Variant: 5-10-5? or Simple 1-1-1 (Chess)?
      // Use Euclidean for true distance cost
      const dist = Math.sqrt(
        Math.pow(next.x - prev.x, 2) + Math.pow(next.y - prev.y, 2) + Math.pow(next.z - prev.z, 2)
      );

      if (traveled + dist > speed) {
        break; // Stop here
      }

      traveled += dist;
      finalPos = next;
    }

    // 4. Update State
    const oldPos = { ...entity.position };

    // Optimization: If didn't move
    if (finalPos.x === oldPos.x && finalPos.y === oldPos.y && finalPos.z === oldPos.z) {
      return { success: false, message: 'No movement possible (blocked or 0 distance)', events: [] };
    }

    entity.position = finalPos;

    return {
      success: true,
      message: `Moved to ${finalPos.x}, ${finalPos.y}, ${finalPos.z} (${path.length - 1} steps, used ${Math.round(traveled)}/${speed}ft)`,
      events: [
        {
          type: 'ENTITY_MOVED',
          payload: {
            entityId: actorId,
            from: oldPos,
            to: finalPos,
            path: path.map((p) => ({ x: p.x, y: p.y, z: p.z })), // Send full path for viz?
            cost: traveled,
          },
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {
        entities: state.entities,
      },
    };
  }

  private handleAttack(state: GameState, command: AttackCommand): ActionResult {
    const { actorId, targetId, weaponId } = command.payload;
    const actor = state.entities.find((e) => e.id === actorId);
    const target = state.entities.find((e) => e.id === targetId);

    if (!actor || !target) {
      return { success: false, message: 'Actor or Target not found', events: [] };
    }

    if (!actor.sheet || !target.sheet) {
      return { success: false, message: 'Actors missing Character Sheets', events: [] };
    }

    // 1. Resolve using Shared Kernel Rule
    // Intent construction
    // TODO: Client should send specific ActionIntent. For now, infer it.
    // If weaponId is provided, we search for it.

    // We need to find the action ID. Engine expects actionId.
    // Allow payload to optionally send full intent? For now, we reconstruct.
    let actionId: string | undefined = weaponId;
    if (!actionId && actor.sheet.structuredActions.length > 0) {
      actionId = actor.sheet.structuredActions[0].id;
    }

    if (!actionId) {
      return { success: false, message: 'No action specified or available', events: [] };
    }

    // Prepare RNG wrapper
    // Alea.next() returns 0-1 exclusive? or uint32?
    // Alea returns 0 <= n < 1.
    const rng = () => this.rng.next();

    try {
      const result = resolveAttack(
        actor.sheet,
        target.sheet,
        { type: ActionType.Attack, actionId, targetId }, // Fallback type check inside resolveAttack will validate. Actually resolveAttack checks type match against definition.
        rng
      );

      // 2. Apply State (State Mutation)
      // resolveAttack returns 'damageTotal' but does NOT mutate 'target.sheet.hp' (it mutates local clone? No, it mutates passed reference!).
      // Wait, 'resolveAttack' takes 'CharacterSheet'. 'state.entities[i].sheet' IS that object.
      // So HP is ALREADY updated by resolveAttack!
      // Double check resolveAttack source... "target.hp = Math.max..."
      // Yes. So we just need to sync Entity.hp if it's separate from Sheet.
      // Entity interface has 'hp'. Sheet has 'hp'. They should be synced.
      target.hp = target.sheet.hp;

      // 3. Emit Event with Trace
      return {
        success: true,
        message: result.verdict + ` (${result.damageTotal} damage)`,
        events: [
          {
            type: 'ATTACK_RESULT',
            payload: {
              actorId,
              targetId,
              roll: result.attackRoll.total, // Total or Natural? Legacy was Natural. Use Total for clarity? Or expand payload.
              total: result.attackRoll.total,
              isHit: result.hit,
              isCrit: result.isCritical,
              damage: result.damageTotal,
              trace: result.trace,
            },
            timestamp: Date.now(),
          },
        ],
        newStateDiff: { entities: state.entities }, // Fully dirty for now
      };
    } catch (e) {
      return { success: false, message: (e as Error).message || 'Unknown error', events: [] };
    }
  }

  private handleSkillCheck(state: GameState, command: SkillCheckCommand): ActionResult {
    const { actorId, attribute, difficultyClass = 10, advantage, disadvantage } = command.payload;
    const actor = state.entities.find((e) => e.id === actorId);

    if (!actor) {
      return { success: false, message: 'Actor not found', events: [] };
    }

    // 1. Determine Modifier
    let modifier = 0;
    let statName = 'Flat Check';

    if (attribute) {
      // Map 'Strength' -> 'strength'
      const key = attribute.toLowerCase() as keyof typeof actor.stats;
      const score = actor.stats[key];
      if (typeof score === 'number') {
        modifier = Math.floor((score - 10) / 2);
        statName = attribute;
      }
    }
    // TODO: Skill ID check (requires skill mapping in Entity)

    // 2. Roll (Adv/Dis)
    const roll1 = Math.floor(this.rng.next() * 20) + 1;
    const roll2 = Math.floor(this.rng.next() * 20) + 1;
    let finalRoll = roll1;

    if (advantage && !disadvantage) {
      finalRoll = Math.max(roll1, roll2);
    } else if (disadvantage && !advantage) {
      finalRoll = Math.min(roll1, roll2);
    }

    const total = finalRoll + modifier;
    const success = total >= difficultyClass;

    return {
      success,
      message: success
        ? `Passed ${statName} check (${total} vs DC ${difficultyClass})`
        : `Failed ${statName} check (${total} vs DC ${difficultyClass})`,
      events: [
        {
          type: 'SKILL_CHECK_RESULT',
          payload: {
            actorId,
            statName,
            modifier,
            roll: finalRoll,
            total,
            target: difficultyClass,
            success,
            advantage,
            disadvantage,
          },
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {},
    };
  }

  private handleCastSpell(_state: GameState, command: CastSpellCommand): ActionResult {
    const { actorId, spellId, targetId } = command.payload;
    return {
      success: true,
      message: `Casted ${spellId} on ${targetId}`,
      events: [
        {
          type: 'SPELL_CAST',
          payload: { casterId: actorId, spellId, targetId }, // Map actorId to casterId for event
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {},
    };
  }

  private handleInteract(_state: GameState, command: InteractCommand): ActionResult {
    const { actorId, targetId, interactionType } = command.payload;
    return {
      success: true,
      message: `${actorId} interacted with ${targetId} (${interactionType})`,
      events: [
        {
          type: 'OBJECT_INTERACTION',
          payload: { actorId, targetId, interactionType },
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {},
    };
  }

  private handleLongRest(state: GameState, command: LongRestCommand): ActionResult {
    const { actorId, duration } = command.payload;
    const actorsToHeal = state.entities.filter((e) => e.type === 'player' || e.type === 'npc');
    for (const actor of actorsToHeal) {
      if (actor.sheet) {
        actor.sheet.hp = actor.sheet.maxHp;
        actor.hp = actor.maxHp;
      }
    }
    return {
      success: true,
      message: `Long rest completed${duration ? ` (${duration}h)` : ''}`,
      events: [
        {
          type: 'LONG_REST_COMPLETED',
          payload: { actorId, duration, healedCount: actorsToHeal.length },
          timestamp: Date.now(),
        },
      ],
      newStateDiff: { entities: state.entities },
    };
  }

  private handleModifyTerrain(state: GameState, command: ModifyTerrainCommand): ActionResult {
    return {
      success: true,
      message: 'Terrain modification queued',
      events: [
        {
          type: 'TERRAIN_MODIFIED',
          payload: command.payload,
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {},
    };
  }
}
