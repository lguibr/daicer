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

  private handleAttack(_state: GameState, command: AttackCommand): ActionResult {
    const { actorId, targetId } = command.payload;
    // Logic: Range check, Hit Roll vs AC
    const roll = Math.floor(this.rng.next() * 20) + 1;
    const hit = roll > 10; // Stub AC check

    return {
      success: true,
      message: hit ? 'Hit!' : 'Miss!',
      events: [
        {
          type: 'ATTACK_RESULT',
          payload: { actorId, targetId, roll, isHit: hit, damage: hit ? 5 : 0 },
          timestamp: Date.now(),
        },
      ],
    };
  }

  private handleSkillCheck(_state: GameState, command: SkillCheckCommand): ActionResult {
    const { actorId, difficultyClass = 10 } = command.payload;
    const roll = Math.floor(this.rng.next() * 20) + 1;
    const success = roll >= difficultyClass;

    return {
      success,
      message: success ? 'Success' : 'Failure',
      events: [
        {
          type: 'SKILL_CHECK_RESULT',
          payload: { actorId, roll, target: difficultyClass, success },
          timestamp: Date.now(),
        },
      ],
    };
  }
}
