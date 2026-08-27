# 05_CONVERSATION_ROLE — `agent-doc-architect`

> ConversationCore (chat) + Conversation Director. **VERIFIED** path; turn-content is **INFERRED**.

## Resolution path (VERIFIED)

- `ConversationOrchestrator` and `ChatExecutor` resolve participants through `agentService.resolveAgent` (shared context + `agent-service.ts:337`). `ConversationDirectorService` also uses `agentService`.
- Therefore, when doc-architect is a participant, its turn runs on:
  - **model** = `openrouter/meta-llama/llama-3.3-70b-instruct` (merged at `topology-defaults.ts:105`)
  - **system prompt** = the architect prompt (`topology-defaults.ts:402`)
  - **temperature** = `0.1` (`topology-defaults.ts:403`)

## As a Chat participant

- A plain ConversationCore chat that lists `agent-doc-architect` as a participant will have it speak its architect persona, on 70B, with the "never invent / traceable to source" instruction.
- INFERRED: because `tools: []`, any "traceable to source" claim is self-asserted, not verified.

## As a Director scenario participant

- `ConversationDirectorService` → `HybridPolicy` → `ConversationOrchestrator` → `ChatExecutionEngine` → `ChatExecutor` (token `chatService`) → `agentService.resolveAgent`. (`AGENTS.md` B5.4a records this generic path; no Debate/Forum/`DEBATE_*` dependency.)
- A scenario can name doc-architect as a `participantId` in a `TurnProposal`; the objective `type`/`description`/`constraints` shape the turn.
- Example scenario (not yet authored): "Doc Architecture from spec" — `agent-architect` proposes design → `agent-doc-architect` drafts structure → `agent-doc-simplifier` simplifies. All participants already exist; only a scenario definition is needed (INFERRED feasible; currently none seeded).

## Invocation → ConversationCore (VERIFIED)

- RoomPanel human selects doc-architect → `invocationEngine.invoke` → `InvocationExecutionDelegate.start` with `mode:'chat'` → builds a `ScenarioRepository.create({participants, turns})` → `conversationDirectorService.loadScenario` + `run()` (`phase21-invocation.ts:89-108`).
- The real E2E (`room-invocation-e2e.integration.test.tsx`) proves any registered agent reaches `executing → done` through this path; doc-architect is reachable identically.

## Observability in conversation (VERIFIED)

- Unlike debate, ConversationCore **does** emit `conversation:*` events and the underlying LLM call emits `COGNITIVE_STEP_COMPLETED` (nodeId = `agent-doc-architect`) → stats/journal/memory/health all accrue. So conversation is the **only** path where doc-architect is fully observable today.

## Limitations (see 10)

- No `document:*` persistence of its output; no documents store; output lives only in the conversation session + journal.
- No grounding tools → output may drift from actual code.
