# 01_DATA_SOURCES.md

## Inventory of Data Sources

### 1. Usage Tracker (`src/kernel/services/usage-tracker.ts`)

- **Role:** Tracks provider-level token telemetry.
- **Key Methods:**
  - `trackUsage(provider, model, tokens, cost)`: Called when usage occurs.
  - `getUsageStats()`: Aggregates records.
- **Mapping potential:** Currently tracks `timestamp`, `provider`, `model`, `tokens`, `cost`. Does not inherently know `invocationId` unless explicitly provided during `trackUsage` call.

### 2. Pricing Service (`src/kernel/services/pricing-service.ts`)

- **Role:** Centralized repository for token cost definitions (input/output).
- **Key Methods:**
  - `calculateCost(model, inputTokens, outputTokens)`: Deterministic calculation.
  - `lookup(model)`: Maps model strings to unit costs, handling provider prefixes.
- **Mapping potential:** Essential for converting token metrics into monetary values during attribution.

### 3. Budget Service (`src/kernel/services/budget-service.ts`)

- **Role:** Manages budget thresholds, alerts, and cost history.
- **Key Events:**
  - `EVENTS.STREAM_END`: The primary trigger for cost recording (`BudgetService:192`).
- **Mapping potential:** Already processes token usage events to update `costHistory`. This service is the prime location to inject attribution logic, as it already performs the `stream end` -> `cost` calculation mapping.

### 4. Invocation Records

- **Source:** `InvocationRepository` (via `InvocationEngineService`).
- **Data:** Contains the context of the user/system intent.
- **Mapping potential:** The root of the attribution tree. All costs must ultimately be linked back to the `invocationId` stored here.
