# 04_IMPLEMENTATION_ROADMAP.md

## Phased Implementation

### Phase 0: Data Enrichment (Foundation)

- **Goal:** Get `invocationId` to the `BudgetService` via events.
- **Tasks:**
  - Update `ChatExecutionEngine` to inject `invocationId` (from context) into `STREAM_END` events.
  - Update `BudgetService` event type definitions to include `invocationId`.

### Phase 1: Cost-Logging Bridge

- **Goal:** Link costs to invocations without breaking schema.
- **Tasks:**
  - Implement a new `InvocationCostTracker` service (or extend `BudgetService`).
  - Store mapping of `invocationId` -> `accumulatedCost` in a new Dexie table `invocationCosts`.
  - Logic to populate this table on `STREAM_END` events.

### Phase 2: UX Surface

- **Goal:** Surface the cost data in existing UI.
- **Tasks:**
  - Update `RoomPanel`/`DirectorPanel` stores to fetch cost data from `invocationCosts` using `invocationId`.
  - Render cost badges in the UI.

### Phase 3: Budget-Trigger Integration

- **Goal:** Enable budget enforcement based on invocation cost.
- **Tasks:**
  - Link `BudgetService` alerts to `InvocationEngine` so that if an invocation is forecasted to exceed a budget, it can be rejected _before_ execution.
