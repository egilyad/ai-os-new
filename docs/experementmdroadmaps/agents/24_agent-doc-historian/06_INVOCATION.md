# 06_INVOCATION — `agent-doc-historian`

The Invocation Engine (phase21) and the historian.

## VERIFIED

- `phase21-invocation.ts` registers `'invocationEngineService'` (`:151-167`) with an `AgentResolverDirectory` wrapping `agentService` (`:43-58`, `:152`), an `InvocationExecutionDelegate` (`:61-110`), and seeds a default manual-Room policy (`:125-144`).
- `AgentResolverDirectory.getAgents()` (`:47-57`) maps `agentService.getAgents()` and enriches each with `specializations` from `resolveAgent`. `resolveAgent` returns `specializations` from node config (empty for historian node).
- `InvocationEngineService.resolveAgents` rejects unknown ids (AGENTS.md + `phase21-invocation.ts` registration). Only ids present in the agent directory are accepted. `agent-doc-historian` IS in the directory (it is a topology node), so it is a valid invocation target.
- `RoomPanel` (Step 6 of AGENTS.md) lets a human pick **any registered agent** from a `<select>` of `agentService.getAgents()`; the pick becomes `req.target.agentId`. So a user can invoke `agent-doc-historian` directly.
- The default policy `match: { source: 'human-mention' }` (`:135`) gates the _type_ of call, not the agent. The historian is reachable because the human selects it; `policy.actions.target` (`'__human_selected__'`) is a placeholder and unused for resolution (`:123-124`).
- Execution modes (`phase21-invocation.ts:68-109`): `'debate'` → `debateService.startDebate`; `'chat'|'director-scenario'` → `ScenarioRepository.create` + `conversationDirector.run`. Historian can run in any of these.

## INFERRED

- The historian is therefore invocable from the Room UI today with no code change, provided a human selects it. There is no automatic/scheduled historian invocation (D6: authority = human; agents never self-invoke).
- `resolveAgents` rejecting unknown ids protects against typos, but cannot protect against the historian being _semantically_ wrong for a task — selection is purely human.

## OPINION

- This is the cleanest path to actually exercise the historian for changelog/lineage work: a human opens Room, picks Oscar Vilhelm, sets mode Chat, and asks for a version lineage summary.
