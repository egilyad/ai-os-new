# 18 — ROADMAP: UX-FIRST (Debate Subsystem)

> Research-only document. Read-only analysis of the SuperAgents OS Debate subsystem.
> No source changes, no git, no commit. Every claim carries a `file:line` citation and a
> label `VERIFIED` (confirmed by Read/Grep on actual source), `INFERRED`, or `OPINION`.
> Where the provided SHARED context disagreed with the source, the source wins.

## Guiding principle

Prioritize UX polish and repair of _already-shipped-but-broken_ surfaces before any new
backend capability. The Debate subsystem already has a deep backend (`debate-engine.ts`,
~120 services in `debate-runtime/`) — the breakage is in the _presentation and wiring_
layer. This roadmap fixes the user-visible lies first.

---

## Phase 0 — Quick Wins (label: trust rebuild)

**Goals:** Stop the UI from telling users untrue things. Four small, high-confidence fixes.

### 0.1 — Mislabeled "Replay" button actually re-runs the debate

- **Gap (VERIFIED):** `DebatePanel.tsx:328-338` — `handleReplay` reads `lastSessionRef`,
  repopulates topic + selected agents, then calls `queueMicrotask(() => handleStart())`.
  It does **not** replay stored events; it launches a _new_ debate with the same inputs.
  The button label says "Replay" but the behavior is "Restart".
- **Fix:** Either (a) relabel the control to "Restart Debate" / "Run Again", or
  (b) route it to the real replay engine (`DebateReplayPanel`) reading persisted timeline.
  Quickest correct move = relabel + keep behavior, deferring true replay to Phase 1.
- **Effort:** S (string + intent).
- **Risk:** Low. Pure label/intent fix; no behavioral regression.
- **Expected impact:** Users stop being surprised by a fresh (and billable) LLM run when
  they expected a free replay.

### 0.2 — Strategy Builder "Deploy" is a no-op

- **Gap (VERIFIED):** `DebateStrategyBuilder.tsx:145-157` — `handleDeploy` builds a
  `def` via `buildStrategy()`, calls `strategyRegistry.validate(def)`, and on success only
  `showToast('Deployed: ...')`. Nothing registers the strategy with a running pipeline.
- **Disconnect (VERIFIED):** `debate-sync-manager.ts:200-203` — `startDebate(...)` accepts
  `strategy: DebateStrategy = 'round_robin'`, an **enum/string**, not the DSL `def` the
  builder produces. The DSL and the launch path are disjoint.
- **Fix:** Until the DSL can drive `startDebate`, either disable/hide "Deploy" or change it
  to "Save to registry" and surface `strategyRegistry`-registered strategies in the launch
  picker. Do **not** claim deployment.
- **Effort:** S–M (hide/relabel now; real wiring is Phase 2/3 of other roadmaps).
- **Risk:** Low for hiding; M if attempting real wiring (DSL→launch contract needed).
- **Expected impact:** Removes a button that promises capability the system cannot deliver.

### 0.3 — Debate Analysis session picker is effectively inert

- **Gap (VERIFIED):** `DebateAnalysisPanel.tsx:23-39` — `availableSessions` is populated
  **only** from `debateService.getActiveDebateSession()` (line 26-29), i.e. a single entry.
  The `<select>` (lines 144-163) can therefore only ever show the _currently active_ debate;
  historical sessions are not loadable, so the picker's promise of "pick a session to
  analyze" is hollow.
- **Fix:** Populate `availableSessions` from `sessionManager.getDebateHistory()` (which
  already exists) so the picker is meaningful, and ensure `runAnalysis` (lines 41-59) reads
  the selected historical session's arguments (it already falls back to history at
  line 47-48 — only blocked by the empty list).
- **Effort:** S (data-source fix).
- **Risk:** Low. Uses existing `getDebateHistory()`.
- **Expected impact:** Analysis panel becomes useful for past debates, not just the live one.

### 0.4 — Agent Control sliders mutate the global agent registry

- **Gap (VERIFIED):** `AgentControlPanel.tsx:108-116` — `handleTempChange`/`handleMaxTokensChange`
  call `agentService.updateAgent(agentId, { temperature/maxTokens })` directly. This mutates
  the **shared global registry**, so a tweak for one debate leaks into every other debate and
  future sessions.
- **Fix:** Stage slider values locally and only apply them to the _active session's_ agent
  override (the engine already supports per-session agent config), or persist overrides in
  the session snapshot, not the global registry.
- **Effort:** M (needs a session-scoped override path).
- **Risk:** M — changing the persistence target can affect other consumers of
  `agentService`; must verify no caller relies on the global mutation side-effect.
- **Expected impact:** One user's tuning no longer silently corrupts another debate.

**Phase 0 rollup:** Effort S–M total; Risk Low–M; Impact = restored baseline trust.
All four are VERIFIED gaps in the presentation/wiring layer, not the engine.

---

## Phase 1 — Real Replay Unification

**Goals:** Make "Replay" actually replay, from a single source of truth, with consensus/verdict.

### 1.1 — Unify replay source on Dexie (not localStorage)

- **Gap (VERIFIED):** `debate-timeline.ts:56-63` persists via
  `BucketStorageAdapter.RESEARCH.set(...)` — localStorage, capped at ~500 (line 61) / ~100
  (line 71) entries. This is **disjoint** from the Dexie `debate-session-store` that
  `debate-engine.saveSnapshot` uses (`debate-engine.ts:697-698`,
  `debate-persistence-manager.ts:154-155`). Replay cannot read the canonical store.
- **Fix:** Point `DebateReplayPanel` at Dexie `restoreSession` (`debate-engine.ts:701`)
  - `getTimeline` (`debate-engine.ts:705-707`) so replay matches the real run.
- **Effort:** M.
- **Risk:** M — timeline shape in Dexie vs the localStorage shape the panel currently
  consumes must be reconciled.
- **Expected impact:** Replays are faithful and survive reload/size caps.

### 1.2 — Surface consensus & verdict in the replay timeline

- **Gap (VERIFIED):** `DebateReplayPanel.tsx:170-179` — `consensus:reached` only pushes a
  generic "Consensus reached" _marker_; there is no consensus payload or verdict rendering.
  Verdict data exists (`debate-sync-manager.ts:182-184` caches `payload.verdict` for
  `SESSION_VERDICT` events) but the replay path does not join it.
- **Fix:** Join `SESSION_VERDICT`/consensus payloads into the replay timeline rendering so
  users see _what_ was concluded, not just that something concluded.
- **Effort:** M.
- **Risk:** Low–M.
- **Expected impact:** Replay becomes a real analytical artifact, not a chat scrubber.

### 1.3 — Retire the fake Replay button (consume 1.1/1.2)

- After 1.1/1.2, `DebatePanel.handleReplay` (Phase 0.1) can be repointed to the real replay
  engine, finally making the label true. Closes the Phase 0.1 trust gap properly.
- **Effort:** S (once 1.1/1.2 land).
- **Risk:** Low.
- **Expected impact:** "Replay" means replay.

**Phase 1 rollup:** Effort M; Risk M; Impact = the single most-requested broken feature works.

---

## Phase 2 — Progressive-Disclosure Live (Design A / live-realtime)

**Goals:** Give observers a Simple→Detailed→Expert live view instead of the brittle
`?mode=classic|runtime` fork. Grounded in Design A (Arena) and the live-realtime UX doc
(`docs/experementmdroadmaps/usability/06_LIVE_REALTIME_UX.md`, INFERRED-thrust: progressive
disclosure for live streams).

### 2.1 — Replace the `?mode=classic|runtime` fork with an in-app disclosure switch

- **Gap (VERIFIED via design E baseline):** `10_DESIGN_E.md:16` states `DebateArena.tsx`
  forks into `classic` vs `runtime` modes (lines 10–100) — a brittle split.
- **Fix:** One adaptive shell (Simple = arena columns + live stream; Detailed = + verdict;
  Expert = + control rail). Reuses `debateLiveStore` telemetry already produced
  (`10_DESIGN_E.md:17` — `agentEvents`/`emotions`/`confidence` at lines 451–453).
- **Effort:** L.
- **Risk:** M — must retire two implementations without losing either's features.
- **Expected impact:** New users are not dumped into the expert view; power users can drill in.

### 2.2 — Live stance/confidence stream without full re-render thrash

- **Gap (INFERRED):** The live store produces rich telemetry but no verified thinning/
  virtualization exists for long debates; large agent-event arrays risk the OOM class of
  bugs already seen elsewhere (see `AGENTS.md` runtime-hardening: `debateLiveStore.ts` caps
  `agentEvents[].content` to 2000 chars — VERIFIED there).
- **Fix:** Virtualize the live stream + cap rendered history; reuse the existing 2000-char
  cap pattern.
- **Effort:** M.
- **Risk:** Low.
- **Expected impact:** Smooth live view during 10-agent debates.

**Phase 2 rollup:** Effort L+M; Risk M; Impact = tames panel sprawl, onboarding for observers.

---

## Phase 3 — Result View + Integration Router (Design 14 / result+integration)

**Goals:** After a debate, show a structured result and let the user route outcomes to the
modules that already integrate.

### 3.1 — Structured result view (verdict, consensus, key arguments, fallacies)

- **Gap (VERIFIED):** Analysis exists (`debate-analysis` util, `DebateAnalysisPanel.tsx:7`)
  but is gated behind the inert picker (Phase 0.3) and not presented as a post-debate
  "result." No canonical result panel consuming `SESSION_VERDICT` + consensus.
- **Fix:** A result tab that joins `SESSION_VERDICT` (`debate-sync-manager.ts:182-184`),
  consensus marker, and `debate-analysis` output into one view.
- **Effort:** M.
- **Risk:** Low.
- **Expected impact:** Debates end with an answer, not a scrollback.

### 3.2 — Integration router to modules that already integrate

- **Verified integrations (VERIFIED):**
  - Crystal: `crystal-debate-bridge` auto-proposes crystals from verdicts
    (`AGENTS.md` Module 2; bridge exists).
  - Forum case study: `forum-service` bridge on `debate:verdict:generated`
    (`AGENTS.md` Module 6).
  - Invocation: `phase21-invocation` hands `debate` to `debateService`
    (`AGENTS.md` Step 5).
  - Memory: `debate-memory.ts` / `debate-memory-extractor.ts` exist.
- **Broken/missing integrations (VERIFIED/INFERRED):**
  - Research bridge — missing (no producer found; not in integration list).
  - KnowledgeGen — missing/broken.
  - Scheduler→debate — missing.
  - Workflow/Builder debate automation — broken/dead (`22_DO_NOT_BUILD_YET.md` item (e)).
  - Forum→debate escalation — declared dead (`forum:topic:escalated-to-debate` only
    referenced by a test asserting it is NOT emitted; `forum-service.test.ts:307`).
  - Notifications on verdict — missing (INFERRED; no `notify` producer on verdict found).
- **Fix:** Router exposes only the **verified-working** sinks (Crystal / Forum-case-study /
  Invocation / Memory). Do **not** add Research/KnowledgeGen/Scheduler/Workflow/Forum-escalation
  until their contracts are fixed (see `22_DEBATE_DO_NOT_BUILD_YET.md`).
- **Effort:** M (UI + verified sinks only).
- **Risk:** Low (only wiring existing, working bridges).
- **Expected impact:** Debate outputs actually flow into the knowledge graph.

**Phase 3 rollup:** Effort M; Risk Low; Impact = debate becomes a producer, not a dead-end.

---

## Phase 4 — Cognitive Timeline Toggle (Design C / 08)

**Goals:** Let users overlay the reasoning/cognitive stream onto the live or replay view.

### 4.1 — Surface the existing `cognitive:*` stream in Debate UI

- **Gap (VERIFIED):** `cognitive:*` events (`event-registry.ts:737-776`, incl.
  `COGNITIVE_DECISION_MADE` at :776, emitted at `cognitive-service.ts:414`) are
  **excluded** from the event recorder (`event-recorder.ts:229-232, 258-261`) and from the
  event bridge (`event-bridge.ts:27-34`). No Debate panel consumes them. So the
  reasoning trace is produced but never reaches a Debate view or durable storage.
- **Fix:** Add a Debate-side `cognitive` join store (mirroring `topologyTraceStore.ts:29-51`
  which already subscribes to `cognitive:step:active`/`completed`) and a toggle to overlay
  it on the timeline. _Display-only_ — no new engine (per `19_ROADMAP_COGNITIVE_FIRST.md`).
- **Effort:** M.
- **Risk:** Low–M (must decide whether to also record cognitive events; currently dropped).
- **Expected impact:** Users see _why_ agents argued, not just _what_ they said.

### 4.2 — Toggle in the Detailed/Expert disclosure tier (ties to Phase 2)

- **Fix:** The cognitive overlay is the "Detailed" addition to the Phase 2 shell.
- **Effort:** S (once 4.1 + Phase 2 exist).
- **Risk:** Low.
- **Expected impact:** Reasoning transparency is opt-in, not forced.

**Phase 4 rollup:** Effort M; Risk M; Impact = differentiates Debate from a chat log.

---

## Phase 5 — Mission-Control Moderator Deck (Design B / 07)

**Goals:** Expert-tier moderator controls: inject/override, pause/resume, integration rail.

### 5.1 — Promote existing inject/override into a coherent deck

- **Verified primitives (VERIFIED):**
  - `AgentControlPanel.tsx:118-124` already injects text into the active session via
    `debateService.getActiveDebateSession()`.
  - Engine supports pause/stop (`debate-engine.ts` pause paths; `debate-sync-manager.ts`
    `stopDebateInternal` at :193).
- **Fix:** Compose these into a single Expert-tier "Control" tab (Design E's tab shell,
  `10_DESIGN_E.md:30`) rather than scattered panels. Fix the global-registry bug from
  Phase 0.4 inside this deck.
- **Effort:** L.
- **Risk:** M — consolidates several panels; regression surface.
- **Expected impact:** Moderators get a real console instead of hunting panels.

### 5.2 — Integration rail (reuses Phase 3.2 router)

- **Fix:** The Expert rail's "send outcome to…" control reuses the verified integration
  router. No new sinks.
- **Effort:** S (reuse).
- **Risk:** Low.
- **Expected impact:** One place to act on a debate.

**Phase 5 rollup:** Effort L; Risk M; Impact = completes the Simple→Expert adaptive product.

---

## Cross-phase risk summary

- **Highest-risk phase:** Phase 2 (L, dual-implementation retirement) and Phase 5 (L,
  panel consolidation). Both have M regression risk but no new-engine risk.
- **All phases reuse existing architecture:** `debateLiveStore`, `debate-engine`
  snapshot/timeline, `cognitive:*` events, and the verified integration bridges. No new
  engine, no new judge agent, no new cognitive engine (per `22_DEBATE_DO_NOT_BUILD_YET.md`).
- **Quickest trust payoff:** Phase 0 (S–M, Low risk) should ship first.

_Labels: VERIFIED = confirmed via Read/Grep on source; INFERRED = reasoned from verified
neighbors; OPINION = prioritization judgment. Source cited over provided text where they
differed (notably `cognitive:decision:made` IS emitted at `cognitive-service.ts:414` but is
dropped by recorder/bridge — corrected here)._
