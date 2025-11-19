/**
 * BSP (Binary Space Partitioning) Types
 */

export interface BSPRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  isLeaf: boolean;
  children?: [BSPRoom, BSPRoom];
  doorPositions?: Array<{ x: number; y: number; direction: 'north' | 'south' | 'east' | 'west' }>;
}

export interface BSPParams {
  /** Minimum room dimension (default 4) */
  minRoomSize?: number;
  /** Maximum room dimension (default 12) */
  maxRoomSize?: number;
  /** How even splits are (0.5 = exactly half, default 0.4-0.6) */
  splitRatio?: number;
}

export interface BSPGeneratorOptions {
  /** Optional callback for split events */
  onSplit?: (room: BSPRoom, horizontal: boolean) => void;
  /** Optional callback for debug messages */
  onDebug?: (message: string) => void;
}
