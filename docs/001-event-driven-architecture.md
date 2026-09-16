# ADR-001: Event-Driven Architecture

**Status**: Accepted (v1.0)  
**Date**: 2026-06-28  
**Deciders**: Architecture Team

## Context

The system needed a decoupled communication mechanism between services (chat, memory, routing, key management, debate engine). Direct service-to-service calls create circular dependencies and make the system brittle.

## Decision

Use a centralized `EventBus` as the single communication backbone:

1. All domain events go through `EventBus.emit()` / `.on()` / `.off()`
2. Event names are string constants defined in `event-registry.ts` (single source of truth; `event-names.ts` is derived), validated at runtime via Zod schemas via `onSafe<T>()`
3. Event payloads are typed interfaces per domain (`ChatEventMap`, `ProviderEventMap`, etc.)
4. Services never import each other — only contracts and events

## Consequences

- Zero circular dependencies between services
- Easy to add new consumers without modifying producers
- Runtime payload validation prevents silent failures
- Traceability: all events can be logged and replayed

## Related

- `src/kernel/events/event-bus.ts` — implementation
- `src/kernel/events/event-registry.ts` — single source of truth with Zod schemas
- `src/kernel/types/event-map.ts` — typed EventMap
