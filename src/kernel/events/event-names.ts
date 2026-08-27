/**
 * Re-export from the single source of truth.
 * All event names are now defined in event-registry.ts.
 * This file exists for backward compatibility — all existing
 * `import { EVENTS } from './events/event-names'` imports continue to work.
 */
export { EVENTS } from './event-registry';
export type { DomainEventMap } from './domain-events';
