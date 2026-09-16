/** Thin dependency boundary: useKeyStore explicitly lists which kernel services it consumes. */
export { eventBus } from '../kernel/events/event-bus';
export { EVENTS } from '../kernel/events/event-names';
export { keyService } from '../kernel/instances';
export { groupManager } from '../kernel/instances';
export { keyStateStore } from '../kernel/instances';
