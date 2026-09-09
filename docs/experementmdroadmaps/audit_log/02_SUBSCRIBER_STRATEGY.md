# 02_SUBSCRIBER_STRATEGY.md

## EventBus Integration

To avoid overloading, the Audit Log service should NOT listen to every event individually via `eventBus.subscribeAll()`.

## Strategy

1. **Middleware Hook**: Inject a dedicated `AuditLogMiddleware` into the `EventBus` (`src/kernel/events/event-bus.ts`). This is more efficient than subscription.
2. **Filtering**: Use a blacklist/whitelist approach in `event-registry.ts` to ignore noisy streaming events (`stream:*`, `debate:runtime:agent:chunk`).
3. **Buffering**: Collect events in memory (`300` events or `1000ms`) before performing a bulk write to Dexie (`idb`).
4. **Asynchronous Processing**: Process the buffer in a background micro-task to avoid blocking the main EventBus flow.
