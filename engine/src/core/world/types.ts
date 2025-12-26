export interface HistoricalPeriod {
  name: string;
  startYear: number;
  endYear: number;
  description: string;
}

export interface WorldCondition {
  id: string;
  name: string;
  description: string;
  type: string;
}

export interface Structure {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
}

export interface Road {
  id: string;
  points: { x: number; y: number }[];
}
