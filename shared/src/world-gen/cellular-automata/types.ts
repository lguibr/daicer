/**
 * Cellular Automata Parameters
 */
export interface CAParams {
  /** Initial random fill percentage (default 45%) */
  fillPercentage?: number;
  /** Number of smoothing iterations (default 5) */
  iterations?: number;
  /** Neighbors needed to become solid (default 4) */
  birthLimit?: number;
  /** Neighbors needed to stay solid (default 3) */
  deathLimit?: number;
}

/**
 * Options for CA generation
 */
export interface CAGeneratorOptions {
  /** Optional callback for progress updates */
  onProgress?: (iteration: number, maxIterations: number) => void;
  /** Optional callback for debug messages */
  onDebug?: (message: string) => void;
}
