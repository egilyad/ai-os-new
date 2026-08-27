import type { KernelEvent } from './event-log';

export interface Projection<TState = unknown> {
  reduce(event: KernelEvent): void;
  getState(): TState;
  reset?(): void;
}
