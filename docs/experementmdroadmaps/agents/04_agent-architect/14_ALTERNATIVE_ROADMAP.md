# 14 — ALTERNATIVE ROADMAP (Plan B): "Agent-as-Service / Autonomous Architect"

Philosophy: **opposite of Plan A** — instead of glue, give `agent-architect` _autonomous_ behaviors and a dedicated service, treating it as a first-class subsystem rather than a generic node.

## Key trade-offs vs Plan A

| Axis                 | Plan A (glue/reuse)               | Plan B (autonomous service)                          |
| -------------------- | --------------------------------- | ---------------------------------------------------- |
| New runtime          | none                              | new `ArchitectureAgentService` + possibly new events |
| Time to value        | fast (Phase 0–1 in days)          | slow (needs service + UI + tests)                    |
| Risk                 | low                               | higher (new surface, more regression)                |
| Reuses shared infra  | maximal                           | partially duplicates AgentService logic              |
| User model           | human invokes architect on demand | architect proactively reviews/flags                  |
| Fixes confusion (#4) | by linking scan→agent             | by making architect its own product                  |

## Plan B phases (sketch)

- **B0** — New `ArchitectureAgentService` wrapping `agentService` + `architectureReviewService` + `crystalVault`; emits `arch:review:requested/done`.
- **B1** — Autonomous trigger: on `debate:verdict:generated` or scheduler tick, architect posts an ADR to Forum/Crystal without human invocation.
- **B2** — Dedicated `ArchitectPanel` (parallel to DirectorPanel) with scan→review→ADR→crystal flow as a native UI (not RoomPanel glue).
- **B3** — Agent-to-agent: architect _requests_ other agents (via Invocation Engine D3) to gather evidence.

## Verdict

Plan B is more powerful but **violates the project's "no new agent service / reuse shared infra" discipline** (AGENTS.md: "Agents are topology NODES; behavioral machinery is SHARED infra"). It also risks the exact "25 mini-frameworks" trap warned in 15. **Recommendation: Plan A**, with B1/B2 considered only after Plan A Phase 3 proves value. Plan B's autonomous trigger (B1) can be layered later _on top of_ Plan A's crystallized ADRs without a new service.
