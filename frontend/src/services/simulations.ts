import type { CombatSimulation, CombatSimulationSummary } from '../types/combat-sim';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SimulationResponse {
  success: boolean;
  data?: CombatSimulation;
  error?: string;
}

interface SimulationListResponse {
  success: boolean;
  data?: CombatSimulationSummary[];
  error?: string;
}

const simulationCache = new Map<string, CombatSimulation>();

export async function fetchCombatSimulation(simulationId: string): Promise<CombatSimulation> {
  if (simulationCache.has(simulationId)) {
    return simulationCache.get(simulationId) as CombatSimulation;
  }

  const response = await fetch(`${API_URL}/api/combat/simulations/${simulationId}`);

  if (!response.ok) {
    throw new Error(`Failed to load simulation (${response.status})`);
  }

  const payload = (await response.json()) as SimulationResponse;

  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? 'Failed to load simulation');
  }

  simulationCache.set(simulationId, payload.data);
  return payload.data;
}

export function clearSimulationCache(): void {
  simulationCache.clear();
}

export async function fetchCombatSimulationSummaries(): Promise<CombatSimulationSummary[]> {
  const response = await fetch(`${API_URL}/api/combat/simulations`);

  if (!response.ok) {
    throw new Error(`Failed to list simulations (${response.status})`);
  }

  const payload = (await response.json()) as SimulationListResponse;

  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? 'Failed to list simulations');
  }

  return payload.data;
}
