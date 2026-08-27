# 13_ROADMAP — phased plan for `agent-risk`

Each phase: task, existing code/service, proposed UI, deps, effort, risk, expected result.

## Phase 0 — Cleanup / Expose (honesty & consistency)

- **0.1 Fix avatar consistency** — AgentAvatar consults AGENT_PROFILES (agent-profiles.ts:37). UI: all avatars. Deps: none. Effort S. Risk low. Result: 📊/#ef4444 everywhere.
- **0.2 Specialization chips on AgentCard + RoomPanel** — reuse AgentIdentityView.specializations. UI: AgentCard, RoomPanel picker. Deps: none. Effort S. Risk low. Result: identity visible (fixes P9).
- **0.3 Resolve model pin** — set topology `config.model` to the declared `openrouter/meta-llama/llama-3.3-70b-instruct` OR document that `auto` is intentional. UI: AgentConfigTab. Deps: none. Effort S. Risk low. Result: fixes P2 (reproducible risk model).
- **0.4 Surface cognitive:decision:made** — add read-only consumer in AgentObservabilityTab. Deps: none. Effort S. Risk low. Result: fixes P6.

## Phase 1 — Quick wins (debate + invocation fit)

- **1.1 Specialization-aware debate side** — debate-api.ts:307 consult AGENT_PROFILES.specializations → Risk Analyst defaults con/neutral. UI: debate participant badge. Deps: 0.2. Effort S–M. Risk low. Result: fixes P3.
- **1.2 Risk invocation Task hints** — RoomPanel placeholders. UI: RoomPanel. Deps: 0.2. Effort S. Risk low. Result: fixes P1 expectation.
- **1.3 Risk persona variant** — persona-selector.ts add `risk_analyst`. UI: debate prompt. Deps: 1.1. Effort M. Risk low. Result: fixes P4.

## Phase 2 — Integrations (memory + director + journal)

- **2.1 Auto-load agent memory** — resolveAgent attaches memoryService.query({agentId}). UI: turns get context. Deps: memory engine. Effort M. Risk med. Result: fixes P5.
- **2.2 Auto-journal risk decisions** — agentJournalService on decision/argument. UI: AgentJournalPanel. Deps: 0.4. Effort M. Risk low. Result: persistent risk log.
- **2.3 Pre-built Risk Review scenario** — ScenarioRepository seed + RoomPanel quick-launch. UI: ConfigureTab/RoomPanel. Deps: Director (B5). Effort M. Risk low. Result: unlocks 05.
- **2.4 Risk summary widget** — AgentDetailPanel shows last assessment/open risks/compliance. UI: AgentDetailPanel. Deps: 2.1/2.2/0.4. Effort M. Risk med. Result: fixes P9 + ROI.

## Phase 3 — Advanced (quantification + assurance overlay)

- **3.1 Monte-Carlo/Compliance as real tool calls** — bind `risk_model` tool actually invoked by executor. UI: turn output structured scorecard. Deps: executor tool support. Effort L. Risk med–high. Result: addresses P1 root cause (real math).
- **3.2 Assurance overlay** — invoke agent-risk on debate/conversation output → risk badge. UI: DebateRuntimePanel/Director. Deps: 1.3/2.4/Invocation. Effort L. Risk med. Result: B1.
- **3.3 Cognitive-stream correlation panel** — trace agent-risk steps to turns. UI: new tab. Deps: cognitive events. Effort M. Risk low. Result: "why did Risk Analyst say that".

## Phase 4 — Mature (proactive + knowledge)

- **4.1 Scheduled risk sweeps** — cron-like Director/Invocation policy. UI: RoomPanel/Scheduler. Deps: scheduler/policy. Effort L. Risk med. Result: fixes P11 (B3).
- **4.2 Risk knowledge crystallization** — risk findings → crystals + forum compliance announcements. UI: CrystalVault/Forum. Deps: crystal-debate-bridge/forum bridge. Effort M. Risk low. Result: compounding risk knowledge.
- **4.3 Elo/quality tuning** — use debate Elo + risk-decision accuracy to rank agent-risk vs peers. UI: EloLeaderboard. Deps: existing. Effort S. Risk low. Result: measurable value.

## Expected end state

agent-risk moves from "prompt + wiring" (current) to a memory-augmented, quantitatively-backed,
specialization-correct Risk Analyst whose assessments are visible, journaled, and reusable —
without any new agent engine, only by wiring existing services/events/storage.
