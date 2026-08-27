import type { PressureLevel } from '../contracts/debate-runtime';

export interface PressureMapStateSnapshot {
  readonly globalLevel: PressureLevel;
  readonly globalScore: number;
  readonly providerCount: number;
  readonly sessionCount: number;
  readonly alertCount: number;
  readonly timestamp: number;
}
