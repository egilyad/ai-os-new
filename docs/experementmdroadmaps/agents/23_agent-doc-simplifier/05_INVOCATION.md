---
title: Invocation Engine — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 05 — INVOCATION: RoomPanel → engine → agent

## Registration (VERIFIED)

`phase21-invocation.ts:146-167` registers `invocationEngineService`. The engine
**does not own execution** (D5) and the `Invocation` aggregate is written only by
the engine (D7). Agent resolution reuses `agentService`.

## Agent directory adapter (VERIFIED)

`AgentResolverDirectory` (`phase21-invocation.ts:44-58`) wraps `agentService`:
`getAgents()` maps each agent through `resolveAgent` to attach `specializations`.
This directory is the only agent source the engine sees.

## Resolve + reject unknown (VERIFIED)

`InvocationEngineService.resolveAgents(target)` (`invocation-engine-service.ts:158-159`)
iterates `this.directory.getAgents()` and **rejects ids not present** in the
directory. Since `agent-doc-simplifier` is a real topology node, it resolves; a
typo'd id is denied.

## Human selection (VERIFIED)

`RoomPanel` presents a `<select>` of `agentService.getAgents()`
(`AGENTS.md` Step 6 rework). A human can pick "Maya Lindholm" (display name) or
"Simplifier Agent" (label) — either maps to id `agent-doc-simplifier`. The
default policy `Manual Room Chat (human-selected agent)`
(`phase21-invocation.ts:125-144`) matches only `source:'human-mention'` and does
**not** constrain the target agent (`phase21-invocation.ts:115-124`). So any
registered agent — including doc-simplifier — is invocable.

## Execution handoff (VERIFIED)

`InvocationExecutionDelegate.start` (`phase21-invocation.ts:68-109`):

- `debate` mode → `debateService.startDebate` with the agent as a `neutral` participant.
- `chat` / `director-scenario` mode → creates a `ConversationScenario` with the
  agent as a `TurnProposal.participantId`, then `director.loadScenario` + `run()`.

## Generic guard (VERIFIED)

The E2E test (`AGENTS.md` Step 6 E2E) asserts no `debate:`/`forum:` events fire
when invoking via RoomPanel; only `invocation:*` + `conversation:*` — proving
doc-simplifier's invocation reuses generic Core, not a doc-specific subsystem.
