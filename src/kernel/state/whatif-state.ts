export interface WhatIfStateSnapshot {
  readonly simulationCount: number;
  readonly lastSimulation: number | null;
  readonly latestTypes: string[];
}
