# BIG IDEAS — "this could be amazing" features

> High-leverage features where modest integration of EXISTING capabilities yields large UX/product gain.
> Ranked by VALUE / EFFORT / EXISTING-CAPABILITY-REUSE / RISK. All grounded in verified source.
> Labels: VERIFIED (grep-confirmed) / INFERRED / SPECULATIVE. Do NOT build yet decisions: DO_NOT_BUILD_YET.

## Ranking key

VALUE: High/Med · EFFORT: Low/Med/High · REUSE: High/Med/Low (how much existing cap. is reused) ·
RISK: Low/Med (architectural). Higher REUSE = better.

---

### A1 — Silent events made visible · VALUE High · EFFORT Low · REUSE High · RISK Low

Wire subscribers to the 7 verified "dark events" (SURPRISE_DISCOVERIES): `GENERATOR_*`,
`junction:*`, `crystal:superseded/refuted`, `synthesis:exported-*`, `builder:flow:deployed`,
`SCHEDULE_TRIGGERED`, `KEY_COMPROMISED`. Each is a few lines. Turns a silent system into a reactive one.
**Why amazing:** the product already _does_ all this — it just never tells anyone.

### A2 — Living Event Backbone / Unified Audit Log · VALUE High · EFFORT Med · REUSE High · RISK Low

One `subscribeAll` (event-bus.ts:279) subscriber → Dexie `eventLog` → "Audit / Activity" panel with
deep-links (reuse RoomPanel `Open session`). VERIFIED: `eventLog` table + `subscribeAll` exist.
**Why amazing:** you can finally _see and replay_ everything the autonomous hub did, per entity.

### A3 — Notification Hub · VALUE Med-High · EFFORT Low · REUSE High · RISK Low

Reuse `system:notification` (event-registry:344) + small Zustand store + existing `AlertLayer`.
Feed from forum votes/consensus, crystal formations, invocation completions, key compromises (N8).
**Why amazing:** the system feels alive — "what changed while I was away" in one inbox.

### A4 — Knowledge Flywheel completion · VALUE High · EFFORT Med · REUSE High · RISK Low-Med

Close the dark hops: `synthesis:exported-to-crystal/forum` → actually create crystal/topic;
`junction:*` → propose crystal/bridge; `GENERATOR_*` → crystallize on confidence; `research:claim:ready`
→ propose crystal (N5). VERIFIED the source events exist and are dark.
**Why amazing:** Lens→Synthesis→Crystal→Forum becomes a real, automatic intelligence accumulator.

### A5 — Mission-Control cockpit · VALUE High · EFFORT Med · REUSE High · RISK Low

Compose the already-existing-but-siloed ops panels: DashboardPanel + LiveCognition + EventsTimeline +
HealthPanel + PoolStatusPanel + KeyTable + AlertLayer into ONE live-ops surface. VERIFIED these dirs
exist (PANEL_REVIEWS Cycle 3 inventory).
**Why amazing:** open the app and immediately grasp "what the agents are doing, right now, and is it healthy."

### A6 — Invocation as universal dispatch hub · VALUE High · EFFORT Med-High · REUSE High · RISK Med

Make Invocation the single entry that sinks Scheduler (N1), Forum escalation, and (later) Workflow (N2)

- Group (contract change, X10). VERIFIED only RoomPanel calls `invocationEngine.invoke`.
  **Why amazing:** one "invoke" verb drives debates, research, workflows, scheduled intelligence.

### A7 — Memory → Invocation continuity · VALUE High · EFFORT Med · REUSE High · RISK Med

Inject agent-scoped memory (MemoryEngine auto-stores decisions, memory-engine.ts:181-189) into invoked
sessions. VERIFIED memory auto-builds; no consumer injects it.
**Why amazing:** agents that _remember_ — the difference between a demo and a coworker.

### A8 — Research Workbench · VALUE Med-High · EFFORT Med · REUSE High · RISK Low

Surface the 12-phase research contract (VERIFIED: Fact-Check/Peer-Review/Citation-Graph/PRISMA dark in
UI) as tabs; "Debate this claim" from any contradiction → Invocation (C3). Reuse persisted
`BucketStorageAdapter.RESEARCH` data.
**Why amazing:** the research engine is a hidden epistemic powerhouse; expose it.

### A9 — Per-invocation cost attribution · VALUE Med · EFFORT Med · REUSE Med · RISK Low

Correlate `chat:stream:end` tokens + `budget:alert` to `invocationId`/`sessionRef` (N4). Extend
`Invocation` with `cost`.
**Why amazing:** accountability for autonomous spend — the missing piece for trust.

### A10 — SRE Console (AdvisorService unleashed) · VALUE Med-High · EFFORT Med · REUSE High · RISK Low

Expose AdvisorService's 51 methods (VERIFIED dormant): suggestion list + one-click `executeFix`,
live pressure heatmap, interactive what-if (add key / switch provider / change budget).
**Why amazing:** the system can _optimize itself_ — surface it.

### A11 — Cognitive bridges auto-form knowledge graph · VALUE Med-High · EFFORT Med · REUSE High · RISK Low

Junction + Crystal + Synthesis + Lenses already emit; connect them into a navigable Knowledge Graph
panel (reuse `knowledge:graph` data). VERIFIED events exist; consumer missing.
**Why amazing:** see the organism of accumulated intelligence, not 7 separate cabinets.

### A12 — Scheduler → autonomous pipelines · VALUE High · EFFORT Med · REUSE High · RISK Low

N1 + N7: scheduled research digests, nightly workflow runs, recurring debates — all via Invocation.
VERIFIED `SCHEDULE_TRIGGERED` exists and is dark.
**Why amazing:** "set it running, come back to conclusions."

---

## Bets vs speculatives

- **Bets (build soon, high reuse):** A1, A2, A3, A4, A5, A10 — mostly _add a subscriber / compose existing
  panels_; minimal new architecture.
- **Strategic (need a contract/infra step):** A6 (group target contract), A7 (memory binding), A9 (cost
  correlation), A12 (scheduler bridge) — still reuse-heavy, slightly more effort.
- **SPECULATIVE (validate before building):** A11's graph UX scale; federation/social layer (DO_NOT_BUILD X4).
