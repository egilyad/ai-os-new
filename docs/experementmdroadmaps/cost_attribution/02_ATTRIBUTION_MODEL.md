# 02_ATTRIBUTION_MODEL.md

## Correlation Logic Proposal

The attribution model centers on bridging the gap between raw execution events (`EVENTS.STREAM_END`) and the `InvocationRecord`.

### Phase 1: Event Enrichment

Ensure that all LLM callers (e.g., `ChatExecutionEngine`) propagate the `invocationId` through the event bus into the `STREAM_END` event payload.

- Current payload (`BudgetService:184-192`): `requestId`, `provider`, `model`, `tokens`, `inputTokens`, `outputTokens`, `agentId`.
- **Proposed enrichment:** Add `invocationId?: string`.

### Phase 2: Asynchronous Mapping

Since an invocation may span multiple turns and thus multiple `STREAM_END` events, the attribution must be additive:

1. **Event Listener (`BudgetService`):** Receives `STREAM_END` with `invocationId`.
2. **Attribution Aggregator:** If `invocationId` is present, it updates a temporary cache or directly updates the `InvocationRecord` (which might require a schema extension).
3. **Multi-turn handling:** If the `InvocationRecord` persists until `INVOCATION_DONE`, the total cost can be finalized and written as a static field on the record for auditability.

### Service Boundary Level Attribution

- **In-Invocation:** Sum of costs for all `STREAM_END` events sharing the same `invocationId`.
- **Pre-Invocation:** Initial cost estimation based on prompt size (`PricingService:184`) stored as "pending" on the `InvocationRecord` to provide immediate feedback.
- **Post-Invocation:** Final cost based on actual tokens, reconciled with the estimate.
