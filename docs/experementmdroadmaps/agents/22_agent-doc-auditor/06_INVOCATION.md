# 06_INVOCATION — `agent-doc-auditor` in the Invocation Engine

**VERIFIED.** The Invocation Engine (`phase21-invocation.ts`) is a thin policy-gated dispatch layer. Doc-auditor is reachable as a human-selected target; no engine code names it.

## Agent directory adapter

- `AgentResolverDirectory` (`phase21-invocation.ts:43-58`) wraps `agentService`. Its `getAgents()` maps each agent to `{ id, name, role, specializations }` (specializations pulled via `resolveAgent`).
- `InvocationEngineService` (`services/invocation/invocation-engine-service.ts`) uses `directory.getAgents()` and `resolveAgents(target)` (`:158-159`); `resolveAgents` **rejects unknown ids** — so doc-auditor is valid only if present in the topology (it is).

## Default policy (manual Room)

- `seedDefaultRoomPolicy` (`phase21-invocation.ts:125-144`) seeds a single policy `Manual Room Chat (human-selected agent)` matching `source:'human-mention'`, with `actions.target = { agentId:'__human_selected__' }` as a **placeholder** (intentionally unused for resolution — `:123`).
- Per `InvocationEngineService` (D7): `matches()` gates only on `match.source/event/expertise`, never comparing `policy.actions.target` to the request; `invoke()` resolves agents from `req.target` (the human's pick in RoomPanel). So the policy permits the _human_ to invoke **any** registered agent — including `agent-doc-auditor`.

## Execution handoff

- `InvocationExecutionDelegate.start` (`phase21-invocation.ts:61-110`) hands off to `ConversationDirectorService` (chat/director-scenario) or `DebateSyncManager` (debate). For doc-auditor in `chat` mode it builds a one-turn scenario `participantId:'agent-doc-auditor'`, `objective.type:'INTRODUCE'`, then `director.loadScenario`+`run()` (→ Conversation Core, see `05_CONVERSATIONCORE.md`).

## RoomPanel (UI)

- `components/RoomPanel/RoomPanel.tsx:89` populates the agent `<select>` from `agentService.getAgents()`; doc-auditor appears as "Felix Moreau — Documentation Auditor" (id→name via `agentService`, `:117`). The human picks it; the Where/Mode/Task pickers map to `context`/`constraints.mode`/`reason`. Submit → `invocationEngine.invoke(req)` (the only write path).
- `stores/invocationStore.ts:92-98,224` observe `invocation:*` + `conversation:*` events for live status; doc-auditor's invocation lifecycle is shown generically.

## OPINION

The Invocation Engine is the _only_ subsystem where a human can invoke doc-auditor ad-hoc by name from a UI (RoomPanel). Combined with `05_CONVERSATIONCORE.md`, this is the most likely real-world entry point for "ask Felix to audit this". The policy model deliberately makes the engine agent-agnostic — adding doc-auditor required zero engine changes.
