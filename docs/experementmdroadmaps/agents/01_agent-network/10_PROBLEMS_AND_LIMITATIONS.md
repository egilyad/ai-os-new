# 10_PROBLEMS_AND_LIMITATIONS — concrete issues for `agent-network`

All items VERIFIED unless marked INFERRED/OPINION. No code changed.

## 1. Specializations are runtime-dead (VERIFIED)

`TCP/IP`, `SDN`, `Latency Optimization` live in `AGENT_PROFILES` (`agent-profiles.ts:30`) and node config, but:

- The debate `PersonaSelector` ignores them (`persona-selector.ts:251-309` keys only on topic + role).
- The ConversationCore `ChatExecutionEngine` injects only `systemPrompt` + `model`, not specializations (`conversation-execution-engine.ts:40-73`).
- Side assignment (`debate-prompt-builder.ts:674`) ignores them.
  **Impact:** Nadia behaves like any other low-temperature agent; her networking edge is never activated.

## 2. No tools -> can't act, only talk (VERIFIED)

`tools: []` (`topology-defaults.ts:152`). She cannot measure latency, run `iperf`, query telemetry, or call any API. For a _Network Engineer_ this is a fundamental capability gap — she is a "network commentator," not an engineer.

## 3. Cognitive invisibility during debate (VERIFIED + AGENTS.md)

Debate emits no `cognitive:*` events (`debate-agent-executor.ts` has none; AGENTS.md confirms). So her stats/journal don't update from debates; only ConversationCore feeds `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184`).

## 4. No agent-specific memory (VERIFIED + INFERRED)

Generic memory stores support `agentId` queries (`episodic-memory.ts:53`, `social-memory.ts:33`, `service-backed-memory.ts:46`) but nothing seeds or recalls Nadia-specific memory. Every session is cold (see 08).

## 5. Journal exists but is UI-hidden (VERIFIED)

`AgentJournalService` records her steps (`agent-journal-service.ts:130-191`) to Dexie KV, but no panel renders `listByAgent('agent-network')`. The data is collected and discarded from the user's view.

## 6. Misleading topology comment (VERIFIED, minor)

`topology-defaults.ts:143` labels `agent-network` as one of "3 dynamic agents (no fixed provider/model)", but the profile pins groq/llama-3.3-70b-versatile (`agent-profiles.ts:28-29`, applied at `:96-106`). Confusing for maintainers.

## 7. Debate side forced neutral via Invocation (VERIFIED)

`phase21-invocation.ts:81` hard-codes `role:'neutral'` for debate-mode invocation. A human invoking Nadia into a debate can't give her pro/con — limiting her debate usefulness through that path.

## 8. Expertise/role/scheduled invocation unwired (VERIFIED)

Engine supports `target.expertise`/`role` and `module-event` source (`invocation-engine-service.ts:158-173,124-144`), but no UI/policy uses them. The "right expert for the topic" routing is absent.

## 9. No lens attached (VERIFIED)

`lensIds: []` (`topology-defaults.ts:106`). Even `lens:security` (adjacent) isn't attached, though it would strengthen her network-security stance.

## 10. Shared-infra limits (VERIFIED, systemic)

- Stats capped at 500 agents (`agent-service.ts:72`); groups/user-created only (`agent-service.ts:667`).
- `cognitive:decision:made` dead-at-consumer (AGENTS.md) — affects all agents.
- Auto-spawn clones copy config verbatim (`agent-service.ts:642-649`) — a Nadia clone is identical, no diversity.

## Severity ranking (OPINION)

High: #1 (specializations dead), #2 (no tools). Medium: #3, #4, #5, #8. Low: #6, #7, #9, #10.
