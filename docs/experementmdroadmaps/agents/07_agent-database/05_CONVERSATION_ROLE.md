# 05_CONVERSATION_ROLE — `agent-database` in ConversationCore / Director

## How it is reached today (VERIFIED)

- `ConversationOrchestrator` and `ChatExecutor` resolve the agent via `agentService.resolveAgent('agent-database')` (`agent-service.ts:337`), which returns the DB-engineer system prompt + pinned `llama-3.3-70b-instruct` model + `lensIds` (empty) + `specializations`.
- `ConversationDirectorService` (`conversation-director-service.ts`) runs deterministic `TurnProposal` sequences; a turn with `participantId:'agent-database'` is spoken by this agent's persona.
- Invocation Engine's `InvocationExecutionDelegate` (`phase21-invocation.ts:60-110`) builds a chat/director-scenario around the human-picked agent and calls `director.loadScenario` + `run()`.

## Current limitation (VERIFIED)

- The Director treats the agent as a generic speaker. A `TurnProposal` objective like "Participate in <topic>" (`phase21-invocation.ts:91-98`) carries no DB-specific scaffolding. The agent's specializations are not used to shape the objective or to inject a data lens.

## POTENTIAL scenarios (INFERRED/OPINION)

1. **Schema review conversation.** A Director scenario: `agent-architect` proposes a schema → `agent-database` turn "Review this schema for normalization, index strategy, and replication feasibility." The pinned model + DB prompt produce a grounded critique.
2. **Migration planning.** Multi-turn: `agent-database` drafts a zero-downtime migration plan (turn 1), `agent-devops` reviews deploy risk (turn 2), `agent-security` reviews exposure (turn 3). Director's deterministic order guarantees the DB step runs first.
3. **Query-tuning clinic (Invocation).** Human opens Room → picks Priya Nair → pastes a slow query → `reason:"tune this SQL"` → Invocation creates a chat scenario → agent returns indexing/rewrite advice. Works TODAY via `Manual Room Chat` policy; only the _quality_ is limited by the lack of a real `sql_executor`.

## RECOMMENDED enhancement (OPINION)

Let `TurnProposal.objective` optionally carry `domain:'database'` so the orchestrator can (a) attach the (future) data lens and (b) pass the agent's `specializations` into the prompt as explicit constraints. This is a small contract addition on the existing `TurnProposal` (`contracts/conversation/turn.ts`) and requires no new service.
