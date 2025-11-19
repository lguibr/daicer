import type { CombatCharacter } from '@/graph/state';
import type { CombatDemoTarget } from '@/shared/spellLoadouts';

export type SimulationAction =
  | {
      type: 'startTurn';
      expectedActorId?: string;
      description: string;
    }
  | {
      type: 'move';
      actorId: string;
      position: { x: number; y: number };
      description: string;
    }
  | {
      type: 'attack';
      actorId: string;
      targetId: string;
      weaponDamage?: string;
      damageType?: string;
      description: string;
    }
  | {
      type: 'endTurn';
      description: string;
    }
  | {
      type: 'note';
      description: string;
    }
  | {
      type: 'spellPreview';
      casterId: string;
      spellId: string;
      description: string;
      target?: CombatDemoTarget;
      obstacles?: Array<{ x: number; y: number }>;
      grid?: { width: number; height: number };
    }
  | {
      type: 'spellCast';
      casterId: string;
      spellId: string;
      description: string;
      target?: CombatDemoTarget;
      obstacles?: Array<{ x: number; y: number }>;
      grid?: { width: number; height: number };
    };

export interface SimulationDefinition {
  id: string;
  title: string;
  description: string;
  focus: string;
  seed: number;
  turnOrder: string[];
  createCharacters: () => CombatCharacter[];
  actions: SimulationAction[];
}
