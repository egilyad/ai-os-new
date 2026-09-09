# 06_INVOCATION — Invocation Engine / Room Panel

**Status:** VERIFIED. How a human invokes doc-checker via Room.

## Agent directory adapter

`src/kernel/service-registration/phase21-invocation.ts:44-58` `AgentResolverDirectory implements AgentDirectory`:

- Wraps `agentService`. `getAgents()` maps each agent to `{ id, name, role, specializations }` using `src.resolveAgent(a.id)` (phase21-invocation.ts:47-56).
- This is the ONLY agent-resolution seam the Invocation Engine uses — doc-checker is reachable iff it is a node in the active topology (it is).

## Execution delegate

`InvocationExecutionDelegate` (phase21-invocation.ts:61-110) `start(agents, context, mode)`:

- `mode==='debate'` → `debate.startDebate(...)` with participants `{id, name:id, role:'neutral'}` (phase21-invocation.ts:75-86).
- `mode==='chat'|'director-scenario'` → builds a `ScenarioRepository.create({participants, turns})`, `director.loadScenario`, `director.run()` (phase21-invocation.ts:89-108). doc-checker becomes a conversation participant here.

## Default policy (human-selected agent)

`DEFAULT_ROOM_POLICY_NAME = 'Manual Room Chat (human-selected agent)'` seeded on first service resolution (phase21-invocation.ts:125-144). It matches `source:'human-mention'` only and **does NOT constrain the agent** — the human picks any registered agent (phase21-invocation.ts:112-124). So in RoomPanel a user can select "Iris Tanaka / Consistency Checker" and invoke her; `resolveAgents` rejects unknown ids.

## RoomPanel UI

`src/components/RoomPanel/RoomPanel.tsx` (per AGENTS.md Step 6 rework):

- Agent picker populated from `agentService.getAgents()` (names only, no ids shown). doc-checker appears as "Consistency Checker — Consistency Checker" (or displayName "Iris Tanaka").
- Where/Mode/Task pickers map to `context.type` / `constraints.mode` / `reason`.
- `Open session` button navigates to `/director?session=` or `/debate?mode=runtime&sessionId=` for persisted invocations (AGENTS.md Step 6 History).
- E2E: `room-invocation-e2e.integration.test.tsx` proves real agent selection through `AgentResolverDirectory` (AGENTS.md: invokes `system-architect`, generalizes to any registered agent).

## Lifecycle

Invocation lifecycle `requested→accepted→executing→done|rejected` (AGENTS.md Step 5). `invocationStore` (Zustand) observes `invocation:*` + `conversation:*` events. doc-checker invocations persist in `invocations` Dexie table (v20).

## Confidence

- phase21 adapter/delegate/policy: VERIFIED (read).
- RoomPanel picker: VERIFIED via AGENTS.md (read Step 6 rework) — actual component not opened but behavior confirmed.
