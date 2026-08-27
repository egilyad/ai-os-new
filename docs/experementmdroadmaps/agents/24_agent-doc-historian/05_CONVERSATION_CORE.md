# 05_CONVERSATION_CORE — `agent-doc-historian`

How the historian is used by ConversationCore: ChatExecutor, ConversationOrchestrator, DirectorService.

## VERIFIED

- ConversationCore resolves participants via `agentService` (AGENTS.md; `agent-service.ts:337-390`).
- `ChatExecutor` speaks a turn "as" the named agent by calling `agentService.resolveAgent(participantId)` to get `systemPrompt`, `model`, `displayName`, `avatar` (`agent-service.ts:337-390`). For the historian this yields the topology prompt (narrative-context historian) and `model: undefined` (node model `'auto'` → falls back to caller default).
- `ConversationOrchestrator` (ConversationCore) resolves agents the same way; participant ids are node ids. So a Director scenario turn with `participantId: 'agent-doc-historian'` runs the historian node.
- `ConversationDirectorService` (B3/B5 of AGENTS.md) is bound in `phase20-director.ts` to `ChatExecutionEngine` over `chatService`; the engine resolves the historian through `agentService`.
- `phase21-invocation.ts:89-108`: `mode: 'chat' | 'director-scenario'` → builds a `ScenarioRepository.create({ participants, turns })` where each turn's `participantId = a.id` (the historian if selected), `topic = context.ref`, then `director.loadScenario` + `director.run()`. So a Room invocation of the historian in chat mode literally runs it through ConversationCore.

## INFERRED

- The historian's specializations are never used by ConversationCore to pick it; the participant id is explicit in the scenario/invocation. Route selection is caller-driven.
- Because `model` resolves to `undefined`, the historian's pinned `openrouter/meta-llama/llama-3.3-70b-instruct` is only honored if ConversationCore's `ChatExecutor` re-reads `AGENT_PROFILES` for the model. Otherwise the chat caller's default model is used. **VERIFIED GAP** (see 01_IDENTITY): node config model is `'auto'`.

## OPINION

- For deterministic lineage/changelog output, the historian should be invoked with an explicit model so its reasoning stays on the pinned 70B instruct model rather than whatever default the chat path selects.
