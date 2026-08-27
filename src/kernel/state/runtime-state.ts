export type RuntimePhase = 'loading' | 'initializing' | 'ready' | 'degraded' | 'shutdown' | 'error';

export type RuntimeTransition =
  | { from: 'loading'; to: 'initializing' }
  | { from: 'loading'; to: 'error' }
  | { from: 'initializing'; to: 'ready' }
  | { from: 'initializing'; to: 'degraded' }
  | { from: 'initializing'; to: 'error' }
  | { from: 'ready'; to: 'degraded' }
  | { from: 'ready'; to: 'shutdown' }
  | { from: 'degraded'; to: 'ready' }
  | { from: 'degraded'; to: 'error' }
  | { from: 'degraded'; to: 'shutdown' }
  | { from: 'error'; to: 'loading' }
  | { from: 'shutdown'; to: 'loading' };

export type RuntimeTransitionFn = (current: RuntimePhase, target: RuntimePhase) => RuntimeTransition | null;

export const isValidRuntimeTransition: RuntimeTransitionFn = (current, target) => {
  const valid: Partial<Record<RuntimePhase, RuntimePhase[]>> = {
    loading: ['initializing', 'error'],
    initializing: ['ready', 'degraded', 'error'],
    ready: ['degraded', 'shutdown'],
    degraded: ['ready', 'error', 'shutdown'],
    error: ['loading'],
    shutdown: ['loading'],
  };
  const allowed = valid[current];
  if (!allowed) return null;
  if (!allowed.includes(target)) return null;
  return { from: current, to: target } as RuntimeTransition;
};

export interface RuntimeStatus {
  phase: RuntimePhase;
  uptime: number;
  startTime: number;
  servicesReady: number;
  servicesTotal: number;
  lastError: string | null;
  memoryUsage: number;
  lastTransition?: RuntimeTransition;
  transitionCount: number;
}

export type RuntimeStateChangeListener = (prev: RuntimePhase, next: RuntimePhase, transition: RuntimeTransition) => void;
