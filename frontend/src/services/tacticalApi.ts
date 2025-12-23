// Tactical Combat API - Stubbed due to backend migration
// The backend specialized combat endpoints are currently not available.
// Operations will fail gracefully.

// Define types locally if needed to satisfy consumers, or import them
// Importing from types/combat to keep TS happy if those files exist
// But to be safe and self-contained, I'll return 'any' or matching shapes.

export const getEncounter = async (_encounterId: string): Promise<Record<string, unknown>> => {
  console.warn('Tactical combat backend not implemented', _encounterId);
  return {
    id: _encounterId,
    grid: { width: 10, height: 10, cells: [] },
    units: [],
    turnOrder: [],
    activeUnitId: null,
  };
};

export const moveUnit = async (_encounterId: string, _unitId: string, _path: unknown[]): Promise<unknown> => {
  console.warn('Move unit not implemented');
  throw new Error('Tactical movement not available');
};

export const castSpell = async (
  _encounterId: string,
  _unitId: string,
  _spellId: string,
  _target: unknown
): Promise<unknown> => {
  console.warn('Cast spell not implemented');
  throw new Error('Tactical casting not available');
};

export const endTurn = async (_encounterId: string): Promise<unknown> => {
  console.warn('End turn not implemented');
  throw new Error('Tactical turn management not available');
};

export const getCombatState = async (_roomId: string): Promise<unknown> => null;

// Stub other exports if consumers use them
// ... existing methods
export const addUnit = async (_encounterId: string, _payload: unknown): Promise<unknown> => {
  console.warn('addUnit stub');
  return { id: 'stub' };
};

export const createEncounter = async (_arenaId: string, name: string): Promise<Record<string, unknown>> => {
  console.warn('createEncounter stub');
  return { id: 'stub', name };
};

// ... existing methods
export const previewAction = async (_encounterId: string, _command: unknown): Promise<unknown> => ({
  preview: { affectedUnits: [] },
});

export const executeAction = async (
  _encounterId: string,
  _planId: string,
  _confirmed: boolean,
  _options: unknown
): Promise<unknown> => ({});

export const removeUnit = async (_encounterId: string, _unitId: string): Promise<unknown> => ({});

export const listArenas = async (): Promise<unknown[]> => [];

export const startCombat = async (_encounterId: string): Promise<Record<string, unknown>> => {
  console.warn('startCombat stub');
  return { id: _encounterId };
};

export interface ActionPreview {
  affectedUnits: unknown[];
  [key: string]: unknown;
}
