import { Command, MoveCommand, AttackCommand, SkillCheckCommand } from '../types';
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
      default:
        return {
          success: false,
          message: `Unknown command type: ${(command as { type: string }).type}`,
          events: [],
        };
    }
  }

  private handleMove(_state: GameState, command: MoveCommand): ActionResult {
    const { actorId, targetPosition } = command.payload;
    // Logic: Check bounds, check obstacles (stubbed for now)

    return {
      success: true,
      events: [
        {
          type: 'ENTITY_MOVED',
          payload: { entityId: actorId, from: { x: 0, y: 0, z: 0 }, to: targetPosition },
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {}, // In a real ECS we'd return the diff
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
    }

    return {
      success: true,
      message: isHit ? `Hit with ${action.name} for ${totalDamage} damage!` : `Missed with ${action.name}.`,
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
          },
          timestamp: Date.now(),
        },
      ],
      newStateDiff: {}, // We might want to decrement HP here in a real ECS
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
}
