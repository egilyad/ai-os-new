# 06_INVOCATION_ROLE — `agent-data` via Invocation Engine

## How it works today (VERIFIED)

- `phase21-invocation.ts:43-58` `AgentResolverDirectory` wraps `agentService` and enriches `getAgents()` with `specializations` (from `resolveAgent`).
- Default production policy `Manual Room Chat (human-selected agent)` (`:125-139`) matches **only** on `source: 'human-mention'`. Per engine design (D7), `matches()` never compares `policy.actions.target` to the request; `invoke()` resolves agents from `req.target` — the agent a human picks in RoomPanel. So any registered agent (including `agent-data`) is invocable by a human.
- `InvocationEngineService.resolveAgents` rejects unknown ids (`resolveAgents` only yields ids present in the directory). `agent-data` is registered → always resolvable.
- **Expertise match path EXISTS but is UI-hidden**: `invocation-engine-service.ts:167-173` — when a request carries `target.expertise`/`role`, the engine filters the directory to agents whose `specializations` include it. So a request for `Statistics` or `Forecasting` would surface `agent-data`. No current UI issues such a request (RoomPanel only does free human pick + context + mode).

## Human invocation shape (VERIFIED from RoomPanel)

RoomPanel form → `InvocationRequest`:

- `target`: `{ agentId: 'agent-data' }` (human picks from `agentService.getAgents()`).
- `context`: `{ type: 'room' | 'forum' | 'conversation', ref }`.
- `constraints.mode`: `chat` | `debate` | `scenario`.
- `reason`: free text task.
  Lifecycle: `requested → accepted → executing → done|rejected`; `sessionRef` set on `executing` (points to conversation scenario id or debate id). Generic guard (B6.1): no `debate:`/`forum:` events leak for chat mode.

## Policy (OPINION / INFERRED)

Today the only seeded policy is the human-mention gate. A useful **second** policy (no engine change) would be `expertise:statistics → agent-data` (auto-route quant questions). Because `matches()` gates on `match.expertise` (`invocation-engine-service.ts` evaluates `match.expertise`), such a policy is already supported by the contract — only data is needed.

## Recommended

- Expose an **"Ask by expertise"** control in RoomPanel that builds `target.expertise: ['Statistics','Forecasting']` → engine returns `agent-data` (proving the existing match path). This is a pure UI addition; zero backend change.
- Keep `agent-data` out of agent-initiated invocation (D6: authority = human; `allowAgentInitiatedInvocation:false` default).
