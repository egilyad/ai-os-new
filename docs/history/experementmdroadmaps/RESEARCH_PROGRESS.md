# RESEARCH PROGRESS — PRODUCT / ARCHITECTURE RESEARCH (Cycle 3+)

> Autonomous investigation. **No source changed, no implementation, no commits.** Stop only on
> explicit `STOP` / `ОСТАНОВИСЬ`. This file tracks progress; findings live in the sibling docs.

## Completed areas (this cycle + prior)

- **Prior cycles (1-2):** full panel inventory (`PANEL_REVIEWS.md`), service review (`SERVICE_REVIEW.md`),
  composition (`CROSS_PANEL_OPPORTUNITIES.md`, `WORKFLOWS.md`), big bets (`BIG_BETS.md`),
  do-not-build (`DO_NOT_BUILD_YET.md`), roadmaps (`ROADMAP_A_PRODUCT`, `ROADMAP_B_PLATFORM`,
  `ROADMAP_C_ALTERNATIVE`, `ROADMAP_COMPARISON`), hidden capabilities, quick wins, module roadmaps.
- **Cycle 3 (2026-08-15):** re-verified prior claims against current source; reviewed
  Scheduler/Forum/Research/KeyManagement/Workflows-Builder depth; inventoried ~18 unreviewed panel
  dirs; verified 7 "dark events" + 2 live bridges + 3 UI/backend contradictions.

## Current area

- **CYCLE 3 DELIVERABLES — DONE (2026-08-15).** All requested files written:
  PANEL_REVIEWS (extended w/ Cycle 3+ section), SERVICE_PRODUCT_OPPORTUNITIES (new),
  COMPOSITION_OPPORTUNITIES (new), BIG_IDEAS (new), ROADMAP_PRODUCT_FIRST (new),
  ROADMAP_PLATFORM_FIRST (new), ROADMAP_HYBRID (new), ROADMAP_DECISION_MATRIX (new),
  DO_NOT_BUILD_YET (extended w/ X10-X13), SURPRISE_DISCOVERIES (new), RESEARCH_PROGRESS (new, this).
- Verified 7 "dark events" + 2 live bridges + 3 UI/backend contradictions by grep before citing.

## Remaining areas to investigate in future cycles

- **Observability suite composition** — Traces/Diagnostics/CausalDebugger/StateInspector as inline
  deep-links from live runs (currently siloed).
- **Template/marketplace persistence** — `SHARED_TEMPLATES` static; import wiring absent.
- **Per-invocation cost attribution** — correlate `chat:stream:end` tokens + `budget:alert` to
  `invocationId`/`sessionRef` (data already exists; design the correlation).
- **Scheduler → Builder Workflow** (not just agent) direct subscriber (depends on N2 contract).
- **Cross-entity Audit Log service prototype** — single `subscribeAll` → Dexie → Activity panel
  (foundation for Roadmap C).
- **Agent self-improvement loop depth** — how sleep/prune/quality-gate feed agent-journal + whether a
  human-in-the-loop "review my learned memories" UI is viable.

## Cycle 3 deep-dive DONE (2026-08-15)

- **AdvisorService SRE engine confirmed** — `optimizer`+`whatIf` injected; `executeFix`/`getPressureSnapshot`
  /what-if simulators all present, none exposed → SRE Console (BIG_IDEAS A10) is mostly rendering.
- **Memory subsystem mesh confirmed** — 16 specialized stores (emotional/episodic/procedural/semantic/
  social/spatial/working + sleep/prune/quality/federated/palace/cache/worker). Strong support for
  A7 Memory→Invocation + agent self-improvement bet. Added to SERVICE_PRODUCT_OPPORTUNITIES §F/§G.

## Metrics

- Panels reviewed (prior): ~120 listed; Cycle 3 fresh depth on 5 + inventory of 18 unreviewed.
- Services reviewed (prior): 9; Cycle 3 fresh on 6 (EventBus, Container, Dexie, KeyStateStore,
  MemoryEngine, AdvisorService) + flagged 7 cognitive modules as unreviewed in SERVICE_REVIEW.
- Opportunities discovered: prior ~20 (C1-C12, W1-W8, B1-B7, Q1-Q10); Cycle 3 added 8 new combos
  (COMPOSITION_OPPORTUNITIES) + 10 big ideas (BIG_IDEAS).
- Workflows discovered: prior 8; Cycle 3 surfaced Mission-Control cockpit, silent-event wiring,
  living audit backbone, memory→invocation continuity.
- Roadmap candidates: 3 (Product-first, Platform-first, Hybrid) + decision matrix.

## Next research targets (autonomous)

1. Deep-dive AdvisorService what-if/pressure engine → "SRE console" opportunity (HIGH reuse).
2. Memory specialized stores (sleep/prune/federated) → agent learning-loop product story.
3. Per-invocation cost attribution prototype design (data already exists).
4. Validate Mission-Control cockpit composition against actual DashboardPanel/LiveCognition content.
5. Re-check DO_NOT_BUILD items against new findings; update if any prior deferral is now ripe.

## Discipline notes

- All Cycle 3 VERIFIED claims grep-confirmed on 2026-08-15.
- Corrected an earlier overstatement: `InvocationTarget.kind:'group'` does NOT exist in contract; the
  forum→debate escalation event is NOT registered. Updated SURPRISE_DISCOVERIES + DO_NOT_BUILD_YET (X10).
- LSP errors shown on writes are pre-existing false positives (invocation-types, LensesPanel,
  conversation-director-service, dexie-schema, interfaces) — unrelated to this read-only research.

## CYCLE 4 — DEBATE SUBSYSTEM DEEP-DIVE (2026-08-15) — DONE

Autonomous read-only research of the **Debate subsystem**. 23 markdown docs + 5 SVG mockups written to
`docs/experementmdroadmaps/debate/` (no source changed, no commits).

- **Deliverables:** `00_DEBATE_MASTER_MAP.md` (synthesis: 10 Q&A + RECOMMENDED DIRECTION + TOP 20
  improvements P0–P3), `01`–`22` (system map, user journey, live audit, cognitive stream, reasoning
  pipeline, 5 design concepts A–E + `designs/*.svg`, live progressive-disclosure, replay, result design,
  integrations, quality, 56-row capability matrix, 3 roadmaps, design comparison, do-not-build), `designs/`
  (06–10 SVG mockups, dark theme #0f1117/#6366f1/#34d399/#e0a82e).
- **Key VERIFIED findings:**
  - `DebateService` = alias of `DebateSyncManager` (`services-core.ts:19`); three-tier facade + `DebateEngine` + `AutoDebateService`; ~140 files in `debate-runtime/`.
  - Debate is ConversationCore-backed (`debate-runtime/index.ts:20-30`); legacy orchestrator unwired.
  - **Mislabeled Replay button** (`DebatePanel.tsx:328-338`) re-runs a new debate, not replay.
  - **Replay broken**: localStorage timeline (`debate-timeline.ts:61`) disjoint from Dexie `debateTimeline` (`session-manager-service.ts:483`); `consensus:reached` branch dead (`DebateReplayPanel.tsx:170`); verdict/consensus absent from replay.
  - **Strategy DSL disconnected** — launch uses enum only (`debate-sync-manager.ts:200`); `StrategyBuilder.handleDeploy` no-op (`DebateStrategyBuilder.tsx:145-157`).
  - **Judges = scoring services, not agents** (`debate-evaluator.ts:67`, `bayesian-judge.ts:25`, `debate-phase-handler.ts:103`).
  - **Cognitive bridge MISSING**: debate emits no `cognitive:*`; `cognitive:decision:made` emitted (`cognitive-service.ts:414`) but dropped by recorder/bridge — dead at consumer.
  - **Integrations**: Crystal/Forum-case-study/Invocation/Memory/Analytics EXIST; Research/KnowledgeGen/Scheduler/Cognitive MISSING; Workflow-Builder BROKEN (`builder-agent-service.ts:40` non-existent `debate:start`; `workflow-service.ts:154-250` no dispatch); Forum escalation DEAD (`forum-service.test.ts:307`); Notifications start-only (`debate-sync-manager.ts:389`).
- **Corrections vs initial brief** (VERIFIED by agents): analysis session picker is actually wired (not inert); `restoreSession/saveSnapshot/dumpSizes` live in `debate-engine.ts:362-364` (not `debate-runtime.ts`); `cognitive:decision:made` is emitted but consumer-dead.
- **Recommended direction**: UX quick-wins + replay unification first, then display-only Cognitive Timeline (no new engine), converging on Hybrid shell (Design E). 20 improvements catalogued (P0×5…P3×5). 56-row capability matrix. 5 design concepts scored on 12 criteria.
- Metrics: 23 docs + 5 SVGs; 14 integration targets mapped; 56 capabilities; 20 opportunities; predominantly VERIFIED citations.

## CYCLE 5 — 25 SYSTEM AGENTS DEEP-DIVE (2026-08-15) — DONE

Autonomous read-only research of the **25 seeded system agents**. 25 per-agent folders × 16 files + 7 synthesis docs = 407 markdown files written to `docs/experementmdroadmaps/agents/` (no source changed, no commits).

- **Agents (from src/kernel/state/agent-profiles.ts:21-271):** network, risk, ethics, architect, security, devops, database, perf, critic, data, research, quality, creative, designer, content, ux, pm, po, lead, writer, doc-architect, doc-auditor, doc-simplifier, doc-historian, doc-checker. Each is a **topology node** with a curated identity (firstName/lastName/role/avatar/provider/model/specializations); behavioral machinery is SHARED infra (AgentService, persona-selector, chat-executor, Invocation engine, agent-journal, cognitive events).
- **Per-agent deliverables:** 00_PROFILE, 01_CURRENT_STATE, 02_CAPABILITIES, 03_SERVICES_AND_INTEGRATIONS, 04_DEBATE_ROLE, 05_CONVERSATION_ROLE, 06_INVOCATION_ROLE, 07_COGNITIVE_ROLE, 08_MEMORY_AND_CONTEXT, 09_UI_UX, 10_PROBLEMS_AND_LIMITATIONS, 11_OPPORTUNITIES, 12_FUTURE_AGENT_CONCEPT, 13_ROADMAP, 14_ALTERNATIVE_ROADMAP, 15_DO_NOT_BUILD_YET.
- **Synthesis docs:** 00_AGENTS_MASTER_MAP (all-25 summary + top-10 systemic opportunities), 26_CROSS_AGENT_ARCHITECTURE (duplication/pairs/teams/lift-to-common), 27_AGENT_TEAMS (8 ready-made teams), 28_AGENT_DEBATE_MATRIX (agent×role + combos), 29_AGENT_INVOCATION_MATRIX (who-invokes-whom via existing engine), 30_AGENT_PLATFORM_ROADMAP (A Quality-first / B Collaboration-first / C Product-UI-first), 31_AGENT_ROADMAP_COMPARISON (scorecard + OPINION hybrid reco).
- **Key VERIFIED cross-cutting findings:**
  - Agents are **topology nodes over shared infra** — almost no agent-specific code; most `specializations` are decorative (persona-selector keys on debate role/topic, not specialization — `persona-selector.ts:251-290`).
  - **Model-pin mismatch**: many node `model:'auto'`; pinned model lives only in `AGENT_PROFILES` (injected by `normalizeAgentIdentity` at `topology-defaults.ts:91-119`); some pins ARE honored, some overridden — inconsistent.
  - **Cognitive invisibility in debate**: debate emits no `cognitive:*` events; `cognitive:decision:made` is dead-at-consumer (`event-registry.ts:776`, `cognitive-service.ts:414`); AgentService only consumes `COGNITIVE_STEP_COMPLETED` for stats.
  - **Minimal tool/lens wiring**: nodes carry `tools:[]` / `lensIds:[]`; several "declared" tools (sql_executor, benchmark, profiler) are not in any registry; no design/UX/creative/security/ethics/content lens exists despite specializations.
  - **Doc cluster (21-25)** and **Management cluster (17-19)** and **Design cluster (13-16)** show natural groupings but no coordination logic.
  - **Invocation** works today (human picks any registered agent via RoomPanel; `phase21-invocation.ts` wraps agentService); expertise-match invocation exists but is UI-hidden.
- **Unverified / deferred areas:** whether any agent has true agent-scoped memory (journal is generic by nodeId); whether a Research subsystem truly exists (UI-only scratchpad found); whether Scheduler/Workflow ever target agents (Workflow/Builder debate hook is BROKEN — `builder-agent-service.ts:40` non-existent `debate:start`). These remain open pending deeper scheduler/workflow review.
- Metrics: 25 agents × 16 = 400 per-agent files + 7 synthesis = 407 md; predominantly VERIFIED citations with INFERRED/OPINION clearly flagged; dozens of opportunities catalogued per agent (5 quick + 5 medium + 3 big ideas each).

## CYCLE 6 — OBSERVABILITY SUITE DEEP-DIVE (2026-08-15) — DONE

Autonomous read-only research of the **Observability Suite** (Traces, Diagnostics, CausalDebugger, StateInspector). 5 markdown docs written to `docs/experementmdroadmaps/observability/` (no source changed).

- **Deliverables:** `00_OBSERVABILITY_MASTER_MAP` (synthesis: architecture, silos, composition, roadmap), `01` (real architecture map), `02` (silo analysis), `03` (composition roadmap), `04` (UX improvements).
- **Key VERIFIED findings:**
  - **Telemetry Silos**: The system maintains high-fidelity telemetry (`TraceService`), reactive health monitoring (`DiagnosticService`), and high-overhead `CausalDebugger` analysis, but they operate as **decoupled consumers** of the `EventBus` without a shared correlation context.
  - **Composition Gap**: No unified context anchor (correlation ID) spans these services; the UI consumer (`StateInspectorPanel`) relies on brittle, manual state snapshots rather than streamed context.
  - **Observability fragmentation**: Diagnostic markers are not surfaced in trace views, and the Causal Debugger cannot be invoked from diagnostic events, limiting holistic debugging.
- **Recommended direction**: Establish a unified context-correlation ID across `EventBus` payloads for all observability services; implement a "Context Overlay" UI pattern that allows tracing events to anchor to specific diagnostic or causal debugger sessions.
- Metrics: 5 docs; 4 services audited (Trace, Diagnostic, Causal, Inspector); predominantly VERIFIED citations; 10+ opportunities for cross-service composition.
