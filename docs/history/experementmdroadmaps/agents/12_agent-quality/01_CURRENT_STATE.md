# 01_CURRENT_STATE — What `agent-quality` ACTUALLY does now

**Honest summary: `agent-quality` is a topology NODE + a profile. There is NO agent-specific runtime code.** Its behaviour is entirely the shared infrastructure that every other agent node receives. Below is exactly what happens when it is invoked, verified against source.

## When invoked in a Debate (VERIFIED)

- It is added as a `DebateParticipant` (`id`, `name`, `role`). The debate runtime calls `PersonaSelector.selectForTopic(agentId, agentRole, topic, round, usedVariants, lang)` (`persona-selector.ts:293`).
- `agentRole` is **"Quality Engineer"** (resolved from node `roleName`). In `selectVariant` (`persona-selector.ts:260-266`) the filter keeps only variants whose `suitableRoles` includes the lowercased role OR role === `'neutral'`. **"quality engineer" matches none**, and is not `'neutral'`, so `eligible = []` → `selectVariant` returns `undefined` → **no persona injection string is returned** (`persona-selector.ts:268-290`).
- Consequence (INFERRED): the agent speaks only with its node `prompt` ("You are a quality engineer…") and the generic debate system prompt. It is treated like any neutral participant but gets **no QA-flavoured persona steering**. Its specializations (Test Automation/QA/Coverage) are passive text in the prompt, never exercised by any runtime hook.

## When invoked via ConversationCore / Director (VERIFIED)

- `ConversationOrchestrator` / `ChatExecutor` call `agentService.resolveAgent('agent-quality')` (`agent-service.ts:337-390`). The returned `model` is `undefined` because the node config sets `model:'auto'` (`agent-service.ts:351-353`) → the execution engine picks a model by its own routing, **not** `llama-3.1-8b-instant`.
- The agent "speaks" the authored `TurnProposal` objective using its node `systemPrompt`.

## When invoked via Invocation (RoomPanel) (VERIFIED)

- RoomPanel maps the human's agent `<select>` to `target.agentId='agent-quality'`; `InvocationEngineService.invoke` resolves it via `AgentResolverDirectory.resolveAgent` (`phase21-invocation.ts:44-57`), then `InvocationExecutionDelegate.start` hands off to chat/director/debate (`phase21-invocation.ts:68-89`). For `mode:'debate'` it is injected as `role:'neutral'` (`phase21-invocation.ts:81`).

## Passive observability that applies to it (VERIFIED)

- **Stats:** `AgentService` listens to `COGNITIVE_STEP_COMPLETED` and updates per-node `calls/tokens/latency/errors/cost` (`agent-service.ts:184-210`). Also `STREAM_END` for provider/key-level stats (`agent-service.ts:219-244`). Persisted to Dexie KV `super_agents_agent_stats` (`agent-service.ts:68,121`).
- **Journal:** `AgentJournalService` records an entry on `COGNITIVE_STEP_ACTIVE`, `COGNITIVE_STEP_COMPLETED`, and `debate:runtime:agent:error` (`agent-journal-service.ts:129-191`). Entries use `agentId` (the node id) as both id and name — **display name "Noah Ferreira" is NOT stored** (INFERRED minor UX gap).
- **Health:** `AgentHealthMonitor` ingests `COGNITIVE_STEP_COMPLETED` per node; can auto-restart via `agentService.restartAgent` when unhealthy threshold hit (`agent-health-monitor.ts:27-69`).
- **Lifecycle:** `AGENT_LIFECYCLE_CHANGE` / `AGENT_HEALTH_CHANGE` tracked (`agent-service.ts:245-254`).

## What it does NOT do (VERIFIED)

- Emits **no** cognitive events itself (it only produces `COGNITIVE_STEP_COMPLETED` as a side-effect of execution, consumed by others).
- Writes **nothing** agent-specific to memory beyond the generic journal.
- Has **no** QA tool, **no** test-runner, **no** coverage analysis, **no** lens. Its specializations are declarative metadata only.
