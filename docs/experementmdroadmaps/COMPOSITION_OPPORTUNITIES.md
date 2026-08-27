# COMPOSITION OPPORTUNITIES

> Combinations of EXISTING capabilities that are currently isolated. Existing components/services/events
>
> - what's MISSING + UX sketch + complexity + value. Build on prior `CROSS_PANEL_OPPORTUNITIES.md`
>   (C1-C12) and `WORKFLOWS.md` (W1-W8). Cycle 3 adds 8 new, higher-leverage combinations grounded in the
>   verified "dark events" + the Invocation Engine hub. All labels VERIFIED/INFERRED/SPECULATIVE.

## Already documented (brief) — see source docs for detail

- C1/W7 Forum→Debate escalation · C2/W5 Scheduler→Invocation · C3/W2 Research phases→Debate ·
  C4 Agent-Group→Invocation · C5/W6 Workflow→Router/Schedule · C6/W8 Cognitive auto-bridges
  (Lens→Synthesis→Crystal→Forum) · C7 Unified Activity aggregator · C8 Command palette · C9 Key-health→
  AlertLayer · C10 SmartRouting→policy · C11 ComingSoon stubs · C12 Session-scoped feeds.

## CORRECTION (Cycle 3, VERIFIED)

- **C4 overstated:** `InvocationTarget` (`contracts/invocation.ts:14`) is only
  `{agentId}|{role}|{expertise}`; `resolveTarget()` resolves those three only. "Invoke a group" needs a
  **contract change + resolver change** first — it is NOT currently supported. (See DO_NOT_BUILD_YET X10.)
- The cognitive auto-bridge (C6/W8) is **partially live**: `crystal:formed`→Forum (`phase18-forum.ts:66`)
  and `debate:verdict:generated`→Forum (`:49`) are real; but `synthesis:exported-*`, `junction:*`,
  `crystal:superseded/refuted`, `GENERATOR_*` are dark.

## NEW COMBINATIONS (Cycle 3)

### N1 — Scheduler → Invocation (VERIFIED dead-end today)

- **Exists:** `SCHEDULE_TRIGGERED` emitted `scheduler-service.ts:300`; `invocationEngine.invoke` is the
  sole writer (`phase21-invocation.ts`). Payload carries `agentId`+`taskParams`.
- **Missing:** zero subscribers. The SchedulerPanel is a mock.
- **UX:** "Run this digest every night" → schedule → trigger → `invocationEngine.invoke` (research/debate).
- **Complexity:** Low (one subscriber + wire SchedulerPanel to real `schedulerService`).
- **Value:** High. Turns Scheduler from decoration into the autonomous hub's timer.

### N2 — Invocation → Builder Workflow (SPECULATIVE)

- **Exists:** `workflowService` registered; Builder emits `builder:flow:deployed` (dark). Invocation
  delegate currently handles chat/director-scenario/debate only (`phase21-invocation.ts:154-156`).
- **Missing:** `InvocationTarget` has no `{workflowId}`; delegate has no WorkflowService branch.
- **UX:** deployed Builder flow appears as an invocable "agent task" in RoomPanel; invoking runs the
  compiled `CompiledFlow`.
- **Complexity:** High (contract + delegate + registration + 1 registry entry).
- **Value:** High. Makes Builder output consumable (closes W6).

### N3 — Memory → Invocation continuity (INFERRED)

- **Exists:** `memory-engine` emits `MEMORY_UPDATED` on every write; entries are agent-scoped.
- **Missing:** no consumer injects memory into an invoked chat/debate session.
- **UX:** invoking an agent auto-prepends its relevant memory as system context ("remembers" prior runs).
- **Complexity:** Med (lookup in delegate/executor + UI toggle).
- **Value:** High. Gives agents continuity; memory engine stops being write-only.

### N4 — Per-Invocation cost attribution (INFERRED)

- **Exists:** `chat:stream:end` carries `tokens`/`latency`; `budget:alert` exists; `invocation:done`
  carries `resultRef` but **no cost** (event-registry:1473).
- **Missing:** no subscriber correlates tokens/budget back to `invocationId`/`sessionRef`.
- **UX:** each Room invocation card shows tokens + $; "cost per agent task" report; `budget:alert` names
  the offending invocation.
- **Complexity:** Med (correlate by `sessionRef`/`requestId`; extend `Invocation` with `cost`).
- **Value:** Med-High. Only way to make the autonomous hub accountable.

### N5 — Research → Crystal export (INFERRED)

- **Exists:** `ResearchEngineService` computes claims/synthesis/knowledge-graph; `CrystalVaultService.
propose()`/`crystallize()` exist.
- **Missing:** no code path research→crystal; `research:*` has only `research:session:updated`.
- **UX:** Research report "Crystallize finding" → proposes a Crystal from the consensus claim (reuse
  Synthesis→Crystal pattern).
- **Complexity:** Low-Med (one glue call + typed `research:claim:ready` event).
- **Value:** Med-High. Completes the knowledge loop from the research side.

### N6 — Unified cross-entity Audit Log (INFERRED)

- **Exists:** rich lifecycle events across `invocation:*`, `debate:*`, `knowledge:*`, `forum:*`,
  `conversation:*`, `synthesis:*`, `generator:*`; Dexie `eventLog` table persists them.
- **Missing:** no single store fans `subscribeAll` into one table keyed by `{entityKind, entityId}`;
  `EventsTimeline` is observability-only.
- **UX:** "Audit / Activity" panel + deep-links (reuse RoomPanel `Open session` pattern) showing every
  action on any entity, filterable by agent/room/topic.
- **Complexity:** Med (one `subscribeAll` subscriber + Dexie table + read UI).
- **Value:** High. Foundational for compliance, debugging the autonomous hub, and powers C7/C12.

### N7 — Scheduler → Builder Workflow (INFERRED)

- **Exists:** `SCHEDULE_TRIGGERED` payload has `taskParams`+`agentId`; `workflowService` runs flows.
- **Missing:** depends on N2 (Invocation→Workflow) or a parallel direct Scheduler→`workflowService`
  subscriber.
- **UX:** "Run this workflow nightly" in SchedulerPanel.
- **Complexity:** Med (depends on N2 or direct subscriber).
- **Value:** Med. Operationalizes Builder for recurring pipelines.

### N8 — Notification hub (INFERRED)

- **Exists:** `system:notification` event (event-registry:344); rich `forum:*`/`debate:consensus`/
  `crystal:formed`/`invocation:done` events. No dedicated `notification*.store` found.
- **Missing:** no subscriber turns these into toasts/inbox items.
- **UX:** Notification inbox (toast + panel) fed by forum votes/consensus, crystal formations, invocation
  completions — one hub for "what changed while I was away."
- **Complexity:** Low (subscribers + small Zustand store + existing `system:notification` sink).
- **Value:** Med-High. Cheap cohesion win; makes the event bus feel alive.

## Cross-cutting

The **Invocation Engine is the intended hub** (only RoomPanel calls `invocationEngine.invoke`). Cheapest
unblockers: **N1 (Scheduler→Invocation, VERIFIED dead-end)** and **N8 (Notification hub)**. Highest-
strategic: **N2 (Invocation→Workflow)** and **N3 (Memory→Invocation)** — make the hub genuinely useful
rather than a demo. **N6 (Audit Log)** is the foundation that unlocks observability of the whole hub.
