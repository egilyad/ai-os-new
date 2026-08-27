# 04_DEBATE — Debate Runtime Participation

**Status:** VERIFIED (infra) + INFERRED (selection). doc-checker as a debate participant.

## How a debate participant is executed

`src/kernel/services/debate-runtime/debate-agent-executor.ts:38-117` `createAgentExecutor`:

- Looks up `ParticipantConfig` by `request.nodeId` (debate-agent-executor.ts:45-48).
- Reserves budget (250 tokens heuristic, debate-agent-executor.ts:52), calls `callLLM(sessionId, session, participant, signal)` (debate-agent-executor.ts:72).
- On success records usage via `session.recordUsage(participant.agentId, ...)` (debate-agent-executor.ts:78).
- It does NOT read `AGENT_PROFILES` or `agent-doc-checker` directly; it operates on whatever `ParticipantConfig` the debate session holds. So doc-checker can be a debate participant **if added to the session's participant list** by the orchestrator/scenario.

## Persona selection — NOT agent-specific

`src/kernel/services/debate-runtime/persona-selector.ts` defines 10 generic `PersonaVariant`s (cautious_scientist, philosopher, technologist, critic, etc.) selected by topic keywords + role + round (persona-selector.ts:3-290). **There is no doc-checker-specific persona.** A doc-checker node placed in a debate would be assigned a generic variant like any other agent based on the topic. Its _identity_ persona (the consistency-checker system prompt) comes from the topology node `config.prompt` (topology-defaults.ts:450), not from `persona-selector.ts`.

## Meta-agent controller

`debate-meta-agent-controller.ts` + `contracts/debate-meta-agent.ts` manage debate-level orchestration (per AGENTS.md). doc-checker has no special meta-agent role; it is a regular participant when present.

## Selection into a debate

- Via **ConversationCore-backed debate** (`conversation-backed-debate-orchestrator.ts`): participants resolve through `agentService` (per AGENTS.md).
- Via **Invocation Engine** debate mode (`phase21-invocation.ts:75-86`): the engine starts a debate with the human-picked agents; doc-checker can be one of them if selected in RoomPanel (see 06_INVOCATION).
- No automatic inclusion of doc-checker in debates — it is chosen by scenario/session config, not by any debate-policy rule.

## Cognitive events in debate

Per AGENTS.md: **"Debate emits NO cognitive events."** Therefore a debate turn by doc-checker does **not** flow through `COGNITIVE_STEP_COMPLETED`, and doc-checker's `AgentService` stats are NOT incremented from debate participation (only ConversationCore/LLM `STREAM_END` may apply at provider level). See 07_COGNITIVE_EVENTS.

## Confidence

- Executor mechanics: VERIFIED (read).
- "No doc-checker-specific persona": VERIFIED (`persona-selector.ts` contains no agent id references).
- Selection-by-config: INFERRED from architecture + AGENTS.md.
