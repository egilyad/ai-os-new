# 11_OPPORTUNITIES — quick wins, medium, big ideas for `agent-network`

Each item: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (reuse-only, hours)

- **Q1 — Surface specializations on the agent card.**
  Description: render `specializations` chips on `AgentCard`/`AgentDetailPanel` from `resolveAgentIdentity` (`agent-identity.ts:35`).
  User value: user instantly sees Nadia is the network expert.
  Reuse: `resolveAgentIdentity`, existing card components. Effort: S. Risk: low. Deps: none. Infra: `agent-identity.ts`. Why now: free data already in memory.

- **Q2 — Expertise-aware persona selection.**
  Description: in `persona-selector.ts:251` prefer a variant matching `specializations` (or add networking keywords to `technologist`/`cautious_scientist`).
  User value: Nadia argues as a networking Evidence Analyst, not generically.
  Reuse: `PersonaSelector`, `debate-llm-prompt-context.ts:878`. Effort: S. Risk: low (additive). Deps: none. Infra: `persona-selector.ts`. Why now: fixes #1 in 10.

- **Q3 — Per-agent Journal tab in AgentDetailPanel.**
  Description: render `agentJournalService.listByAgent('agent-network')` + `getAgentStats`.
  User value: see her real activity/history.
  Reuse: `AgentJournalService` (exists), `AgentDetailPanel`. Effort: S. Risk: low. Deps: UI. Infra: `agent-journal-service.ts`. Why now: data already collected, just hidden (#5).

- **Q4 — Expertise preset + policy in RoomPanel.**
  Description: add a "Networking expert" quick-invoke using `target.expertise` + a `match.expertise` policy (engine already supports `invocation-engine-service.ts:171,196`).
  User value: topic routes to the right expert automatically.
  Reuse: `InvocationEngineService`, `phase21-invocation.ts` seeding pattern. Effort: S-M. Risk: low. Deps: policy seed. Infra: `invocation-engine-service.ts`. Why now: fixes #8.

- **Q5 — Attach `lens:security` to agent-network.**
  Description: set `lensIds:['lens:security']` in `normalizeAgentIdentity` for network nodes (or via `AGENT_PROFILES`).
  User value: stronger network-security stance in Synthesis/Debate.
  Reuse: `lens-engine`, `agent-identity.ts:116`. Effort: XS. Risk: low. Deps: none. Infra: `lens-library.ts`. Why now: trivial additive.

## 5 MEDIUM (days)

- **M1 — Seed semantic memory for Nadia.**
  Description: at boot, write her specializations + canonical networking facts to `semantic-memory` keyed by `agentId`.
  User value: grounded, non-hallucinated networking answers; continuity.
  Reuse: `semantic-memory`, `memory-quality-gate`. Effort: M. Risk: medium (noise/pollution). Deps: memory writer. Infra: `src/kernel/services/memory/semantic-memory.ts`. Why now: fixes #4.

- **M2 — Read-before-speak memory injection.**
  Description: in `ChatExecutionEngine` (`:40-43`) inject a `semantic-memory.query({agentId, topic})` summary into the system message.
  User value: she recalls prior conclusions in debates/conversations.
  Reuse: `ChatExecutionEngine`, `semantic-memory`. Effort: M. Risk: medium (latency/cost). Deps: M1. Infra: `conversation-execution-engine.ts`. Why now: pairs with M1.

- **M3 — Cognitive visibility in debate.**
  Description: `debate-agent-executor.ts` emits `COGNITIVE_STEP_COMPLETED` (nodeId) post-turn.
  User value: unified stats + journal across debate & conversation.
  Reuse: existing event, `AgentService`, `AgentJournalService`. Effort: S-M. Risk: medium (double-count if debate already feeds stats). Deps: verify stats path. Infra: `event-registry.ts:763`. Why now: fixes #3.

- **M4 — Suggested debate side from topic.**
  Description: in Debate participant picker, when topic matches networking terms, suggest pro/con/neutral for Nadia using `specializations`.
  User value: better debate composition.
  Reuse: `specializations`, `debate-prompt-builder`. Effort: M. Risk: low. Deps: UI. Infra: `debate-prompt-builder.ts:674`. Why now: fixes #7 partially.

- **M5 — Networking agent group (pre-built team).**
  Description: seed an `AgentGroup` `net-team` = [agent-network, agent-architect, agent-security, agent-devops] with `executionPattern:'pipeline'|'debate'`.
  User value: one-click infra review squad.
  Reuse: `AgentService.createGroup`/`executeGroup` (`agent-service.ts:667,688`). Effort: S-M. Risk: low. Deps: UI entry. Infra: `agent-service.ts`. Why now: fixes #8 groups unused.

## 3 BIG IDEAS (weeks)

- **B1 — Tool-enabled Network Engineer.**
  Description: give `agent-network` MCP/code tools (latency probe, topology reader, iperf-style stub) so she can _measure_, not just discuss.
  User value: real engineering actions; closes #2.
  Reuse: existing `tools` config + tool-execution infra. Effort: L. Risk: high (security/sandbox). Deps: tool registry, sandbox. Infra: `topology-defaults.ts:152`, tool runtime. Why now: transforms her from commentator to engineer.

- **B2 — Expertise-routed Invocation Engine.**
  Description: generalize Q4: every agent gets an `expertise` policy; RoomPanel/tasks auto-route to the best-specialized agent.
  User value: system-wide "right expert" routing, not just Nadia.
  Reuse: `invocation-engine-service.ts` expertise target + `match.expertise`. Effort: L. Risk: medium. Deps: UI, policies. Infra: `invocation-engine-service.ts`. Why now: leverages existing unused engine feature.

- **B3 — Living Network Knowledge Crystal.**
  Description: promote Nadia's durable conclusions to the Crystal Vault (`crystal-vault-service`) as network knowledge, queryable by other agents/forums.
  User value: institutional networking knowledge that compounds.
  Reuse: `crystal-vault-service`, memory->crystal bridge pattern. Effort: L. Risk: medium. Deps: M1/M2. Infra: Crystal Vault (Module 2). Why now: cross-agent knowledge reuse.
