# 00_OBSERVABILITY_MASTER_MAP.md

## Overview

SuperAgents OS possesses a robust but fragmented observability stack comprising four distinct pillars: Traces, Diagnostics, CausalDebugger, and StateInspector. Each serves a specific purpose (telemetry, health, causality, and introspection) but operates largely in silos.

## Architectural Layers

- **Infrastructure (DAL/Storage):** `TraceRepository` (Persists via `DatabaseService`)
- **Services Layer:** `TraceService` (Telemetry), `DiagnosticService` (Health/Issues), `CausalDebugger` components (Timeline/Counterfactuals)
- **UI Layer:** `StateInspectorPanel` (Generic state viewer)

## Identified Silos

- **Traces vs. Diagnostics:** Both rely on `EventBus` but do not correlate. `TraceService` records `COGNITIVE_STEP_ACTIVE/COMPLETED` (via `src/kernel/services/trace-service.ts:166,200`), while `DiagnosticService` monitors issues from `CognitiveIntelligenceService`.
- **Debugger vs. Traces:** `CausalDebugger` (via `Phase11CausalDebugger`) tracks high-level causal events and router decisions, while `TraceService` tracks fine-grained execution steps. They lack a common anchor.
- **Inspector vs. System:** `StateInspectorPanel` is a generic UI component for state (confirmed by `src/components/StateInspectorPanel/state-inspector-constants.ts:1-11`) and lacks direct binding to trace or diagnostic service data structures.

## Top 5 Improvement Opportunities

1. **Unify Anchoring:** Correlate `TraceStep` IDs with `CausalTraceEntry` IDs.
2. **Contextual Diagnostics:** Surface `DiagnosticFinding` issues from `DiagnosticsEngine` directly within the `TraceService` UI views.
3. **Event Correlation Service:** Create an intermediate layer that aggregates events from `EventBus` into a unified observability stream.
4. **Interactive Debugging:** Allow the `StateInspector` to be triggered from a `TraceStep` to view the specific state at that time.
5. **Unified Health Reporting:** Feed `DiagnosticsEngine` findings back into the `TraceService` to mark traces as "risky" or "degraded".

## Roadmap

- **Short-term:** Link Traces to Causal IDs (via event bus tagging).
- **Mid-term:** Introduce context injection into `StateInspector`.
- **Long-term:** Full unification of observability stream.
