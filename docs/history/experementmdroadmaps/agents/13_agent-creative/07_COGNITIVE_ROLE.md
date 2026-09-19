# 07_COGNITIVE_ROLE — Cognitive event stream for `agent-creative`

## CURRENT (VERIFIED)

The cognitive event stream has **4** producer events (`event-registry.ts`):
`COGNITIVE_TRACE_UPDATED` (736), `COGNITIVE_STEP_ACTIVE` (755), `COGNITIVE_STEP_COMPLETED`
(763), `COGNITIVE_DECISION_MADE` (776).

How `agent-creative` relates:

1. **`COGNITIVE_STEP_COMPLETED`** — emitted with `nodeId:'agent-creative'` whenever it
   finishes an LLM step. **Consumers:**
   - `AgentService` tallies stats (`agent-service.ts:184-210`).
   - `AgentJournalService` records a journal entry (`agent-journal-service.ts:150-172`).
   - `TraceService` / `CognitiveService` / `OrchestrationService` (per AGENTS.md) build the
     cognitive trace. **VERIFIED** that AgentService + AgentJournal consume it.
2. **`COGNITIVE_STEP_ACTIVE`** — consumed by `AgentJournalService` to open an
   `in_progress` entry (`agent-journal-service.ts:130-147`).
3. **`COGNITIVE_DECISION_MADE`** — **DEAD-at-consumer** (AGENTS.md). `agent-creative`
   never emits it; there is no "creative decision" event.
4. **Debate path emits NO cognitive events.** During a debate, `agent-creative` produces
   `debate:*` events, not `cognitive:*` (AGENTS.md: "Debate emits NO cognitive events").
   So its debate contributions are invisible to the cognitive trace.

## What should be surfaced (RECOMMENDED — display/integration only)

No new events needed (scope discipline: AGENTS.md warns against 25 mini-frameworks). The
gap is **presentation**, not emission:

- **Surface `COGNITIVE_STEP_COMPLETED` for `agent-creative` in a dedicated "Creative
  activity" feed** reusing `AgentJournalService.listByAgent('agent-creative')`
  (`agent-journal-service.ts:253`) — already available, just not shown creatively.
- **Map creative steps to a lens-style view:** since `lens:optimistic` /
  `lens:meta-uncertainty` exist, show whether creative outputs were later refuted/crystallized
  (link journal → crystal verdicts via `crystal-debate-bridge`). Reuse, don't build new.
- **Emit (optional, OPINION) a `COGNITIVE_DECISION_MADE` when the Director override/branch
  picks `agent-creative`** — but only if a real consumer exists; otherwise leave dead.

## Integration-only recommendation

Add a read-only **"Creative Trace" tab** in `AgentDetailPanel` that:

- reads `AgentJournalService.listByAgent('agent-creative')`,
- joins `crystal`/`forum` records where `agentId` matches (AuthorBadge already resolves
  identity),
- shows divergence→convergence (creative draft → critic review → crystal formation).
  All data already exists; only a UI view is missing.
