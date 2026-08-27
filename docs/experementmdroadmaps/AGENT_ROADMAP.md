# AGENT ROADMAP (Phase 13 — Agents)

> Research-only. AgentService + AgentsPanel + roles/groups/journal/marketplace/SRE. Backbone of Invocation.
>
> **Cycle 2 — panel roadmap: Agent.**

## Current state

- `AgentService` (800 lines): registry, `AgentGroup` (parallel/sequential/consensus/pipeline/debate), `AgentStats`, `lifecycleStates`.
- Panels: AgentsPanel, roles, groups, marketplace, journal, SRE.

## Top gaps

- **Agent groups not invocable** — `executionPattern` (`agent-service.ts:25`) unused by Invocation. (R-26/C4)
- **Fragmented agent view** — groups, journal, SRE, marketplace are separate panels with no unified profile. (R-10)
- **No scheduler pickup** — Scheduler can trigger an agent by id but nothing wires `SCHEDULE_TRIGGERED`→invoke. (R-21)
- **Marketplace static-ish** — `template-sharing-service` agent templates not importable. (R-19/R-27)

## Roadmap (phased)

1. **Group invocation (M, cross).** `invocationEngine` group target → run pattern. Room offers Group pick. (R-26)
2. **Unified agent profile (M).** One view = registry + stats + journal + lifecycle + marketplace entry. (R-10)
3. **Scheduler pickup (S, cross).** Reuse R-21 bridge. (R-21)
4. **Marketplace import (M).** Materialize agent template into registry. (R-19)

## Value / Effort

Agents are the "nouns" of the whole system; making them group-invocable + profiled unlocks Room/Debate/Scheduler cohesion. **Priority: P2.**
