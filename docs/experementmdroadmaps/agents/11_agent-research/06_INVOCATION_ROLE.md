# 06 — INVOCATION ROLE (human invocation)

## Current mechanism (VERIFIED)

- `phase21-invocation.ts` registers `invocationEngineService`. The engine's `AgentDirectory` is `AgentResolverDirectory`, a thin wrapper over `agentService` that also exposes `specializations` (`phase21-invocation.ts:43-58`).
- `resolveAgents` rejects unknown ids, so only registered agents (including `agent-research`) can be invoked (`phase21-invocation.ts` note: "resolveAgents rejects unknown").
- **RoomPanel** (per AGENTS.md Step 6 rework) presents a human agent picker built from `agentService.getAgents()`; the human selects Mira Castellan, picks a _Where_ (`💬 This room` / `📋 Forum topic` / `🗨️ Conversation`), a _Mode_ (`💬 Chat` / `⚔️ Debate` / `🎬 Scenario`), enters a _Task_, and submits. The request becomes an `InvocationRequest` with `target.agentId = 'agent-research'`.
- Policy: the seeded `Manual Room Chat (human-selected agent)` policy matches **only** `source:'human-mention'` (`phase21-invocation.ts:125-144`). It gates the _type_ of call, not the agent. So any human-selected registered agent is allowed.
- Execution handoff: chat/scenario → `ConversationDirectorService` (auto-created scenario, `phase21-invocation.ts:89-108`); debate → `DebateSyncManager.startDebate` (`phase21-invocation.ts:75-86`).

## Context / Mode mapping

- `context.type` + `context.ref` drive the session topic. For agent-research a natural context is `conversation` with `ref` = the research question.
- `constraints.mode` is one of `chat|debate|director-scenario`; currently the delegate only distinguishes `debate` vs (chat/scenario) (`phase21-invocation.ts:75`).

## What is NOT possible yet

- **Scheduled/trigger invocation:** no policy with `source:'schedule'` or `expertise` match exists for this agent (`phase21-invocation.ts` seeds only `human-mention`). So it cannot be auto-invoked by a timer or by an expertise-match rule (D2 hybrid triggers are designed but not implemented for it).
- **Agent-initiated invocation (D3/D6):** `allowAgentInitiatedInvocation:false` in the default policy (`phase21-invocation.ts:137`). Agents never self-invoke — by design.
- **Policy-defined target:** `policy.actions.target` is a placeholder (`__human_selected__`) and is NOT used for resolution (per `phase21-invocation.ts:116-123`). So the agent is always the human's pick, never policy-forced.

## Recommended posture

- Keep human invocation as-is (works). Add an _optional_ `source:'expertise'` policy that auto-suggests `agent-research` when a debate/conversation topic matches its specializations (Literature Review/Synthesis/Citations) — without auto-executing (D6: human authority).
