// ── Service locator ───────────────────────────────────────────────────────
// Re-exports from domain barrel files under instances/ for backward compatibility.
// New code should import directly from the specific barrel file:
//   import { eventBus } from '../kernel/instances/events'
//   import { keyService } from '../kernel/instances/services-core'
//   import { budgetService } from '../kernel/instances/services-extras'
export * from './instances/events';
export * from './instances/infra';
export * from './instances/services-core';
export * from './instances/services-extras';
