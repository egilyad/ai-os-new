/** Thin dependency boundary: stores explicitly list which kernel services they consume. */
import { runtime as _runtime } from '../../kernel/runtime';
export { eventBus } from '../../kernel/events/event-bus';
export { EVENTS } from '../../kernel/events/event-names';
export const runtime = _runtime;

// Lazy service proxies — resolve from DI container on first property access.
// Same pattern as lazyService() in kernel/instances.ts, but imported here
// so the store has an explicit dependency boundary instead of importing
// from the global 139-export barrel.
export { executionGovernor } from '../../kernel/instances';
export { memoryService } from '../../kernel/instances';
export { workspaceService } from '../../kernel/instances';
export { sessionManager } from '../../kernel/instances';
export { getDistributedLock } from '../../kernel/services/cross-tab-lock-service';
