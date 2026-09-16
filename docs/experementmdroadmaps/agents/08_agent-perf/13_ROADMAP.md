# 13_ROADMAP — Phase 0 → Phase 4 (recommended path)

Each: task · existing code/service · proposed UI · deps · effort · risk · expected result. `[OPINION]` on sequencing; `[VERIFIED]` on existing infra.

## Phase 0 — Truth & visibility (foundation)

- **P0.1 Emit cognitive events from debate** — `debate-agent-executor.ts` (VERIFIED emit point). UI: none (existing subscribers). Deps: none. Effort: S. Risk: Low. → `agent-perf` visible in stats/journal/live-stream during debates (fixes P1).
- **P0.2 Honest tool state** — `AgentCard.tsx:106-118`. UI: card tool tags. Deps: tool registry. Effort: S. Risk: Low. → stops over-promising `benchmark`/`profiler` (P2).

## Phase 1 — Voice & continuity (quick wins)

- **P1.1 `performance_engineer` persona** — `persona-selector.ts:3`. UI: none (debate auto). Deps: none. Effort: S. Risk: Low. → perf debates get fitting voice (P3).
- **P1.2 Journal `performance` tag** — `agent-journal-service.ts:17`. UI: `AgentHistoryTab` filter. Deps: none. Effort: S. Risk: Low. → continuity view (P memory gap).
- **P1.3 "Profile this" card action** — `RoomPanel`+`phase21-invocation.ts`. UI: `AgentCard` action. Deps: Room. Effort: S–M. Risk: Low. → one-click invocation.

## Phase 2 — Specialization (medium)

- **P2.1 `lens:performance`** — `lens-library.ts:10`. UI: LensesPanel attaches to `agent-perf`. Deps: lens engine. Effort: M. Risk: Low. → fills P4.
- **P2.2 Perf scenario templates** — `scenario-repository.create` (B5.3). UI: DirectorPanel Library. Deps: Director. Effort: M. Risk: Low. → ready workflows.
- **P2.3 Perf filter** — `AgentsPanelView.tsx:226`. UI: filter chip. Deps: none. Effort: S–M. Risk: Low. → discoverability.
- **P2.4 Post-debate Crystal** — `crystal-debate-bridge` (Module 2). UI: CrystalVaultPanel. Deps: Crystal Vault. Effort: M. Risk: Low. → durable knowledge.

## Phase 3 — Measurement (big, the defining capability)

- **P3.1 `PerfProbe` tool** — wire `benchmark`/`profiler` ids to a real runner. UI: tool-call UI in debate/chat. Deps: tool-exec + sandbox. Effort: L. Risk: Med. → real measurement (P6).
- **P3.2 Perf observability view** — reuse `AgentStatsDashboard`+`LiveActivityStream`+journal. UI: tab in AgentsPanel (not new panel). Deps: P0.1,P1.2. Effort: L. Risk: Low. → auditable perf ROI.

## Phase 4 — Autonomy (policy-gated, authority=human)

- **P4.1 Regression-triggered invocation** — Invocation policy `source:'module-event'` (latency metric). UI: policy in `AgentPolicySection`. Deps: metrics source. Effort: L. Risk: Med. → proactive perf (B3).
- **P4.2 Eval/leaderboard calibration** — ensure `EloLeaderboard`/`AgentComparison` feed correctly post-P0.1. Deps: P0.1. Effort: M. Risk: Low. → fair ranking (P9).

## Expected cumulative result

By end of Phase 2, `agent-perf` is a fully visible, voiced, continuable, reusable performance agent using only existing infra. Phases 3–4 add real measurement and proactive invocation — the leap from "prompt-flavored node" to "Performance Review Officer" (`12_FUTURE_AGENT_CONCEPT.md`).
