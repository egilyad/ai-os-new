# SuperAgents OS — MASTER IMPROVEMENT MAP

> Research-only roadmap design. No source code changed. All recommendations reference
> existing code/services/contracts. Priority = VALUE × FEASIBILITY × REUSE × RISK.
> Companion files: PANEL_REVIEWS.md, SERVICE_REVIEW.md, HIDDEN_CAPABILITIES.md,
> CROSS_PANEL_OPPORTUNITIES.md, WORKFLOWS.md, ROOM/DEBATE/FORUM/AGENT/CONVERSATION/KNOWLEDGE_ROADMAP.md,
> QUICK_WINS.md, BIG_BETS.md, DO_NOT_BUILD_YET.md, ROADMAP_A_PRODUCT.md, ROADMAP_B_PLATFORM.md,
> ROADMAP_COMPARISON.md.

---

## 1. What SuperAgents OS is (current state)

An **event-driven, multi-agent runtime** with a broad React control plane. Core engine:
ConversationCore (Director), Debate runtime, Forum, Invocation Engine, and 7 Cognitive
Modules (Lenses → Crystals → Junction → Synthesis → Generator → Forum → Builder). It manages
LLM providers/keys, agents, memory, knowledge, research, workflows, routing, scheduling, and
extensive observability/debugging surfaces.

Inventory (from `route-imports.ts` `PANEL_COMPONENTS` + `src/kernel`):

- **~160 wired nav ids** → lazy React panels (one map). ~30 of these are `ComingSoonPanel`
  placeholders (debate sub-services: steelman, bayesian-judge, blind-eval, credibility,
  calibration, consistency, frame-tracker, stance-drift, insight-bus, …) — declared surface,
  not implemented.
- **~100 kernel services** (`src/kernel/services/*`), many with matching contracts.
- **~120 contracts** (`src/kernel/contracts/*`) — deep typed capability surface.
- **7 cognitive modules** (Modules 1–7, all "DONE" per AGENTS.md).
- **Stores**: directorStore, invocationStore, debateLiveStore, activeDebateStore, useKeyStore,
  useChatStore, useSystemStatus, uiPreferencesStore, topologyTraceStore, useNotificationStore.
- **EventBus**: singleton, ~97 subscription sites across ~50 components (see nightly research AR-08).

The system is **functionally broad but UX-fragmented**: many panels exist, but the _wiring_
between them, the exposure of deep backend capabilities, and the consistency of navigation are
uneven. The biggest leverage is **exposing what already exists** and **composing existing
modules**, not building new ones.

---

## 2. Product-maturity per major subsystem (Phase 8)

Levels: 0 prototype · 1 functional · 2 usable · 3 polished · 4 mature · 5 platform-grade.

| Subsystem                                                        | Maturity                   | Why                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Debate runtime + panels                                          | **3 polished**             | Multi-panel (arena, live, replay, tournament, workspace, analysis, strategy-builder, history, manager). Rich. Limited by single-active-session + lossy `debate:updated` (nightly EB-15/EB-17).                                                                                                                                 |
| ConversationCore / Director                                      | **2 usable**               | Recently built, real end-to-end run works (nightly B6.1). Lifecycle bugs (EB-05..14) but functional. UI is one panel (Director) with Configure/Library/Run.                                                                                                                                                                    |
| Invocation Engine + Room                                         | **1–2 functional**         | Thin but real UI (RoomPanel). Lifecycle mostly faithful (EB-19..21). Underexposed potential.                                                                                                                                                                                                                                   |
| Forum                                                            | **1–2 functional**         | Strong backend (`IForumService`: topics, threaded posts, voting, subscribe, pin, moderate, consensus). UI thin; escalation/moderation/voting UI missing (nightly IN-01/02/03).                                                                                                                                                 |
| Cognitive modules (Lenses/Crystals/Junction/Synthesis/Generator) | **2 usable**               | All built with UI + persistence. Mostly standalone; cross-module composition thin.                                                                                                                                                                                                                                             |
| Memory                                                           | **2–3 usable**             | MemoryPanel + MemoryPalace + transfer/export. Backed by memory-engine. Solid.                                                                                                                                                                                                                                                  |
| Research engine                                                  | **3 (backend) / 1–2 (UI)** | `IResearchEngine` is exceptionally deep: 12+ phases (PRISMA systematic review, fact-check, peer-review sim, citation & knowledge graphs, anomaly detection, auto-discovery, summarization, citation export). UI exposure is partial (research-engine / research-advanced / research-reports). **Large hidden-capability gap.** |
| Agents management                                                | **2–3 usable**             | AgentsPanel, roles, groups, marketplace, journal, SRE. Agent registry is the backbone of Invocation.                                                                                                                                                                                                                           |
| Providers / Keys                                                 | **3 polished**             | ProviderManager (keys), marketplace, pools, dashboards (provider/groq/openrouter), smart-routing, nvidia-enterprise, analytics. Mature surface.                                                                                                                                                                                |
| Router / Routing                                                 | **2–3 usable**             | `RouterService` (live) + `SmartRoutingService` (panel) + `RoutingPolicyService` are **disjoint** (nightly EB-24). SmartRouting UI may not affect live routing.                                                                                                                                                                 |
| Workflows                                                        | **1–2 functional**         | `Workflow` type + 2 built-ins (code-review, ADR). WorkflowPanel basic. Builder agent generates topologies. Underused.                                                                                                                                                                                                          |
| Analytics / Cost                                                 | **2–3 usable**             | Analytics, pricing, budget, cost-analytics, cost-optimization, ab-testing, custom-metrics, key-usage-analytics. Good coverage.                                                                                                                                                                                                 |
| Observability / Debug                                            | **3 polished**             | Traces, logs, router-trace, state-inspector, diagnostics, causal-debugger, counterfactual, shadow, dependency-map, performance-profiler, what-if. Extremely rich debugging surface.                                                                                                                                            |
| Admin / Config                                                   | **3 polished**             | Settings, policies, policy-editor, audit log, config history, service registry. Mature.                                                                                                                                                                                                                                        |
| Scheduling                                                       | **1 functional**           | SchedulerPanel + scheduler-service. Basic.                                                                                                                                                                                                                                                                                     |
| Documentation / Help                                             | **1–2 functional**         | Docs panel, tutorials, module-info. Thin onboarding.                                                                                                                                                                                                                                                                           |
| Federation / Social / Marketplace experiments                    | **0–1 prototype**          | Aquarium, CommunityHub, PersonaMarketplace, PluginSdk, FederatedMemory, TemplateSharing, QuantumInspiration, FineTuning, Distillation, Deploy, TimeMachine, ContributionGraph — many appear experimental/early; maturity varies, several likely thin.                                                                          |

**Read:** the system is **strong on engine + observability + provider/key management**, and
**weak on cross-module composition, consistent navigation, and exposing deep backend
capabilities in the UI** (especially Research engine, Forum moderation/voting, Workflows).

---

## 3. Priority / Effort matrix of improvement themes

| Theme                                                                                                | Priority | Effort | Key files                                      |
| ---------------------------------------------------------------------------------------------------- | -------- | ------ | ---------------------------------------------- |
| Expose Research engine phases in UI (systematic review, fact-check, peer-review, graphs)             | **P0**   | M      | ResearchPanel/*, research-engine.ts            |
| Compose Room → Debate/Conversation/Forum (already partially wired) into one "agent room" UX          | **P0**   | M      | RoomPanel, invocation-engine-service           |
| Forum UI: voting, moderation, pin, escalation-to-debate                                              | **P0**   | M      | ForumPanel, forum.ts                           |
| Unify router: make SmartRouting panel actually drive live `RouterService`                            | **P1**   | M      | smart-routing-service, RouterService           |
| Persistent, cross-reload history everywhere (invocations ✓, director checkpoints ✗, debates partial) | **P1**   | M      | directorStore, debateLiveStore                 |
| Consistent navigation + design system (StatusBadge, inline styles, duplicate ids)                    | **P1**   | L      | route-registry, Common/*                       |
| Workflows as first-class reusable artifacts (builder → run → template → schedule)                    | **P1**   | M      | WorkflowPanel, workflow-service, builder-agent |
| Cognitive-module composition (Lenses→Synthesis→Crystal→Forum automatic bridges)                      | **P1**   | M      | synthesis-engine, crystal-vault, forum-service |
| Agent "workspace"/profile unifying registry + journal + SRE + marketplace                            | **P2**   | M      | AgentsPanel, agent-service                     |
| Research→Debate bridge (turn a research report / contested claim into a debate)                      | **P2**   | S–M    | research-engine, debate runtime                |
| Scheduling of workflows/invocations (cron-like)                                                      | **P2**   | S      | scheduler-service                              |
| Unified "live output" feed scoping (fix unscoped EventBus feeds, nightly FE-07)                      | **P1**   | M      | stores, EventBus                               |
| Command palette / global search across panels, agents, debates, topics                               | **P2**   | S–M    | CommandPalette                                 |
| Onboarding / guided first-run (tutorials exist, not connected)                                       | **P2**   | S      | TutorialPanel, tutorial-service                |
| Consolidate experimental/"ComingSoon" surface into a roadmap, hide stubs                             | **P2**   | S      | route-imports ComingSoon                       |

---

## 4. TOP 20 improvements (VALUE × FEASIBILITY × REUSE × RISK)

Selected, not just "biggest". (IDs reused across companion files.)

1. **R-01 — Research engine UI coverage** (P0/M): surface PRISMA systematic review, fact-check,
   peer-review simulation, citation & knowledge graphs already in `IResearchEngine`. Pure
   expose-existing. Huge analyst value.
2. **R-02 — Forum voting + moderation + pin UI** (P0/M): `votePost`/`moderatePost`/`pinTopic`
   exist in backend (forum.ts) but no UI (nightly IN-02/03). Backend-ready → UI only.
3. **R-03 — Forum→Debate escalation** (P0/M): `IForumService.getConsensus` exists; wire a
   "escalate contested topic to debate" action (nightly IN-01). Real cross-module value.
4. **R-04 — Room as universal agent invocation surface** (P0/M): already invokes chat/debate/
   director-scenario; deepen so any模块 result can be invoked/continued from Room.
5. **R-05 — Director checkpoint persistence + history** (P1/M): checkpoints are in-memory only
   (nightly IN-04); persist to Dexie, show run history. Cheap, high clarity.
6. **R-06 — Unified live-output feed scoping** (P1/M): fix RoomPanel unscoped feed (nightly FE-07)
   via a shared SessionScopedStore; also helps Debate/Forum.
7. **R-07 — SmartRouting → live RouterService bridge** (P1/M): today the panel is disjoint from
   live routing (nightly EB-24). Make rules actually apply.
8. **R-08 — Workflows: run + template + schedule** (P1/M): `Workflow` type + built-ins exist;
   add run history, "save as template", schedule via scheduler-service.
9. **R-09 — Cognitive composition pipeline** (P1/M): auto-bridge Lenses→Synthesis→Crystal→Forum
   so a lens analysis can crystallize and be discussed, without manual copy-paste.
10. **R-10 — Agent profile/workspace** (P2/M): unify agent registry + journal + SRE + marketplace
    into one agent view (reuse agent-service, agent-journal-service).
11. **R-11 — Global command palette** (P2/S): `CommandPalette` exists; extend to jump to any
    panel/agent/debate/topic/invocation. High discoverability payoff.
12. **R-12 — Navigation consistency + design system** (P1/L): single StatusBadge, route-id
    uniqueness guard, reduce 2.5k inline-style blocks (nightly FE-01/FE-04/CH-05).
13. **R-13 — Scheduled invocations/workflows** (P2/S): reuse scheduler-service for periodic
    agent runs (e.g., daily research digest).
14. **R-14 — Research→Debate bridge** (P2/S–M): from a research report or contested claim,
    one-click "debate this" (reuse debate runtime + research-engine).
15. **R-15 — Cross-session history browser** (P1/M): a unified "Activity" view aggregating
    debates, conversations, invocations, workflows, research sessions with deep-links.
16. **R-16 — Onboarding / first-run guide** (P2/S): connect TutorialPanel + module-info to a
    guided "create your first agent → run a debate → read a report" flow.
17. **R-17 — Consolidate ComingSoon stubs** (P2/S): hide ~30 placeholder debate panels or mark
    them clearly as roadmap; reduces confusion.
18. **R-18 — Provider/key health as proactive alerts** (P1/S): `KEY_COMPROMISED` etc. exist; add
    an AlertLayer banner (nightly IN-06/UX-06).
19. **R-19 — Workflow/invocation templates marketplace** (P2/M): reuse template-sharing-service
    - agent-marketplace to share workflows/agents (template-sharing contract exists).
20. **R-20 — Debate replay → annotate/export** (P2/S): `DebateReplayPanel` + `temporal-replay`
    exist; add annotation + share/export to Forum as a case study.

---

## 5. Deliverable index (all written this session)

- `PANEL_REVIEWS.md` — Phase 2 deep reviews (~25 major panels).
- `SERVICE_REVIEW.md` — Phase 4 (research-engine, forum, scheduler, workflow, smart-routing, agent, template).
- `WORKFLOWS.md` — Phase 5 (W1–W8 user journeys).
- `CROSS_PANEL_OPPORTUNITIES.md` — Phase 6 (C1–C12 connector map).
- `HIDDEN_CAPABILITIES.md` — Phase 7 (A–J backend-ready/UI-missing, file:line proof).
- `ROOM_ROADMAP.md`, `DEBATE_ROADMAP.md`, `FORUM_ROADMAP.md`, `AGENT_ROADMAP.md`,
  `CONVERSATION_ROADMAP.md`, `KNOWLEDGE_ROADMAP.md` — Phase 13.
- `QUICK_WINS.md` (P14), `BIG_BETS.md` (P15), `DO_NOT_BUILD_YET.md` (P16).
- `ROADMAP_A_PRODUCT.md` (P10), `ROADMAP_B_PLATFORM.md` (P11), `ROADMAP_C_ALTERNATIVE.md` (P12),
  `ROADMAP_COMPARISON.md` (P17).

**All 17 phases complete for Cycle 2.** No source modified.

---

## 6. New recommendations added in Cycle 2 (R-21…R-27)

| ID   | Title                                                     | Pri | Effort | Evidence                                               |
| ---- | --------------------------------------------------------- | --- | ------ | ------------------------------------------------------ |
| R-21 | Wire `SCHEDULE_TRIGGERED` → Invocation Engine             | P1  | S      | scheduler-service.ts:300 emits; no subscriber          |
| R-22 | Forum vote / pin / moderate UI                            | P0  | M      | forum-service.ts:149/237/245 implemented, no UI        |
| R-23 | Forum `getConsensus`→Debate escalation (+ register event) | P0  | M      | forum-service.ts:262; event absent from registry       |
| R-24 | Bridge SmartRouting→RoutingPolicyService (or relabel)     | P1  | M      | smart-routing-service.ts:101 vs provider-router.ts:144 |
| R-25 | Workflow run-history UI + router integration              | P1  | M      | workflow-service.ts:149 / :198                         |
| R-26 | AgentGroup execution patterns via Invocation              | P2  | M      | agent-service.ts:25–35                                 |
| R-27 | Persist + import TemplateSharing marketplace              | P2  | M      | template-sharing-service.ts:11 static                  |

Top cross-cutting insight: **~70% of the product is "built but dark."** The fastest path to a far
more capable product is turning on existing lights (expose + connect), not new engines.

---

_Cycle 2 status: Phases 1–17 delivered. If continuing, re-verify file:line citations still hold after
any upstream changes, then deepen any single roadmap (e.g., write implementation sketches under each
R-id) — but per session rules, no source may be modified._
