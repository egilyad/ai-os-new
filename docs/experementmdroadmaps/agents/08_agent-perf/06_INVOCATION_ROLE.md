# 06_INVOCATION_ROLE — `agent-perf` via Invocation Engine (Room)

## CURRENT state `[VERIFIED]`

- `AgentResolverDirectory` wraps `agentService` and exposes `agent-perf` (with its specializations) to the Invocation Engine (`phase21-invocation.ts:43-58`). `resolveAgents` rejects unknown ids, so only registered agents (incl. `agent-perf`) pass. `[VERIFIED]`
- `RoomPanel` human-picks any agent from `agentService.getAgents()`; selecting `agent-perf` builds an `InvocationRequest` with `target.agentId = 'agent-perf'`. `[VERIFIED]` (AGENTS.md RoomPanel rework)
- Default policy `Manual Room Chat (human-selected agent)` matches `source: 'human-mention'` and lets the human choose any registered agent (`phase21-invocation.ts:125-144`); `actions.target` is a placeholder and **not** used for resolution (D7). `[VERIFIED]`
- Handoff: `mode: 'chat'` → `InvocationExecutionDelegate` builds a ConversationCore scenario (`participants=[agent-perf]`, one `INTRODUCE` turn) and `director.run()` (`phase21-invocation.ts:89-108`). `mode: 'debate'` → `debate.startDebate` with `agent-perf` as a `neutral` participant. `[VERIFIED]`

## Human invocation shape

- **Agent**: `agent-perf` (picked from dropdown; UI shows "Leon Ortiz — Performance Engineer").
- **Where**: This room / Forum topic / Conversation → `context.type` + `context.ref` (e.g. `'general'`).
- **Mode**: Chat / Debate / Scenario → `constraints.mode`.
- **Task**: free text → `reason` (persisted as `InvocationRecord.reason`). `[INFERRED from AGENTS.md RoomPanel rework]`

## Policy notes `[VERIFIED]`

- No policy constrains _which_ agent a human may pick (source-only matching). `agent-perf` is reachable by any human via Room.
- Auto-invocation (`allowAgentInitiatedInvocation`) is `false` in the default policy; agents never self-invoke (D6). So `agent-perf` will not be auto-summoned by another agent.

## Scenario

**"Leon, profile our ingest pipeline and tell me the bottleneck."** — Human opens Room → picks Leon Ortiz → mode Chat → task text → Invoke. Engine: `requested → accepted → executing →` ConversationCore chat → `done`; store shows live `conversation:*` output; `sessionRef` lets the user open `/director?session=…`. Fully supported today. `[INFERRED]`
