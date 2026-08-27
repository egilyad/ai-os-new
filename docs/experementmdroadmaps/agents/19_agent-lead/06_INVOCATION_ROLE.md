# 06_INVOCATION_ROLE — `agent-lead` via Invocation Engine / Room

> Tags VERIFIED / INFERRED / OPINION.

## CURRENT state (VERIFIED)

- **Human invocation only.** `phase21-invocation.ts:43-58` `AgentResolverDirectory` wraps `agentService` and exposes `specializations` (`:54`) to RoomPanel's agent picker. A human can pick `agent-lead` (Victor Soto) like any other agent.
- **Policy gates call type, not agent.** `DEFAULT_ROOM_POLICY_NAME = 'Manual Room Chat (human-selected agent)'` (`phase21-invocation.ts:125`) matches `source:'human-mention'` only. `actions.target` is a placeholder (`__human_selected__`, `:136`) — `matches()`/`invoke()` resolve the agent from `req.target`, never from policy (`phase21-invocation.ts:112-124` comment).
- **Execution delegate hands off.** `InvocationExecutionDelegate.start` (`phase21-invocation.ts:61-109`): mode `debate` → `DebateSyncManager.startDebate`; `chat`/`director-scenario` → `ScenarioRepository.create` + `ConversationDirectorService.loadScenario`+`run`. agent-lead reaches execution only when human-selected.
- **No agent-initiated invocation.** D3/D6 (AGENTS.md Invocation Engine): agents cannot self-invoke or invoke others. So agent-lead can never _itself_ spawn a coordination call.

## Context / mode mapping (VERIFIED from RoomPanel pickers, AGENTS.md Step 6 rework)

- Where picker → `context.type` (ref `'general'`).
- Mode picker → `constraints.mode` (`chat` / `debate` / `scenario`).
- Agent picker → `target.agentId` (= `agent-lead`).
- Task textarea → `reason`.

For agent-lead a typical invocation: Where = "This room", Mode = "Chat", Agent = Victor Soto, Task = "Summarize the architecture debate and assign owners."

## POTENTIAL (INFERRED)

1. **Coordination invocation.** Human invokes agent-lead with mode `debate` + context = a forum topic → agent-lead moderates the spawned debate (see 04_DEBATE_ROLE).
2. **Policy that prefers lead for coordination intents.** A policy `match.expertise:['Coordination']` could auto-route "coordinate/summarize/moderate" human requests to agent-lead. Today `matches()` ignores expertise unless the policy declares it (`InvocationEngineService.matches` per AGENTS.md). Additive.

## RECOMMENDED (OPINION)

Seed a **second** Room policy (alongside the generic one) that matches `source:'human-mention'` AND `expertise` includes `Coordination`/`Mentoring`/`Architecture` and suggests agent-lead as default target. This makes the agent's specializations _functional_ in the invocation layer without changing engine code — only a policy record.

## Risk / Dependencies

- Policy is a Dexie `invocationPolicies` row (`phase21-invocation.ts:131`). No contract change. Low risk. Confirm `InvocationEngineService.matches` honors `match.expertise` (AGENTS.md states it does).
