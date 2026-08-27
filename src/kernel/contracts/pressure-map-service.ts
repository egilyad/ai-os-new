import type { PressureLevel } from './debate-runtime';

export interface ProviderPressureEntry {
  readonly provider: string;
  readonly level: PressureLevel;
  readonly score: number;
  readonly breakdown: {
    readonly status: number;
    readonly reliability: number;
    readonly quotaPct: number;
    readonly budgetPct: number;
    readonly errorRate: number;
    readonly latency: number;
  };
  readonly updatedAt: number;
}

export interface SessionPressureEntry {
  readonly sessionId: string;
  readonly topic: string;
  readonly level: PressureLevel;
  readonly score: number;
  readonly breakdown: {
    readonly tokenPct: number;
    readonly costPct: number;
    readonly roundPct: number;
    readonly durationPct: number;
  };
  readonly updatedAt: number;
}

export interface PressureMapSnapshot {
  readonly global: {
    readonly level: PressureLevel;
    readonly score: number;
  };
  readonly providers: ProviderPressureEntry[];
  readonly sessions: SessionPressureEntry[];
  readonly alertCount: number;
  readonly timestamp: number;
}

export interface PressureTrendPoint {
  readonly timestamp: number;
  readonly score: number;
  readonly level: PressureLevel;
}

export interface PressureAlert {
  readonly scope: 'global' | 'provider' | 'session';
  readonly id: string;
  readonly level: PressureLevel;
  readonly message: string;
  readonly timestamp: number;
  acknowledged: boolean;
}

export interface IPressureMapService {
  getSnapshot(): PressureMapSnapshot;
  getProviderPressure(provider: string): ProviderPressureEntry | undefined;
  getSessionPressure(sessionId: string): SessionPressureEntry | undefined;
  getPressureHistory(scope: 'global' | 'provider' | 'session', id?: string, limit?: number): PressureTrendPoint[];
  getAlerts(): PressureAlert[];
  acknowledgeAlert(alertId: string): void;
  onPressureChange(cb: (snapshot: PressureMapSnapshot) => void): () => void;
  destroy(): void;
}
