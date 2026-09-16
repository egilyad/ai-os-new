# 07_COGNITIVE_ROLE — Cognitive event stream for `agent-designer`

> VERIFIED events (`event-registry.ts`): `COGNITIVE_TRACE_UPDATED` (`:736`), `COGNITIVE_STEP_ACTIVE`
> (`:755`), `COGNITIVE_STEP_COMPLETED` (`:763`), `COGNITIVE_DECISION_MADE` (`:776`). Writers:
> CognitiveService / TraceService / OrchestrationService. AgentService consumes `COGNITIVE_STEP_COMPLETED`
> for stats (`agent-service.ts:184`) and `STREAM_END` (`:219`). AGENTS.md: `cognitive:decision:made`
> is **dead-at-consumer**; Debate emits NO cognitive events.

## What surfaces today (VERIFIED)

- `COGNITIVE_STEP_COMPLETED` → designer's `calls/tokens/latency/errors/cost` in
  `AgentStatsDashboard` (`agent-service.ts:195-209`).
- `COGNITIVE_STEP_ACTIVE` + `COMPLETED` → `AgentJournalService` records a `JournalEntry` per step
  (`agent-journal-service.ts:130-172`). **Bug:** `agentName` stored as raw `nodeId`
  (`agent-journal-service.ts:135,160`), not "Kai Mendez".
- `LiveActivityStream` / `AgentLiveBoard` render active steps generically.

## Design-relevant cognitive signals to surface (OPINION/INFERRED)

1. **Design decisions** — if designer emits a `cognitive:decision:made` (e.g., "chose tab-bar over
   bottom-nav"), the dead consumer should be revived to render a **Design Decision log** in its
   `AgentDetailPanel`. Reuses the `CognitiveDecisionSchema` already in the registry.
2. **Accessibility/heuristic flags** — a lightweight post-step classifier could tag designer outputs
   with heuristics (WCAG/contrast/hierarchy) and surface them as a design-quality sparkline in the
   card. (INFERRED — would need a small classifier, not a new bus.)
3. **Cost-of-design** — groq/70b is cheap; the stats already compute `estimatedCost`
   (`agent-service.ts:206`). Surface "design $/turn" in the design card.

## Integration-only guidance

- **Do NOT** create a designer-specific cognitive event. Reuse the 4 existing events.
- Revive the `cognitive:decision:made` consumer (currently dead) as a generic "agent decision"
  timeline that the designer naturally populates when its prompt asks it to justify design choices.
- FIX the journal `agentName` bug so design decisions are attributable to "Kai Mendez", not a node id.
