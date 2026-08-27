# 13_ROADMAP — recommended phased plan for `agent-network`

Philosophy: **Specialist-first, reuse-everything.** Each step reuses existing services; no new engines.

## Phase 0 — Cleanup / expose (days)

- **0.1 Fix misleading topology comment** (`topology-defaults.ts:143`): note `agent-network` is profile-pinned to groq. Effort XS. Risk none.
- **0.2 Surface specializations in UI** (Q1): chips on `AgentCard`/`AgentDetailPanel` via `resolveAgentIdentity`. Effort S. Risk low.
- **0.3 Attach `lens:security`** (Q5): `lensIds` in `normalizeAgentIdentity`. Effort XS. Risk low.
- **0.4 Per-agent Journal tab** (Q3): render `agentJournalService.listByAgent`. Effort S. Risk low.
- Deps: none. Expected: Nadia visibly identifiable as network expert; her existing activity surfaced.

## Phase 1 — Quick wins (1-2 weeks)

- **1.1 Expertise-aware persona** (Q2): `persona-selector.ts` prefers specialization-matching variant. Effort S. Risk low.
- **1.2 Expertise preset + policy** (Q4): RoomPanel "Networking expert" + `match.expertise` policy. Effort S-M. Risk low.
- **1.3 Suggested debate side** (M4 partial): topic->side hint in Debate picker. Effort M. Risk low.
- **1.4 Cognitive visibility in debate** (M3): emit `COGNITIVE_STEP_COMPLETED` post-turn. Effort S-M. Risk medium (verify no double-count).
- Deps: Phase 0. Expected: Nadia argues as networking expert; unified stats/journal; right-expert routing.

## Phase 2 — Integrations (2-4 weeks)

- **2.1 Seed semantic memory** (M1): boot write of specializations + facts, `agentId`-keyed. Effort M. Risk medium.
- **2.2 Read-before-speak** (M2): inject memory summary in `ChatExecutionEngine`. Effort M. Risk medium.
- **2.3 Pre-built `net-team` group** (M5): seed group + UI entry. Effort S-M. Risk low.
- **2.4 Revive `cognitive:decision:made` consumer** (07): journal the decision. Effort S. Risk low.
- Deps: Phase 1. Expected: continuity + collaboration; decisions logged.

## Phase 3 — Advanced (1-2 months)

- **3.1 Tool-enabled Network Engineer** (B1): give `tools` (latency probe, topology reader). Effort L. Risk high (sandbox/security).
- **3.2 Expertise-routed Invocation (system-wide)** (B2): generalize Q4 to all agents. Effort L. Risk medium.
- **3.3 Memory->Crystal promotion** (B3): durable network knowledge. Effort L. Risk medium.
- Deps: Phase 2 (+ tool registry for 3.1). Expected: Nadia acts, not just talks; knowledge compounds.

## Phase 4 — Mature (ongoing)

- Monitor stats/journal quality; tune persona variants; expand tool set; cross-agent network reviews via `net-team`; memory quality-gate tuning.
- Deps: Phase 3. Expected: a reliable, grounded, collaborative Network Engineer agent.

## Risk register (summary)

- Double-counting stats (M3/1.4) — verify `AgentService` path.
- Memory noise/pollution (M1/M2) — use `memory-quality-gate`.
- Tool safety (B1) — sandbox + `PromptSecurityService` already in `ChatExecutor`.
- Scope creep — keep all behavior inside shared infra (see 15).
