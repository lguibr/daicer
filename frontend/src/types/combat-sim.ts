import type { CombatState } from './combat';

export interface CombatSimulationStep {
  index: number;
  timestamp: number;
  description: string;
  state: CombatState;
}

export interface CombatSimulation {
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
