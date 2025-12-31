import { Command, MoveCommand, AttackCommand, SkillCheckCommand, CastSpellCommand, InteractCommand } from '../types';
import { GameState, ActionResult } from '../types/engine';
import { Alea } from '../voxel/utils/math';

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
      // @ts-ignore
      case 'ROLL_SAVE':
        // Reuse Skill Check logic or simplified version
        return this.handleSkillCheck(state, {
          ...(command as any),
          type: 'SKILL_CHECK',
          payload: {
            // @ts-ignore
            actorId: command.payload.actorId || command.payload.targetId, // Adapt payload
            // @ts-ignore
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

    // 1. Calculate Distance (Euclidean)
    // Assumption: 1 unit = 1 foot (as per user request)
    const dx = targetPosition.x - entity.position.x;
    const dy = targetPosition.y - entity.position.y;
    const dz = targetPosition.z - entity.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // 2. Clamp to Speed
    // If exact diagonal is > speed, we stop at speed limit
    const speed = entity.speed || 30; // Default 30ft if not set
    let finalPos = targetPosition;

    if (dist > speed) {
      if (dist === 0) {
        // @ts-ignore
        finalPos = entity.position; // Stay put
      } else {
        const ratio = speed / dist;
        // Linear interpolation towards target, clamped at range
        finalPos = {
          x: Math.round(entity.position.x + dx * ratio),
          y: Math.round(entity.position.y + dy * ratio),
          z: Math.round(entity.position.z + dz * ratio) as any, // Cast to match strict ZLevel type
        };
      }
    }

    // 3. Update State (Mutable Engine)
    const oldPos = { ...entity.position };
    // @ts-ignore
    entity.position = finalPos;

    return {
      success: true,
      message: `Movito to ${finalPos.x}, ${finalPos.y}, ${finalPos.z}`,
      events: [
        {
          type: 'ENTITY_MOVED',
          payload: { entityId: actorId, from: oldPos, to: finalPos },
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {
        entities: state.entities, // Simplified diff strategy
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

    // 1. Determine Action
    let action = actor.actions.find((a) => a.name === weaponId);
    if (!action && !weaponId && actor.actions.length > 0) {
      action = actor.actions[0]; // Default to first
    }

    // Fallback if still no action found (shouldn't happen with Unarmed Strike fallback)
    if (!action) {
      return { success: false, message: 'No valid attack action available', events: [] };
    }

    // 2. Resolve Hit
    const attackBonus = action.toHit || 0;
    const roll = Math.floor(this.rng.next() * 20) + 1;
    const total = roll + attackBonus;
    const ac = target.ac || 10;

    const isHit = total >= ac || roll === 20;
    const isCrit = roll === 20;

    // 3. Resolve Damage
    let totalDamage = 0;
    if (isHit) {
      if (action.damage && action.damage.length > 0) {
        // Sum parts
        action.damage.forEach((part) => {
          // Parse dice: "1d8"
          const split = (part.dice || '1d6').split('d');
          const countStr = split[0];
          const faceStr = split[1];
          const count = parseInt(countStr || '1') || 1;
          const faces = parseInt(faceStr || '6') || 6;

          let rollSum = 0;
          for (let i = 0; i < count; i++) {
            let d = Math.floor(this.rng.next() * faces) + 1;
            if (isCrit) d += Math.floor(this.rng.next() * faces) + 1; // Crit rule: Roll twice
            rollSum += d;
          }
          totalDamage += rollSum + (part.bonus || 0);
        });
      } else {
        totalDamage = 1 + (action.toHit || 0); // Fallback: 1 + Mod
      }

      // Apply Damage to Target State
      target.hp = Math.max(0, target.hp - totalDamage);
    }

    return {
      success: true,
      message: isHit
        ? `Hit with ${action.name} for ${totalDamage} damage! (${target.hp} HP remaining)`
        : `Missed with ${action.name}.`,
      events: [
        {
          type: 'ATTACK_RESULT',
          payload: {
            actorId,
            targetId,
            actionName: action.name,
            roll,
            total,
            ac,
            isHit,
            isCrit,
            damage: totalDamage,
            targetHp: target.hp,
          },
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {
        entities: state.entities,
      },
    };
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
    let roll1 = Math.floor(this.rng.next() * 20) + 1;
    let roll2 = Math.floor(this.rng.next() * 20) + 1;
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
    // @ts-ignore
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
    // @ts-ignore
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
}
