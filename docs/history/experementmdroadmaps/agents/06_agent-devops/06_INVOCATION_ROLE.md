# 06_INVOCATION_ROLE — human invocation of `agent-devops`

> VERIFIED from `phase21-invocation.ts`, `RoomPanel.tsx`, `invocation-engine-service.ts`.

## How a human invokes Tomas Berg today (VERIFIED)

1. `RoomPanel` loads the agent picker from `agentService.getAgents()` (`RoomPanel.tsx:89`), listing `Tomas Berg — DevOps Engineer`.
2. Human picks **Agent = agent-devops**, **Where** (`room`/`forum-topic`/`conversation`), **Mode** (`chat`/`debate`/`director-scenario`), and a **Task** text.
3. `RoomPanel` builds an `InvocationRequest { target:{agentId:'agent-devops'}, context, constraints:{mode} }` and calls `invocationEngine.invoke(req)` (`RoomPanel.tsx:84-90` — the ONLY write path).
4. `InvocationEngineService.invoke` (`invocation-engine-service.ts:77`) → `requested` → policy `matches()` (seeded `Manual Room Chat (human-selected agent)`, `phase21-invocation.ts:125-144`, matches `source:'human-mention'`, does NOT constrain agent) → `accepted` → `resolveAgents(req.target)` (rejects unknown ids, `invocation-engine-service.ts:158`) → `executing`.
5. `InvocationExecutionDelegate.start` (`phase21-invocation.ts:61-109`) hands off:
   - `mode==='debate'` → `debateService.startDebate(...)` (all participants `neutral`).
   - `chat`/`director-scenario` → `scenarioRepository.create(...)` + `conversationDirectorService.loadScenario` + `run()` → ConversationCore.
6. Lifecycle `invocation:*` + live `conversation:*` events feed `useInvocationStore` and render in `RoomPanel`.

## Context & mode mapping (VERIFIED)

| Room "Where"    | `context.type` | `context.ref` |
| --------------- | -------------- | ------------- |
| 💬 This room    | `room`         | `'general'`   |
| 📋 Forum topic  | `forum-topic`  | `'general'`   |
| 🗨️ Conversation | `conversation` | `'general'`   |

| Room "Mode" | `constraints.mode`  | Exec path                 |
| ----------- | ------------------- | ------------------------- |
| 💬 Chat     | `chat`              | ConversationCore scenario |
| ⚔️ Debate   | `debate`            | Debate session            |
| 🎬 Scenario | `director-scenario` | ConversationCore scenario |

> NOTE: `context.ref` is hardcoded `'general'` for all Room picks (`RoomPanel.tsx` + `phase21-invocation.ts:90,99`); the human's task text becomes `reason`, not the context ref. OPINION: a minor loss — the task could populate `context.ref` to give the executor a topic.

## Policy (VERIFIED)

- Default seeded policy `Manual Room Chat (human-selected agent)` (`phase21-invocation.ts:125`): `match:{source:'human-mention'}`, `actions:{target:{agentId:'__human_selected__'}, mode:'chat'}`, `allowAgentInitiatedInvocation:false`.
- `actions.target` is a **placeholder** and intentionally unused for resolution (`phase21-invocation.ts:116-123`). The human's pick in `req.target` wins.
- Any **registered** agent is permitted; unknown ids rejected by `resolveAgents`.

## Gaps (OPINION)

- The debate path forces `role:'neutral'` for all participants (`phase21-invocation.ts:81`) — so a human-invoked devops debate has no pro/con structure.
- No **expertise/role** field is passed beyond `agentId`; the invocation cannot request "devops as the SRE voice".
- `Open session` works only for `conversation`/`debate` sessionRef (`RoomPanel` history feature) — devops invocations therefore are reopenable.
