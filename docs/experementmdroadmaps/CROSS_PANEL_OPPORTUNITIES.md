# SuperAgents OS — CROSS-PANEL OPPORTUNITIES (Phase 6)

> Research-only. Synthesizes the connector map: which panels/subsystems should hand off to
> which, and the one missing link that unblocks each. Builds on `WORKFLOWS.md` (W1–W8) and
> `SERVICE_REVIEW.md`. Companion: `00_MASTER_IMPROVEMENT_MAP.md`.
>
> **Cycle 2 — cross-panel.** Connector taxonomy + prioritized opportunity list.

---

## 1. The hub model

Trace evidence from Phases 2–5 shows a clear **center of gravity**: the **Invocation Engine + Room**
(`invocation-engine-service.ts`, `RoomPanel`) is already the only subsystem designed to dispatch into
_any_ execution target (chat / debate / director-scenario). Everything that "should be automatable or
agent-invoked" should funnel through it:

```
Forum ──(escalate)──┐
Scheduler ─(trigger)├──▶ Invocation Engine ─▶ chat | debate | director-scenario
Workflow step ──────┘        │
Agent Group ─────────────────┘ (target.kind: 'group')
```

Today only RoomPanel uses it. **R-04 / R-13 / R-21 / R-23 / R-26** all converge on "route more things through Invocation."

---

## 2. Connector opportunities (prioritized)

### C1 — Forum → Debate escalation (P0, M) — W7

- **Link:** `ForumPanel` "Escalate to debate" → `forumService.getConsensus(topicId)` → if `contested` → `invocationEngine.invoke({ mode:'debate', context:{type:'forum-topic', ref}, reason: title })`.
- **Reuses:** `forum-service.ts:262` (getConsensus), existing `forum:topic:escalated-to-debate` event (AGENTS.md Phase 6), Invocation debate mode (Step 5 integration).
- **Why now:** backend complete on both ends; only the UI button + 1 glue call missing. Flagship cohesion win. (R-03/R-23)

### C2 — Scheduler → Invocation (P1, S) — W5

- **Link:** subscriber for `SCHEDULE_TRIGGERED` → `invocationEngine.invoke` with `taskParams.prompt` + `agentId`.
- **Reuses:** `scheduler-service.ts:300` (emits), `invocationEngine` (registered phase21).
- **Why now:** turns a dead subsystem into periodic agents/digests. ~30 lines of glue. (R-13/R-21)

### C3 — Research phases → UI + → Debate (P0, M) — W2

- **Link (expose):** Research session view gains tabs: Systematic Review, Fact-Check, Anomalies, Peer Review, Citations (bibtex/apa/mla/chicago), Knowledge Graph. All computed in `research-engine-service.ts:374–544`.
- **Link (hand-off):** report "contested claim" → "Debate this" → Invocation debate mode (reuse C1 path). (R-01/R-14)

### C4 — Agent Group → Invocation (P2, M) — W-not-yet

- **Link:** `invocationEngine` accepts `target.kind:'group'` → resolve `AgentGroup` + run its `executionPattern` (consensus/debate/pipeline) from `agent-service.ts:25`.
- **Why now:** unlocks "invoke a debate team" from Room without re-implementing orchestration. (R-26)

### C5 — Workflow → Router + Template + Schedule (P1, M) — W6

- **Link:** (a) `WorkflowPanel` shows `getRuns()` history; (b) "save as template" → `template-sharing-service`; (c) "schedule" → Scheduler (C2); (d) route steps through `RouterService` so cost/fallback apply (optional).
- **Why now:** workflow data already persisted; only presentation + 2 buttons missing. (R-08/R-25)

### C6 — Cognitive pipeline auto-bridges (P1, M) — W8

- **Link (event-driven):** Lens `lens:applied` → suggest Synthesis; Synthesis `zone:consensus` → suggest Crystallize; Crystal `formed` → auto-post Forum announcement topic (extend existing `knowledge:crystal:formed`→announcement bridge). Reuse `crystal-debate-bridge` pattern.
- **Why now:** each stage already emits events; add suggestion chips + 1 auto-post. (R-09)

### C7 — Unified "Activity / History" aggregator (P1, M) — W-cross

- **Link:** a single panel aggregating debates, conversations (Director), invocations (Room), workflows (runs), research sessions, forum topics — each row deep-links to its source panel (reuse existing `Open session` navigation pattern from RoomPanel).
- **Why now:** most subsystems already persist; aggregation is a read+deep-link layer. (R-15)

### C8 — Unified "Quick Actions" / Command Palette (P2, S–M)

- **Link:** extend existing `CommandPalette` to jump to any panel/agent/debate/topic/invocation and fire common actions (invoke agent, start debate, run workflow).
- **Why now:** discoverability is the #1 navigation complaint (master map R-12); palette is cheap. (R-11)

### C9 — Provider/Key health → AlertLayer (P1, S) — nightly IN-06/UX-06

- **Link:** `KEY_COMPROMISED` / key-state events → a dismissible `AlertLayer` banner (reuse existing notification store). Today emitted, unconsumed.
- **Why now:** pure subscriber; high trust payoff. (R-18)

### C10 — SmartRouting → live policy (P1, M) — SERVICE_REVIEW §5

- **Link:** merge `SmartRoutingService` rules into `RoutingPolicyService` (which `RouterRankingService` already consumes, provider-router.ts:144), OR relabel the panel as a simulator with an "Apply" button.
- **Why now:** removes a misleading dead-control and unifies 2 routers. (R-07/R-24)

### C11 — ComingSoon stub consolidation (P2, S) — W1

- **Link:** hide ~30 `ComingSoonPanel` debate sub-panels behind a single "Experimental" section or mark each with a roadmap tag; reduce nav noise.
- **Why now:** surface currently over-promises (master map R-17).

### C12 — Session-scoped live feeds (P1, M) — W3

- **Link:** a shared `SessionScopedStore` so Room/Debate/Forum live feeds are keyed by `sessionRef` (fixes FE-07 unscoped feed, and helps Director checkpoints FE-09). (R-06)

---

## 3. Connector dependency graph (what unblocks what)

```
C2 (Scheduler→Invocation)  ─┐
C4 (Group→Invocation)      ─┼─▶ requires stable Invocation Engine (DONE, phase21)
C1 (Forum→Debate via Inv) ─┘
C12 (Scoped feeds) ─▶ improves C1/C2/C7 UX
C3 (Research expose) ─▶ C3-handoff (Research→Debate) reuses C1
C6 (Cognitive bridges) ─▶ reuses C7 aggregator for visibility
C10 (Router unify) ─▶ independent of Invocation; own track
```

**Sequencing recommendation:** do C2 + C12 first (cheap, make Invocation the reliable hub + fix feeds), then C1 (flagship), then C3/R-01 (biggest expose), then C6/C7 (cohesion), then C10/C11 (hygiene).

---

## 4. Anti-patterns to avoid (do NOT build)

- **Do not build a new "orchestrator"** to connect panels — Invocation Engine + EventBus already are the connectors.
- **Do not add a new state store per panel** for cross-cutting history — extend `invocationStore`/`directorStore` patterns or a shared aggregator (C7).
- **Do not rewrite RouterService** — bridge SmartRouting into the existing `RoutingPolicyService` (C10).
- **Do not create new event buses** — ~97 existing subscription sites confirm the EventBus is the intended seam; the bug is _missing subscribers_, not missing infrastructure.

---

_Next: `HIDDEN_CAPABILITIES.md` (Phase 7) — backend-ready, UI-missing capability inventory with file:line proof._
