/**
 * Bootstrap-time shared state.
 *
 * Holds the snapshot of API keys read at bootstrap, in module scope
 * (NOT on globalThis).  This avoids exposing the raw key material to
 * any script that can read `globalThis` (XSS, browser extensions, etc.).
 *
 * Only the bootstrap module writes to it; only key-registry reads it
 * (via the accessor functions).
 *
 * The snapshot is cleared via `clearBootstrapSnapshot()` once
 * initialization is complete.
 */
import type { ApiKey } from './types/metrics-types';

let _bootstrapSnapshot: readonly ApiKey[] | null = null;
let _bootstrapPhase = false;

export function setBootstrapSnapshot(snapshot: readonly ApiKey[]): void {
  _bootstrapSnapshot = Object.freeze([...snapshot]);
  _bootstrapPhase = true;
}

export function clearBootstrapSnapshot(): void {
  _bootstrapSnapshot = null;
  _bootstrapPhase = false;
}

export function getBootstrapSnapshot(): readonly ApiKey[] | null {
  return _bootstrapSnapshot;
}

export function isBootstrapPhase(): boolean {
  return _bootstrapPhase;
}
