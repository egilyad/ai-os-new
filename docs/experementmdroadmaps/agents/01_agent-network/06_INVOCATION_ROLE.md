# 06_INVOCATION_ROLE — `agent-network` via RoomPanel / Invocation Engine

> Human-invokable today. Expertise/role/scheduler invocation exists but unused.

## Can a human invoke it? (VERIFIED — YES)

- `RoomPanel` builds an agent `<select>` from `agentService.getAgents()` (`RoomPanel.tsx:89-95`). `agent-network` appears as "Nadia Volkov — Network Engineer".
- On submit it calls `invocationEngine.invoke({ source:'human-mention', caller:{kind:'human'}, target:{agentId:'agent-network'}, reason:task, context:{type:where}, constraints:{mode} })` (`RoomPanel.tsx:121-141`).
- `phase21-invocation.ts:125-144` seeds `Manual Room Chat (human-selected agent)` policy matching `source:'human-mention'`, permitting any registered agent. `resolveAgents` returns `[{id:'agent-network'}]` (`invocation-engine-service.ts:158-162`). So invocation is allowed.

## Context / mode (VERIFIED)

- **Where** (`context.type`): `room` | `forum-topic` | `conversation` (`RoomPanel.tsx:20-24`).
- **Mode** (`constraints.mode`): `chat` | `debate` | `director-scenario` (`RoomPanel.tsx:26-30`).
- Execution handoff (`phase21-invocation.ts:61-110`):
  - `debate` -> `debateService.startDebate(...)` with participants forced to `role:'neutral'` (`:75-87`).
  - `chat` / `director-scenario` -> `scenarioRepository.create(...)` + `director.loadScenario` + `director.run()` (`:89-108`). Topic from `context.ref` (defaults 'Invocation-triggered conversation').

## Policy implications (VERIFIED + OPINION)

- The default policy gates only on `source` (human-mention), never the agent or expertise (`invocation-engine-service.ts:191-201`). So a human can invoke Nadia for any task, even non-networking.
- **Risk:** a human could invoke `agent-network` for, say, "write a poem" — the agent will comply (it's just an LLM with a network prompt). Acceptable for a manual Room, but for **expertise-targeted** invocation we'd want a policy that requires the topic to match `specializations`. The engine already supports `match.expertise` (`invocation-engine-service.ts:196-200`) and `target.expertise` resolution (`:171-173`) — just no UI/policy uses it yet.

## Unused but available invocation paths (VERIFIED)

- **By expertise:** `InvocationTarget = { expertise: ['TCP/IP'] }` would resolve all agents whose `specializations` include it (`invocation-engine-service.ts:171-173`). No UI exposes this.
- **By role:** `{ role: 'Network Engineer' }` (`:163-169`). No UI.
- **Agent-initiated / scheduled:** `handleAgentRequest` + `module-event` source + `allowAgentInitiatedInvocation` (`:124-144`). No policy enables it for Nadia.

## Recommended invocation UX (OPINION)

- Add a "Networking expert" quick-invoke preset that sets `target.expertise:['TCP/IP','SDN','Latency Optimization']` and a matching policy (`match.expertise`), so invocations route to the right expert automatically.
- Keep the manual dropdown (any agent) but add a small "specialization" hint chip next to each agent in the RoomPanel select (reuses `agentService.getAgents()[i].specializations`).

## Bottom line

`agent-network` is **fully invokable by a human today** through RoomPanel in chat/debate/director-scenario. The expertise/role/scheduled invocation axes are real but unwired — prime Quick Wins.
