# 03_COMPOSITION_ROADMAP.md

## Objective

To transform the observability stack from independent silos into a composed, contextualized ecosystem.

## Phase 1: Event Anchoring (Immediate)

- **Goal:** Link all observability services via a shared context.
- **Action:** Update the `EventBus` to inject a `correlationId` into all `COGNITIVE_*`, `DIAGNOSTIC_*`, and `CAUSAL_*` events.
- **Verification:** Ensure `TraceService` and `CausalDebugger` both log the same `requestId` for correlated actions.

## Phase 2: Diagnostic Injection (Short-term)

- **Goal:** Surface system health within traces.
- **Action:** Allow `TraceService` to call `IDiagnosticService.getAllActiveIssues()` during trace finalization (`STREAM_END` handler in `src/kernel/services/trace-service.ts:296`).
- **Data Change:** Append diagnostic finding summary to `ExecutionTrace.metadata`.

## Phase 3: Interactive Inspector (Mid-term)

- **Goal:** Bind UI components to observability data.
- **Action:** Update `StateInspectorPanel` to take a `contextId` prop, which fetches the corresponding `ExecutionTrace` or `CausalTrace` for that context.
- **Impact:** Allows developers to jump from state inspection to execution logs.

## Phase 4: Unified Observability API (Long-term)

- **Goal:** Create a single entry point for observability data.
- **Action:** Develop a new service (`ObservabilityOrchestrator`) that abstracts `TraceService`, `DiagnosticService`, and `CausalDebugger` into a single API surface for the UI.
