# 06_INVOCATION_ROLE — `agent-security` via Invocation Engine (Room)

> VERIFIED current behavior + policy + context/mode.

## CURRENT (VERIFIED)

- **Human-only invocation** (D6: agents never self-invoke). Reached from `RoomPanel` where the human picks `agent-security` from `AgentService.getAgents()` (`phase21-invocation.ts:38-58`).
- `RoomPanel` UI translates human choices into `InvocationRequest`: `target { agentId: 'agent-security' }`, `context { type, ref }`, `constraints.mode` (chat | debate | director-scenario), `reason` (task text) (`RoomPanel.tsx` rework per AGENTS.md Step 6 rework).
- `InvocationEngineService.invoke` (`invocation-engine-service.ts`):
  - lifecycle `requested → accepted → executing → done | rejected` (D7, intent-first).
  - `AgentResolverDirectory.resolveAgents` rejects unknown ids (`phase21-invocation.ts:43-58`); `agent-security` is registered → accepted.
  - `InvocationExecutionDelegate.start` (`phase21-invocation.ts:61-110`):
    - `mode:'debate'` → `debateService.startDebate(topic, [{id, name, role:'neutral'}], 'round_robin', 5)` → session ref.
    - `mode:'chat'`/`'director-scenario'` → `ScenarioRepository.create` (one INTRODUCE turn per agent) → `conversationDirector.loadScenario` + `run()` → conversation ref.
- Policy: default `Manual Room Chat (human-selected agent)` seeds on first resolution, `match:{source:'human-mention'}`, `allowAgentInitiatedInvocation:false` (`phase21-invocation.ts:125-143`). It gates the _type_ of call, not the agent (D7). Any registered human-selected agent passes.

## Context / mode guidance (OPINION)

| User intent                   | Recommended `context.type`          | `constraints.mode`  |
| ----------------------------- | ----------------------------------- | ------------------- |
| "Review this code for vulns"  | `conversation` (ref: snippet/topic) | `chat`              |
| "War-game our auth design"    | `conversation`                      | `debate` (red/blue) |
| "Run a threat-model scenario" | `conversation`                      | `director-scenario` |

## Gaps (VERIFIED/INFERRED)

- Invocation debate mode hardcodes `role:'neutral'` for the agent (`phase21-invocation.ts:81`) — `agent-security` cannot be invoked as a red-team `con` via Room without code change.
- No specialized "security scan" invocation template; the human must phrase the task themselves. The agent's `specializations` are not surfaced as quick-pick task templates in RoomPanel (POTENTIAL, see 11 QW-3).
- No `sessionRef`→`agent-security` deep-link beyond generic `/director?session=` or `/debate?sessionId=` (already supported per AGENTS.md Step 6 history).

## Scenario

**I1 — One-shot security review.** Room → pick `agent-security` → Where: "This room" → Mode: Chat → Task: "Find OWASP Top 10 issues in this Express middleware." → `invoke` → `accepted` → `conversation` session → live `conversation:*` output in store → `done`. Works today (E2E pattern proven in `room-invocation-e2e.integration.test.tsx`).
