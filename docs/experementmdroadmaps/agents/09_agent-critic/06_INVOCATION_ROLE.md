# 06_INVOCATION_ROLE — `agent-critic` via Invocation Engine / Room

## CURRENT state (VERIFIED)

- `RoomPanel.tsx:89-95` populates its agent `<select>` from `agentService.getAgents()`. `agent-critic` appears there by name "Greta Lindqvist — Critical Auditor".
- On submit, `RoomPanel` builds an `InvocationRequest`:
  - `source: 'human-mention'`
  - `target: { agentId: 'agent-critic' }`
  - `reason: task`
  - `context: { type: where, ref: 'general' }` (where ∈ room/forum-topic/conversation)
  - `constraints: { mode }` (mode ∈ chat/debate/director-scenario)
  - — `RoomPanel.tsx:127-134`.
- `invocationEngine.invoke(req)` is the **only** write path. The engine resolves the agent via `AgentResolverDirectory` (`phase21-invocation.ts:43-57`), gates on the default `Manual Room Chat` policy (`match.source:'human-mention'`), then hands off to `InvocationExecutionDelegate` (`phase21-invocation.ts:61-109`).
- For `chat`/`director-scenario`, the delegate creates a `Scenario` with one `INTRODUCE` turn per agent and runs it through `ConversationDirectorService` (`phase21-invocation.ts:89-108`). For `debate`, it starts a `DebateSyncManager` session with all participants as `neutral` (`phase21-invocation.ts:75-86`).

## Policy (VERIFIED)

- `seedDefaultRoomPolicy` (`phase21-invocation.ts:125-144`) creates `Manual Room Chat (human-selected agent)` with `match:{source:'human-mention'}`, `actions.target:{agentId:'__human_selected__'}` (placeholder, **unused for resolution**), `mode:'chat'`, `allowAgentInitiatedInvocation:false`.
- **Key design:** the policy gates the _type_ of call (human manual invocation), NOT the agent. The human's `req.target` decides the agent (`phase21-invocation.ts:115-123`). So `agent-critic` is invocable by any human from Room with zero policy changes.
- `resolveAgents` rejects unknown ids (`phase21-invocation.ts:40` + engine), so only registered agents qualify — `agent-critic` is registered.

## POTENTIAL / RECOMMENDED (OPINION)

- Add a **specialized policy** `Manual Critique` that matches `human-mention` + `constraints.mode:'chat'` + a `task` containing critique keywords, auto-routing to `agent-critic` (or any agent with `Critical Analysis` specialization) — turning Room into a one-click "audit this" tool.
- Room's "Where" picker already supports `forum-topic`/`conversation`; a critic invocation with `context.type:'forum-topic'` could post its critique back as a forum reply (Forum bridge exists per AGENTS.md event `forum:topic:escalated-to-debate`).

## Scenario

Human in Room selects **Greta Lindqvist**, Mode **Chat**, Task "Audit this architecture proposal for logical flaws", Where **This room** → Invocation → Director scenario with one critic turn → live `conversation:*` feed in Room → `Open session` jumps to `/director?session=…` for the full transcript.
