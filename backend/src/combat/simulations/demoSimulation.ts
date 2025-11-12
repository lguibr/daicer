import type { CombatState } from '@/graph/state';
import type { CombatDemoTarget } from '@/shared/spellLoadouts';
import { createCombatSession } from '../graph';
import { getSpellByIdOrThrow } from '../spell-catalog';
import type { SpellTargetInput } from '../nodes/SpellCastNode';
import { SCENARIOS } from './demoScenarioDefinitions';
import type { SimulationAction, SimulationDefinition } from './types';

export interface CombatSimulationStep {
  index: number;
  timestamp: number;
  description: string;
  state: CombatState;
}

export interface CombatSimulationResult {
  id: string;
  title: string;
  description: string;
  focus: string;
  seed: number;
  rounds: number;
  steps: CombatSimulationStep[];
  finalState: CombatState;
  createdAt: number;
}

export interface CombatSimulationSummary {
  id: string;
  title: string;
  description: string;
  focus: string;
}

function cloneState(state: CombatState): CombatState {
  return JSON.parse(JSON.stringify(state)) as CombatState;
}

function toSpellTargetInput(target?: CombatDemoTarget): SpellTargetInput | undefined {
  if (!target) return undefined;
  if (target.type === 'direction') {
    return {
      type: 'direction',
      direction: target.direction,
    };
  }
  return {
    type: 'point',
    position: { x: target.x, y: target.y },
  };
}

const SCENARIO_MAP = new Map<string, SimulationDefinition>(SCENARIOS.map((scenario) => [scenario.id, scenario]));
const simulationCache = new Map<string, CombatSimulationResult>();

async function executeAction(
  session: ReturnType<typeof createCombatSession>,
  action: SimulationAction,
  timeline: CombatSimulationStep[],
  baseTimestamp: number
): Promise<void> {
  const recordStep = (description: string) => {
    const stateSnap = cloneState(session.getState());
    timeline.push({
      index: timeline.length,
      timestamp: baseTimestamp + timeline.length,
      description,
      state: stateSnap,
    });
  };

  switch (action.type) {
    case 'note': {
      recordStep(action.description);
      break;
    }
    case 'spellPreview': {
      const spell = getSpellByIdOrThrow(action.spellId);
      if (action.grid) {
        session.setGridDimensions(action.grid.width, action.grid.height);
      }
      await session.previewSpell({
        casterId: action.casterId,
        spell,
        target: toSpellTargetInput(action.target),
        obstacles: action.obstacles,
        gridWidth: action.grid?.width,
        gridHeight: action.grid?.height,
      });
      recordStep(action.description);
      break;
    }
    case 'spellCast': {
      const spell = getSpellByIdOrThrow(action.spellId);
      if (action.grid) {
        session.setGridDimensions(action.grid.width, action.grid.height);
      }
      await session.castSpell({
        casterId: action.casterId,
        spell,
        target: toSpellTargetInput(action.target),
        obstacles: action.obstacles,
        gridWidth: action.grid?.width,
        gridHeight: action.grid?.height,
      });
      recordStep(action.description);
      break;
    }
    case 'startTurn': {
      await session.startTurn();
      let active = session.getActiveCharacter();
      if (action.expectedActorId && active?.id !== action.expectedActorId) {
        const order = session.getState().turnOrder;
        let safety = order.length + 2;
        while (action.expectedActorId && active?.id !== action.expectedActorId && safety > 0) {
          await session.endTurn();
          await session.startTurn();
          active = session.getActiveCharacter();
          safety -= 1;
        }
      }
      recordStep(action.description);
      break;
    }
    case 'move': {
      await session.moveCharacter(action.actorId, action.position);
      recordStep(action.description);
      break;
    }
    case 'attack': {
      await session.attack(action.actorId, action.targetId, {
        weaponDamage: action.weaponDamage,
        damageType: action.damageType,
      });
      recordStep(action.description);
      break;
    }
    case 'endTurn': {
      await session.endTurn();
      recordStep(action.description);
      break;
    }
    default: {
      const exhaustive: never = action;
      throw new Error(`Unhandled simulation action type ${(exhaustive as SimulationAction).type}`);
    }
  }
}

async function runSimulationDefinition(definition: SimulationDefinition): Promise<CombatSimulationResult> {
  const session = createCombatSession(definition.id, definition.seed);
  const characters = definition.createCharacters();

  await session.startCombat(characters);

  // Override initiative order for deterministic scripting
  const state = session.getState();
  state.turnOrder = [...definition.turnOrder];
  state.activeCharacterId = null;
  state.round = 1;

  const timeline: CombatSimulationStep[] = [];
  const baseTimestamp = Date.now();

  for (const action of definition.actions) {
    if (session.isCombatOver()) break;
    // eslint-disable-next-line no-await-in-loop
    await executeAction(session, action, timeline, baseTimestamp);
  }

  const finalState = cloneState(session.getState());

  return {
    id: definition.id,
    title: definition.title,
    description: definition.description,
    focus: definition.focus,
    seed: definition.seed,
    rounds: finalState.round,
    steps: timeline,
    finalState,
    createdAt: baseTimestamp,
  };
}

export function listSimulations(): CombatSimulationSummary[] {
  return SCENARIOS.map(({ id, title, description, focus }) => ({
    id,
    title,
    description,
    focus,
  }));
}

export async function getSimulationById(simulationId: string): Promise<CombatSimulationResult | null> {
  const definition = SCENARIO_MAP.get(simulationId);
  if (!definition) return null;

  if (simulationCache.has(simulationId)) {
    return simulationCache.get(simulationId) ?? null;
  }

  const result = await runSimulationDefinition(definition);
  simulationCache.set(simulationId, result);
  return result;
}
