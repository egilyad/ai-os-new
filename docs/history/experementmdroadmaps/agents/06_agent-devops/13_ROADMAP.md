# 13_ROADMAP — Roadmap A (incremental, reuse-first)

Philosophy: enrich `agent-devops` using only existing services; no new agent code, no new buses.

## Phase 0 — Cleanup (fix what's broken)

| Task                                                  | Existing code/service                                | Proposed UI | Deps | Effort | Risk | Expected result                       |
| ----------------------------------------------------- | ---------------------------------------------------- | ----------- | ---- | ------ | ---- | ------------------------------------- |
| Fix Builder debate hook (`debate:start` → real event) | `builder-agent-service.ts:40`, `workflow-service.ts` | none        | none | S      | Low  | devops usable in Builder debate steps |
| Tag journal entries with specializations              | `agent-journal-service.ts:133-167`                   | none        | none | S      | Low  | devops memory queryable               |

## Phase 1 — Quick wins (display + presets)

| Task                              | Existing code/service                           | Proposed UI        | Deps | Effort | Risk | Result                 |
| --------------------------------- | ----------------------------------------------- | ------------------ | ---- | ------ | ---- | ---------------------- |
| Specialization chips on AgentCard | `AgentsPanel/AgentCard`, `resolveAgentIdentity` | card chips         | P0   | S      | Low  | expertise visible      |
| Room invocation presets           | `RoomPanel.tsx`, `invocationEngine`             | preset buttons     | none | S-M    | Low  | 1-click devops tasks   |
| Debate persona badge              | `persona-selector.ts`, debate UI                | variant label      | P0   | S      | Low  | transparent voice      |
| Cognitive decision display        | `COGNITIVE_DECISION_MADE`                       | cognitive timeline | none | S-M    | Low  | devops reasoning shown |
| AgentLiveBoard cognitive tab      | `AgentService.getStats` + events                | live tab           | P0   | M      | Low  | live thinking          |

## Phase 2 — Integrations (domain bridges)

| Task                                  | Existing code/service                 | Proposed UI  | Deps | Effort | Risk | Result                      |
| ------------------------------------- | ------------------------------------- | ------------ | ---- | ------ | ---- | --------------------------- |
| Specialization-aware debate persona   | `persona-selector.ts:251`             | (auto)       | P1   | M      | Med  | devops = ops voice          |
| DevOps ops lens                       | `lens-library.ts`                     | lens picker  | none | M      | Low  | structured infra reasoning  |
| Devops-scoped runbook/incident memory | Dexie KV + `AgentJournalService`      | memory strip | P0   | M-L    | Med  | continuity                  |
| Expertise-matched debate seating      | debate meta-agent + `PersonaSelector` | (auto)       | P1   | M      | Med  | expert-anchored debates     |
| Devops agent group seeding            | `agent-service.ts:667`                | group view   | none | S      | Low  | multi-agent infra scenarios |

## Phase 3 — Advanced (autonomous workflows)

| Task                              | Existing code/service                       | Proposed UI        | Deps      | Effort | Risk | Result                   |
| --------------------------------- | ------------------------------------------- | ------------------ | --------- | ------ | ---- | ------------------------ |
| Incident post-mortem workflow     | Builder+Director+CrystalVault+Synthesis     | scenario template  | P2,P3-fix | L      | Med  | incident→runbook Crystal |
| Real DevOps tool bridge (sandbox) | `ToolService`/`SandboxService`/`MCPService` | tool results in UI | P2        | L      | High | operative SRE            |
| Expertise graph routing           | `InvocationEngineService`+policies          | (auto)             | P2        | L      | Med  | questions→right cluster  |

## Phase 4 — Mature (observability & governance)

| Task                         | Existing code/service           | Proposed UI        | Deps  | Effort | Risk | Result                          |
| ---------------------------- | ------------------------------- | ------------------ | ----- | ------ | ---- | ------------------------------- |
| Devops analytics dashboard   | `AgentService` stats + journal  | AnalyticsPanel tab | P1    | M      | Low  | ROI/cost per infra task         |
| SLO/error-budget advisories  | devops memory + lens            | advisory cards     | P2,P3 | M      | Med  | proactive ops insight           |
| Policy-gated auto-invocation | Invocation policies (`phase21`) | policy editor      | P3    | M      | Med  | devops auto-joins infra debates |

Every phase reuses existing contracts/services; none introduces a 26th agent or new event types.
