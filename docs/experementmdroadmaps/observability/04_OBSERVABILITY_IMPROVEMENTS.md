# 04_OBSERVABILITY_IMPROVEMENTS.md

Top 10 improvements to enhance observability surfacing:

1. **Inline Diagnostic Markers:** Render small warning/critical icons within `TraceStep` entries in the UI when a diagnostic issue is active for that step's time range.
2. **Causal Anchor in Traces:** Add a "Debugger" tab in the Trace details panel that loads the `CausalTrace` associated with the trace's `requestId`.
3. **State Snapshot at Error:** When `TraceService.markTraceFailed` is called, automatically trigger a state snapshot in `StateInspectorPanel` to capture the "before" state of the error.
4. **Unified Event Viewer:** Create a "Timeline View" that overlays `COGNITIVE_STEP` events, `DIAGNOSTIC_COMPLETE` heartbeats, and `CAUSAL_DECISION` events on a single X-axis.
5. **Search Correlation:** Allow searching traces by Diagnostic Finding types (e.g., "Find all traces that experienced a RateLimit finding").
6. **Provider Health Badges:** In the Trace list view, annotate traces with provider health badges fetched from `DiagnosticService.getProviderDiagnostic(provider)`.
7. **One-Click Debugging:** Add a "Debug This" button to any trace; this action should open the `CausalDebugger` focused on the trace's `requestId`.
8. **Memory Leak Telemetry:** Integrate the `heapLog` (currently internal to `TraceService`) into `DiagnosticService` so memory spikes are treated as system diagnostic findings.
9. **Trace Contextual Inspector:** Allow the State Inspector to highlight state changes _during_ a specific `TraceStep`.
10. **Persistent Trace-Causal Mapping:** Store the mapping between `ExecutionTrace.id` and `CausalTraceEntry.causalId` in the DAL to enable fast lookups.
