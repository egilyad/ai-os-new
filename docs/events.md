# EventBus Reference

## Overview

The application uses a typed EventBus for inter-module communication. All events are defined with TypeScript payload types and Zod schemas in `src/kernel/events/event-registry.ts` (single source of truth for EventMap, event-names.ts, and EventValidators).

```ts
// Kernel pattern — resolve from DI container
import { resolve } from '../kernel/container';
import type { IEventBus } from '../kernel/contracts/event-bus';
const eventBus = resolve<IEventBus>('eventBus');

// Emit
eventBus.emit('system:navigate', 'keys');

// Listen with Zod validation (recommended — validates & infers type)
import type { NotificationPayload } from '../kernel/events';
const unsub = eventBus.onSafe<NotificationPayload>(
  'system:notification',
  (data) => {
    console.log(data.message, data.type); // fully typed, validated at runtime
  },
);
unsub(); // cleanup

// Legacy import (historical — this file no longer exists)
// import { eventBus } from '../kernel/events/event-bus';
```

> **Note:** This catalog covers the primary event contracts used across kernel services and UI panels. The codebase defines ~198 named event constants in `event-registry.ts` (derived into `event-names.ts`, `EventMap`, `EventValidators`). Events for experimental, persona, research, and internal-infrastructure features exist but are not listed here exhaustively. For the complete set, see `src/kernel/events/event-registry.ts`.

## Event Catalog

### Key Management

| Event              | Payload                                      | Description                |
| ------------------ | -------------------------------------------- | -------------------------- |
| `key:loaded`       | `ApiKeyPayload[]`                            | Full key list after load   |
| `key:added`        | `Omit<ApiKey, 'id' \| 'stats'>`              | A new key was submitted    |
| `key:removed`      | `string`                                     | Key ID removed             |
| `key:updated`      | `ApiKey[]`                                   | Key list updated           |
| `key:probe:result` | `{ id, provider, status, latency?, error? }` | Single key probe completed |

### Key Groups

| Event              | Payload                   | Description                  |
| ------------------ | ------------------------- | ---------------------------- |
| `key:group:sync`   | `{ groups }`              | Key group state synchronized |
| `keystate:updated` | `{ id, provider, state }` | KeyState store updated       |
| `keystate:removed` | `{ id }`                  | KeyState store entry removed |

### Health & Telemetry

| Event                              | Payload                                                   | Description                       |
| ---------------------------------- | --------------------------------------------------------- | --------------------------------- |
| `key:health:check`                 | `string` (keyId)                                          | Trigger health check for one key  |
| `key:health:check:all`             | `void`                                                    | Trigger health check for all keys |
| `key:health:check:started`         | `string \| void`                                          | Health check began                |
| `key:health:check:completed`       | `{ id?, provider?, status? }`                             | Health check finished             |
| `key:health:check:failed`          | `{ id, provider, error }`                                 | Health check returned error       |
| `key:latency:burst`                | `{ id, provider, latency }`                               | Latency spike detected            |
| `key:quota:exceeded`               | `{ id, provider, quotaType, limit?, current?, resetAt? }` | Token or request quota exceeded   |
| `key:reputation:threshold:crossed` | `{ id, provider, score }`                                 | Reputation score below threshold  |
| `key:state:changed`                | `{ id, provider, state, previousState }`                  | Key state transition              |
| `key:compromised`                  | `{ id, provider, source }`                                | Key confirmed compromised         |
| `key:compromise:signal`            | `{ id?, fingerprint?, source? }`                          | Possible key compromise detected  |

### Virtual Keys

| Event                  | Payload                             | Description          |
| ---------------------- | ----------------------------------- | -------------------- |
| `virtual:key:created`  | `{ virtualKeyId, provider, label }` | Virtual key created  |
| `virtual:key:resolved` | `{ virtualKeyId }`                  | Virtual key resolved |
| `virtual:key:revoked`  | `{ virtualKeyId }`                  | Virtual key revoked  |

### Chat Lifecycle

| Event               | Payload                                                        | Description                         |
| ------------------- | -------------------------------------------------------------- | ----------------------------------- |
| `chat:send`         | `{ provider, model, messages, requestId?, strategy?, keyId? }` | Send a chat message                 |
| `chat:cancel`       | `{ requestId }`                                                | Cancel an in-flight request         |
| `chat:response`     | `ChatResponse`                                                 | Full response received              |
| `chat:model:select` | `{ provider, model }`                                          | User selected a model               |
| `chat:target:start` | `{ provider, model, keyId }`                                   | Start chat targeting a specific key |

### Streaming

| Event               | Payload                                                                                | Description            |
| ------------------- | -------------------------------------------------------------------------------------- | ---------------------- |
| `chat:stream:start` | `{ requestId, provider, model, keyId? }`                                               | Stream began           |
| `chat:stream:chunk` | `{ requestId, provider, chunk, keyId? }`                                               | Partial token received |
| `chat:stream:end`   | `{ requestId, fullContent, latency, tokens?, provider?, model?, keyId?, ttft?, tps? }` | Stream completed       |
| `chat:stream:error` | `{ requestId, provider, error, keyId? }`                                               | Stream failed          |

### System & Kernel

| Event                  | Payload                                | Description                                                                    |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `system:navigate`      | `string` (page)                        | Navigate to a panel                                                            |
| `system:notification`  | `{ message, type, source?, savings? }` | Toast notification                                                             |
| `system:decision`      | `DecisionPayload`                      | Router made a decision with scores, skipped providers, weights, classification |
| `system:reload`        | `{ timestamp }`                        | Trigger full re-init                                                           |
| `system:command`       | `unknown`                              | Generic command dispatch                                                       |
| `system:runtime:ready` | `{ timestamp } \| void`                | System ready signal                                                            |
| `system:shutdown`      | `{ reason? } \| void`                  | System shutdown                                                                |
| `system:data:clear`    | `void`                                 | Clear all system data                                                          |
| `kernel:updated`       | `SystemState`                          | Kernel state changed                                                           |
| `db:row-inserted`      | `{ table, id }`                        | A row was inserted into DB                                                     |

### Cognitive Pipeline

| Event                      | Payload                             | Description             |
| -------------------------- | ----------------------------------- | ----------------------- |
| `cognitive:step:active`    | `{ traceId, step, nodeId }`         | Step started            |
| `cognitive:step:completed` | `{ traceId, step, result }`         | Step finished           |
| `cognitive:decision:made`  | `{ traceId, decision, confidence }` | Cognitive decision made |
| `cognitive:trace:updated`  | `{ traceId, step, status }`         | Cognitive trace updated |

### Tools

| Event                    | Payload               | Description          |
| ------------------------ | --------------------- | -------------------- |
| `tool:execution:start`   | `{ toolId, input }`   | Tool execution began |
| `tool:execution:success` | `{ toolId, output }`  | Tool completed       |
| `tool:execution:error`   | `{ toolId, error }`   | Tool failed          |
| `tools:updated`          | `{ action, toolId? }` | Tool list changed    |

### Roles

| Event             | Payload               | Description                 |
| ----------------- | --------------------- | --------------------------- |
| `roles:updated`   | `{ action, roleId? }` | Role list changed           |
| `role:assigned`   | `{ roleId, agentId }` | Role attached to an agent   |
| `role:unassigned` | `{ roleId, agentId }` | Role detached from an agent |

### Debate Runtime

| Event                                 | Payload                                            | Description             |
| ------------------------------------- | -------------------------------------------------- | ----------------------- |
| `debate-runtime:session:created`      | `{ sessionId, topic, topologyType }`               | Session created         |
| `debate-runtime:session:started`      | `{ sessionId }`                                    | Session started         |
| `debate-runtime:session:paused`       | `{ sessionId }`                                    | Session paused          |
| `debate-runtime:session:resumed`      | `{ sessionId }`                                    | Session resumed         |
| `debate-runtime:session:cancelled`    | `{ sessionId }`                                    | Session cancelled       |
| `debate-runtime:session:completed`    | `{ sessionId, consensus }`                         | Session completed       |
| `debate-runtime:session:failed`       | `{ sessionId, error }`                             | Session failed          |
| `debate-runtime:phase:changed`        | `{ sessionId, from, to }`                          | Phase transition        |
| `debate-runtime:agent:phase:changed`  | `{ sessionId, agentId, from, to }`                 | Agent phase changed     |
| `debate-runtime:round:started`        | `{ sessionId, round, nodes[] }`                    | Round started           |
| `debate-runtime:round:ended`          | `{ sessionId, round }`                             | Round ended             |
| `debate-runtime:agent:thinking`       | `{ sessionId, agentId }`                           | Agent started thinking  |
| `debate-runtime:agent:responded`      | `{ sessionId, agentId, content }`                  | Agent responded         |
| `debate-runtime:agent:error`          | `{ sessionId, agentId, error }`                    | Agent error             |
| `debate-runtime:agent:fallback`       | `{ sessionId, agentId, fromProvider, toProvider }` | Agent provider fallback |
| `debate-runtime:agent:timeout`        | `{ sessionId, agentId, timeoutMs }`                | Agent timed out         |
| `debate-runtime:budget:updated`       | `{ sessionId, pressure, used, limit }`             | Budget updated          |
| `debate-runtime:budget:pressure`      | `{ sessionId, level, action }`                     | Pressure changed        |
| `debate-runtime:consensus:reached`    | `{ sessionId, confidence, agreements, conflicts }` | Consensus reached       |
| `debate-runtime:consensus:conflict`   | `{ sessionId, claimA, claimB }`                    | Conflict detected       |
| `debate-runtime:consensus:confidence` | `{ sessionId, confidence }`                        | Confidence updated      |
| `debate-runtime:memory:claim`         | `{ sessionId, agentId, claim }`                    | Claim recorded          |
| `debate-runtime:memory:chain`         | `{ sessionId, agentId, steps }`                    | Chain updated           |

### Debate Service (Legacy)

| Event              | Payload                           | Description                                 |
| ------------------ | --------------------------------- | ------------------------------------------- |
| `debate:started`   | `DebateSession`                   | Debate session started (legacy service)     |
| `debate:updated`   | `DebateSession`                   | Debate session state changed                |
| `debate:argument`  | `DebateArgument`                  | New argument emitted during active round    |
| `debate:consensus` | `{ topic, consensus, sessionId }` | Consensus generated after debate completion |

### Observability

| Event                                  | Payload                                                                             | Description            |
| -------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------- |
| `observability:timeline:event:added`   | `{ eventId, type, category, timestamp, title }`                                     | Timeline entry added   |
| `observability:timeline:cleared`       | `{ count, timestamp }`                                                              | Timeline cleared       |
| `observability:metrics:snapshot`       | `{ timestamp, totalRequests, totalTokens, estimatedCost, avgLatency, successRate }` | Metrics snapshot       |
| `observability:metrics:alert`          | `{ id, metric, value, severity, timestamp }`                                        | Metric alert triggered |
| `observability:metrics:alert:resolved` | `{ id, timestamp }`                                                                 | Metric alert resolved  |
| `observability:trace:created`          | `{ traceId, timestamp }`                                                            | Trace created          |
| `observability:trace:updated`          | `{ traceId, status, timestamp }`                                                    | Trace updated          |
| `observability:trace:completed`        | `{ traceId, duration, status, timestamp }`                                          | Trace completed        |
| `observability:health:changed`         | `{ status, score, timestamp }`                                                      | System health changed  |

### Advisor

| Event                          | Payload                     | Description              |
| ------------------------------ | --------------------------- | ------------------------ |
| `advisor:suggestion`           | `{ id, type, description }` | Optimization suggestion  |
| `advisor:suggestion:executed`  | `{ id, result }`            | Suggestion was applied   |
| `advisor:suggestion:dismissed` | `{ id }`                    | Suggestion was dismissed |

### Provider Runtime

| Event                     | Payload                                                                                | Description                                                      |
| ------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `provider-runtime:state`  | `{ providers[], updatedAt, totalActive, totalDegraded, totalOffline, avgSuccessRate }` | Provider runtime state snapshot                                  |
| `provider-runtime:budget` | `BudgetStateSnapshot`                                                                  | Provider budget snapshot with global/byProvider/limits/exhausted |

### Budget & Diagnostics

| Event                 | Payload                                                       | Description              |
| --------------------- | ------------------------------------------------------------- | ------------------------ |
| `budget:alert`        | `{ type, level, entity, current, limit, message, timestamp }` | Budget threshold alert   |
| `diagnostic:complete` | `{ type, severity, summary }`                                 | Diagnostic run completed |

### Settings & Configuration

| Event                        | Payload                   | Description               |
| ---------------------------- | ------------------------- | ------------------------- |
| `settings:updated`           | `{ key }`                 | User changed a setting    |
| `settings:latency-threshold` | `{ provider, threshold }` | Latency threshold updated |
| `skills:updated`             | `{ action, skillId? }`    | Skill list changed        |
| `agent:config:updated`       | `{ id, config }`          | Agent config changed      |
| `mcp:updated`                | `{ action, serverId? }`   | MCP server list changed   |

### Workspace

| Event                 | Payload               | Description              |
| --------------------- | --------------------- | ------------------------ |
| `workspace:attached`  | `{ name, fileCount }` | Workspace attached       |
| `workspace:detached`  | `{}`                  | Workspace detached       |
| `workspace:file:read` | `{ path }`            | File read from workspace |

### Trace & Router Signals

| Event           | Payload                                                    | Description                 |
| --------------- | ---------------------------------------------------------- | --------------------------- |
| `trace:updated` | `CognitiveTrace[]`                                         | Decision trace list changed |
| `router:signal` | `{ provider, success, wasRaceWinner, wasFallback, ttft? }` | Router learning signal      |

### Orchestration

| Event                     | Payload                                   | Description                |
| ------------------------- | ----------------------------------------- | -------------------------- |
| `request:incoming`        | `{ requestId, messages[] }`               | New request hit the router |
| `request:completed`       | `{ requestId, provider, model, latency }` | Request finished           |
| `system:topology:mounted` | `unknown`                                 | Topology loaded            |
| `system:node:spawn`       | `unknown`                                 | Agent node spawned         |
| `system:node:removed`     | `{ id }`                                  | Agent node removed         |

### Policy & Security

| Event              | Payload           | Description                                              |
| ------------------ | ----------------- | -------------------------------------------------------- |
| `policy:violation` | `PolicyViolation` | Guardrail alert triggered with type, severity, threshold |

### Memory

| Event            | Payload                       | Description                      |
| ---------------- | ----------------------------- | -------------------------------- |
| `memory:updated` | `{ collection, action, id? }` | Memory store changed (add/clear) |

### Snapshots

| Event               | Payload   | Description           |
| ------------------- | --------- | --------------------- |
| `snapshot:captured` | `unknown` | System snapshot taken |

### Pricing

| Event             | Payload   | Description          |
| ----------------- | --------- | -------------------- |
| `pricing:updated` | `unknown` | Pricing data changed |

## Validation & Strict Mode

Every event emitted through the kernel EventBus is validated against a Zod schema at runtime:

- **Strict mode (default: ON):** Invalid payloads are **blocked** — the event is not dispatched and an error is logged.
- **Soft mode (strictMode = false):** Invalid payloads are dispatched with a warning — useful for development.
- To toggle: `eventBus.setStrictMode(true/false)`

All events listed above have Zod schemas in `src/kernel/types/schema-types.ts` (EventValidators).

## Type-Safe Subscriptions with onSafe

Use `eventBus.onSafe<T>()` instead of raw `eventBus.on()` to get both TypeScript type inference and runtime Zod validation on incoming data:

```ts
eventBus.onSafe<NotificationPayload>('system:notification', (data) => {
  // data is typed as NotificationPayload and validated against Zod schema
});
```

`onSafe` automatically looks up the registered Zod schema, parses incoming data, and only calls your callback with valid data. If validation fails, a warning is logged but the callback still receives the raw data as a fallback.

## Wildcard Subscriptions

```ts
eventBus.on('*', ({ event, data }) => {
  console.log(`[All Events] ${event}`, data);
});
```

## Error Handling

- Validation errors in strict mode block emission and log an error.
- Callback errors are caught per-handler — a failing callback never blocks other listeners.
- Validated data replaces the original payload on successful parse.

## Important: Legacy vs Kernel EventBus

| Layer                  | Import                                      | Notes                                                                               |
| ---------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Kernel (preferred)** | `resolve<IEventBus>('eventBus')`            | Full-featured, ILogger, TraceContext, strict validation, `onSafe<T>()`              |
| **Legacy (compat)**    | `import { eventBus } from '../core/events'` | Thin re-export — same instance (also has `onSafe<T>()`), retained for compatibility |

Always use the kernel pattern in new kernel services. UI components may use either.
