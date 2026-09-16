/**
 * Re-export from the single source of truth.
 * All event map types are now defined in event-registry.ts.
 * This file exists for backward compatibility — all existing
 * `import type { EventMap } from './types/event-map'` imports continue to work.
 */
export type { EventMap } from '../events/event-registry';
