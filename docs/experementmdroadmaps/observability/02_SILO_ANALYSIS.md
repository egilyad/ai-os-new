# 02_SILO_ANALYSIS.md

## 1. Trace Service

- **Source:** Consumes `REQUEST_INCOMING`, `COGNITIVE_STEP_ACTIVE`, `STREAM_END` events (VERIFIED: `src/kernel/services/trace-service.ts:144,166,296`).
- **Storage:** Persists `ExecutionTrace` objects in Dexie via `TraceRepository` (VERIFIED: `src/kernel/services/trace-service.ts:112`).
- **Why Siloed:** Focuses strictly on telemetry and execution latency. It does not ingest diagnostic issues or causal metadata.

## 2. Diagnostic Service

- **Source:** Consumes `DIAGNOSTIC_COMPLETE` and interacts directly with `CognitiveIntelligenceService` (VERIFIED: `src/kernel/services/runtime-intelligence/diagnostic-service.ts:17,21`).
- **Storage:** Internal memory records (`DiagnosticRunRecord`) (VERIFIED: `src/kernel/services/runtime-intelligence/diagnostic-service.ts:29`).
- **Why Siloed:** Operates as a background heartbeat system (`runDiagnostic` interval, VERIFIED: `src/kernel/services/runtime-intelligence/diagnostic-service.ts:45`). It doesn't query the `TraceService` for correlation.

## 3. Causal Debugger

- **Source:** Manages its own `CausalScopeManager` and `CausalTimelineService` (VERIFIED: `src/kernel/service-registration/phase11-causal-debugger.ts:36,50`).
- **Storage:** Internal memory structures (`CausalTrace`) (INFERRED: Based on `ICausalTraceStore` usage).
- **Why Siloed:** High-overhead service specifically for troubleshooting router decisions. It is computationally expensive and decoupled from standard telemetry flows to prevent performance degradation.

## 4. State Inspector

- **Source:** UI-only utility (VERIFIED: `src/components/StateInspectorPanel/state-inspector-constants.ts:1-11`).
- **Storage:** None (UI view model).
- **Why Siloed:** It is a generic debugging UI tool. It lacks binding to the `TraceService` or `DiagnosticService` APIs.
