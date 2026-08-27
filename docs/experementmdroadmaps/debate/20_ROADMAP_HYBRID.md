# 20 — ROADMAP: HYBRID (Debate Subsystem)

> Research-only document. Read-only analysis. No source changes, no git, no commit.
> Every claim carries a `file:line` citation and a label VERIFIED / INFERRED / OPINION.
> This roadmap is the **balanced mix** of UX + cognitive + selective integration, aligning
> to Design E (Hybrid, `10_DESIGN_E.md`). It is the synthesis roadmap: each phase composes
> pieces of the UX-first (`18_`) and cognitive-first (`19_`) roadmaps into one adaptive
> product, so it implicitly depends on (and sequences after) the quick wins in both.

## Why hybrid

Design E (`10_DESIGN_E.md:3`) argues for _one_ adaptive Debate UI with progressive disclosure
(Simple→Detailed→Expert) that folds Arena (A), Mission Control (B), Cognitive Timeline (C),
and Workspace (D) into a single shell. The Hybrid roadmap therefore leads with the trust
fixes (Phase 0), unifies replay (Phase 0/1), then layers cognitive + integration behind the
disclosure tiers, and finishes with the moderator deck. Effort is balanced; risk is spread.

---

## Phase 0 — Quick Wins + Replay Unification

**Goals:** Ship the trust fixes AND make replay real, in one foundational phase.

### 0.1 — Trust fixes (from `18_ROADMAP_UX_FIRST.md` Phase 0)

- **0.1.1 Mislabeled Replay (VERIFIED):** `DebatePanel.tsx:328-338` calls
  `handleStart()` — a new run, not a replay.
- **0.1.2 Strategy deploy no-op (VERIFIED):** `DebateStrategyBuilder.tsx:145-157` only
  toasts; launch takes an enum (`debate-sync-manager.ts:200-203`), not the DSL `def`.
- **0.1.3 Inert analysis picker (VERIFIED):** `DebateAnalysisPanel.tsx:23-39` populates
  `availableSessions` only from the active session.
- **0.1.4 Global-registry slider bug (VERIFIED):** `AgentControlPanel.tsx:108-116` mutates
  the shared `agentService` registry.
- _All four are S–M, Low–M risk, and source-corrected where needed._

### 0.2 — Unified Dexie replay (from `18_` Phase 1)

- **Gap (VERIFIED):** `debate-timeline.ts:56-63` persists to localStorage
  (`BucketStorageAdapter.RESEARCH`), disjoint from Dexie `debate-engine.saveSnapshot`
  (`debate-engine.ts:697-698`, `debate-persistence-manager.ts:154-155`).
- **Gap (VERIFIED):** `DebateReplayPanel.tsx:170-179` only renders a consensus _marker_,
  no verdict payload (verdict cached at `debate-sync-manager.ts:182-184`).
- **Fix:** Point replay at `restoreSession`/`getTimeline` (`debate-engine.ts:701,705-707`)
  and join `SESSION_VERDICT` + consensus. Then `handleReplay` can finally mean replay.
- **Effort:** M. **Risk:** M. **Impact:** the headline broken feature works.

**Phase 0 rollup:** Effort M; Risk M; Impact = trust restored + replay real. Foundation for all later tiers.

---

## Phase 1 — Progressive-Disclosure Live + Cognitive Toggle

**Goals:** The Simple→Detailed→Expert shell (Design E) with cognitive overlay in Detailed.

### 1.1 — Replace `?mode=classic|runtime` fork (Design E / A)

- **Gap (VERIFIED via `10_DESIGN_E.md:16`):** `DebateArena.tsx` forks classic vs runtime
  (lines 10–100). `debateLiveStore` already feeds all tiers (`10_DESIGN_E.md:17`).
- **Fix:** Adaptive shell — Simple = arena + live stream; Detailed = + verdict + cognitive
  toggle; Expert = + control rail. Tab shell mirrors `DirectorPanel` (VERIFIED pattern,
  `AGENTS.md` B5.1).
- **Effort:** L. **Risk:** M (retire dual impl). **Impact:** onboarding + power in one UI.

### 1.2 — Cognitive overlay toggle (from `19_` Phase 0/1)

- **Gap (VERIFIED):** `cognitive:*` emitted (`cognitive-service.ts:414`) but dropped by
  recorder (`event-recorder.ts:229-232,258-261`) and bridge (`event-bridge.ts:27-34`); no
  Debate consumer. Reuse `topologyTraceStore.ts:29-51` subscription pattern.
- **Fix:** Debate-side `cognitiveTraceStore` + toggle in the Detailed tier. Display-only;
  no new engine.
- **Effort:** M. **Risk:** Low. **Impact:** reasoning visible on demand.

**Phase 1 rollup:** Effort L+M; Risk M; Impact = the Hybrid shell exists with reasoning.

---

## Phase 2 — Result View + Integration Router (crystal/forum/invocation)

**Goals:** End debates with a structured result and route to _verified-working_ sinks only.

### 2.1 — Structured result view

- **Gap (VERIFIED):** Analysis util exists (`debate-analysis`, `DebateAnalysisPanel.tsx:7`)
  but is gated behind the inert picker (Phase 0.1.3) and not presented as a post-debate
  result. `SESSION_VERDICT` is cached (`debate-sync-manager.ts:182-184`) but not rendered as
  a conclusion.
- **Fix:** Result tab joining verdict + consensus + `debate-analysis` output.
- **Effort:** M. **Risk:** Low. **Impact:** debates conclude with an answer.

### 2.2 — Integration router to verified sinks ONLY

- **Working (VERIFIED):** Crystal (`crystal-debate-bridge`), Forum case study
  (`debate:verdict:generated`), Invocation (`phase21-invocation` → `debateService`),
  Memory (`debate-memory.ts`).
- **Do NOT wire (VERIFIED/INFERRED):** Research / KnowledgeGen / Scheduler / Workflow-Builder
  (missing or broken); Forum→debate escalation is dead (`forum-service.test.ts:307` asserts
  `forum:topic:escalated-to-debate` is NOT emitted); notifications-on-verdict missing
  (INFERRED).
- **Fix:** Router exposes only the four verified sinks; surfaces the others as "planned"
  without fake wiring.
- **Effort:** M. **Risk:** Low. **Impact:** debate outputs reach the knowledge graph.

**Phase 2 rollup:** Effort M; Risk Low; Impact = debate becomes a real producer.

---

## Phase 3 — Mission-Control Moderator Deck (Design B / 07)

**Goals:** Expert tier — inject/override, pause/resume, integration rail.

### 3.1 — Consolidate existing controls

- **Verified primitives (VERIFIED):** `AgentControlPanel.tsx:118-124` injects into active
  session; engine pause/stop via `debate-sync-manager.ts:193` (`stopDebateInternal`) and
  `debate-engine` pause paths.
- **Fix:** Compose into one Expert "Control" tab; fix the global-registry bug (Phase 0.1.4)
  inside it.
- **Effort:** L. **Risk:** M. **Impact:** moderators get a console, not a scavenger hunt.

### 3.2 — Integration rail reuses Phase 2.2 router

- **Fix:** "Send outcome to…" control reuses verified sinks. No new sinks.
- **Effort:** S. **Risk:** Low. **Impact:** one action surface.

**Phase 3 rollup:** Effort L; Risk M; Impact = completes Expert tier of Hybrid.

---

## Phase 4 — Research Bridge + Scheduler Hook

**Goals:** Add the two integrations that are _nearly_ ripe, carefully.

### 4.1 — Research → Debate workspace (Design D / 09), manual first

- **Gap (INFERRED):** Auto Research→Debate bridge missing (no producer found). Manual seed
  via `startDebate` (`debate-sync-manager.ts:200`) + pull `SESSION_VERDICT` is feasible now.
- **Fix:** Workspace tab (reuse `DirectorPanel` tab pattern) for manual framing; defer
  auto-bridge until Research API is stable (`22_DEBATE_DO_NOT_BUILD_YET.md` item (h)).
- **Effort:** M. **Risk:** Low (manual) / M (auto, deferred). **Impact:** question→debate→conclusion loop.

### 4.2 — Scheduler → debate hook

- **Gap (VERIFIED/INFERRED):** Scheduler→debate integration missing. Build only after the
  N2 scheduling contract is defined (`22_` item (g)).
- **Fix:** Defer; document the trigger condition. No code now.
- **Effort:** deferred. **Risk:** avoided. **Impact:** scope discipline.

**Phase 4 rollup:** Effort M + deferred; Risk Low/avoided; Impact = the two most-likely
integrations, without over-promising.

---

## Phase 5 — Fix Workflow/Builder Breakage + Notifications Verdict

**Goals:** Repair, don't expand.

### 5.1 — Workflow/Builder debate automation

- **Gap (VERIFIED per `22_` item (e)):** Workflow/Builder debate automation is broken/dead;
  not worth building until the contract is fixed. This phase _diagnoses and fixes the
  contract_, not a new feature.
- **Fix:** Root-cause the dead path, repair the contract, then re-enable. No new engine.
- **Effort:** M. **Risk:** M. **Impact:** existing automation works again.

### 5.2 — Notifications on verdict

- **Gap (INFERRED):** No `notify` producer fires on `SESSION_VERDICT`. Add a verified,
  thin notifier subscribing to the verdict event (reuse existing notification infra if any).
- **Effort:** S–M. **Risk:** Low. **Impact:** users learn when a debate concludes.

**Phase 5 rollup:** Effort M; Risk M; Impact = closes the two known broken/missing edges.

---

## Cross-phase risk summary

- **Balanced by design:** trust (P0) → shell (P1) → value (P2) → power (P3) → edges (P4-5).
- **No new engine / judge agent / cognitive engine** anywhere (per `22_DEBATE_DO_NOT_BUILD_YET.md`).
- **Highest risk:** P1 (L, dual-impl retirement) and P3 (L, panel consolidation) — both
  M regression risk, no architectural risk.
- **Discipline:** integrations limited to verified-working sinks in P2; Research/Scheduler/
  Workflow fixed-or-deferred per `22_`.

_Labels: VERIFIED = Read/Grep on source; INFERRED = reasoned from verified neighbors;
OPINION = sequencing. Source corrected the SHARED "cognitive:decision:made dead" claim: it
is emitted (`cognitive-service.ts:414`) but dropped at recorder/bridge/consumer._
