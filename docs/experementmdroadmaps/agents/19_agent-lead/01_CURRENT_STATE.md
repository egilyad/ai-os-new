# 01_CURRENT_STATE — What `agent-lead` ACTUALLY does now

> Honest, shared-infra view. Tags: VERIFIED / INFERRED / OPINION.

## The single truth (VERIFIED)

`agent-lead` is **one topology node among 25**. It has no special runtime path. What it "does" is entirely determined by:

1. Its node `prompt` ("technical team lead… mentor team members…") — `topology-defaults.ts:374`.
2. Its pinned provider/model (`nvidia` / `meta/llama-3.3-70b-instruct`) from `AGENT_PROFILES` — `agent-profiles.ts:208-209`.
3. The generic AgentService machinery that executes any agent node identically — `agent-service.ts:764 executeSingleNode`.

## Concrete current behavior (VERIFIED)

- **Executed by the orchestrator** when the router dispatches to it (edge `e-router-lead`, `topology-defaults.ts:484`) or when it is part of a group/invocation/scenario.
- **Speaks with its own identity** in ConversationCore: `ConversationOrchestrator` → execution engine → `agentService.resolveAgent(id)` returns the node config (prompt/model/avatar) so the turn is voiced by Victor Soto — `agent-service.ts:337-389`, comment `:331-336`.
- **Participates in debates** purely as a participant with `roleName:'Team Lead'`; its per-round persona comes from `PersonaSelector` topic-keyword scoring (`persona-selector.ts:251-308`), NOT from its lead profile. Its tactical role (devil's advocate / synthesizer / etc.) is assigned by `MetaAgentController` graph-centrality heuristics (`debate-meta-agent-controller.ts:21-102`) — again identity-blind.
- **Can be invoked from Room** by a human selecting it (`phase21-invocation.ts:43-58`, RoomPanel pickers). The default policy `Manual Room Chat (human-selected agent)` matches on `source:'human-mention'` only — it gates the _call type_, never the agent (`phase21-invocation.ts:125-144`).
- **Accrues usage stats** from `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184-210`): calls, tokens, latency, errors, estimatedCost. Persisted to KV (`agent-service.ts:158-173`).
- **Accrues a journal** via `AgentJournalService` on `COGNITIVE_STEP_ACTIVE` / `COGNITIVE_STEP_COMPLETED` / `debate:runtime:agent:error` (`agent-journal-service.ts:129-191`), keyed by node id.
- **Grouped under "Management"** in prompt-audit reports (`prompt-audit-service.ts:20`).

## What it does NOT do (VERIFIED — notable gaps)

- It does **not** coordinate other agents. Nothing routes subtasks _to_ agent-lead as a manager. The router (`router` node) does dispatch, not agent-lead.
- Its `specializations` (Mentoring, Coordination, Architecture) are **display-only**. No code path reads `AGENT_PROFILES['agent-lead'].specializations` to alter routing, persona, or grouping beyond the audit label — `persona-selector.ts` keys on topic keywords; `MetaAgentController` keys on graph stats.
- It has **no lenses** (see 00_PROFILE).
- It is **not** auto-assigned as debate lead/moderator. `debate-meta-agent-controller` treats all agents uniformly.
- It has **no agent-to-agent authority**. Invocation Engine D3/D6 forbid agent self-invocation; agent-lead cannot command other agents (`phase21-invocation.ts` + AGENTS.md Invocation Engine design).

## Behavior is identical to peers (INFERRED)

Because the only differentiators are prompt text + avatar + model + specializations, and none of those change the _machinery_, `agent-lead` behaves like `agent-architect` or `agent-pm` would if given the same prompt. The "lead" semantics are **cosmetic/declarative**.

## OPINION

The agent is currently a _named persona_ with no _role semantics_. The richest, most defensible upgrade is to make the "Mentoring / Coordination / Architecture" specializations and the "Team Lead" role **actually drive** something (debate moderation, scenario coordination, group leadership) rather than remaining display metadata.
