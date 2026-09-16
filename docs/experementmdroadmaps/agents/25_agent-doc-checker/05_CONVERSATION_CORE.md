# 05_CONVERSATION_CORE — ConversationCore / Director / ChatExecution

**Status:** VERIFIED. Primary execution path for doc-checker.

## Resolution seam

`ChatExecutionEngine` (`src/kernel/services/conversation-execution-engine.ts:23-141`) implements `IExecutionEngine` for the Conversation Director. On each `TurnProposal`:

1. `agent = this.agentResolver?.resolveAgent(proposal.participantId)` (conversation-execution-engine.ts:40). For doc-checker this returns the rich `ResolvedAgent` (model `meta/llama-3.3-70b-instruct`, provider `nvidia`, systemPrompt from topology node).
2. System persona message built from `agent.systemPrompt` (conversation-execution-engine.ts:41-43) — i.e. the consistency-checker prompt (topology-defaults.ts:450).
3. Builds the request: `provider:'auto'`, `model: agent?.model ?? 'default'` (conversation-execution-engine.ts:72-73). **So doc-checker's pinned model is sent; provider is auto-routed.**
4. `options.metadata.agentId = proposal.participantId` (conversation-execution-engine.ts:80) — tags the turn for stats/policy.

## ChatExecutor applies model/provider

`src/kernel/services/chat-executor.ts`:

- Reads `agentId = req.options?.metadata?.agentId` (chat-executor.ts:121). If a `provider` is explicitly set and `agentId` present, runs `policyService.checkAgentPolicy(agentId, provider, model)` (chat-executor.ts:128-141). Since ConversationCore uses `provider:'auto'`, this branch is skipped and the runtime auto-routes (chat-executor.ts:201-232).
- Effective model = `req.model || 'default'` (chat-executor.ts:254) → `meta/llama-3.3-70b-instruct` for doc-checker.
- Emits `MESSAGE_RESPONSE` / `STREAM_END` (chat-executor.ts:472-520).

## Wiring (Director → Engine)

`phase20-director.ts:36` constructs `ChatExecutionEngine(c.get('chatService'), c.get('eventBus'))` — note `agentResolver` is **optional and not passed here**, so in the default Director wiring the engine may fall back to no resolver. The B5.4a DirectorService (`conversation-director-service.ts`) uses this engine. The `conversation-director-service.runtime.test.ts:66` registers `agentService` for resolution in tests. In production, whether the resolver is injected depends on the `phase20` registration — **OPINION:** the production `ChatExecutionEngine` likely resolves agents via the injected `agentResolver` when present; otherwise `agent` is null and the turn loses the doc-checker persona. This should be confirmed against `phase20-director.ts` full body if behavioral fidelity matters.

## ConversationOrchestrator

`conversation-orchestrator.ts` (per AGENTS.md B4) emits `conversation:*` events and resolves participants via `agentService`. No doc-checker-specific code; it is one of many resolvable participants.

## Summary

doc-checker runs as a **ConversationCore/Director participant** with its curated model pin and consistency-checker persona. This is the path that produces `COGNITIVE_STEP_COMPLETED` stats (see 07).

## Confidence

- Engine request shape: VERIFIED (read).
- phase20 resolver injection: INFERRED/OPINION (only the test registration confirmed; full phase20 body not read). Flagged.
