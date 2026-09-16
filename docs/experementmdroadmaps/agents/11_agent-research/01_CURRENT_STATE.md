# 01 — CURRENT STATE: what `agent-research` ACTUALLY does now

**Honest shared-infra assessment.** VERIFIED unless tagged INFERRED/OPINION.

## The single most important fact

`agent-research` is **not a specialized subsystem**. It is one of 25 topology NODES whose "behavior" is 100% provided by shared infrastructure. Its only agent-specific artifacts are:

1. A curated identity record in `AGENT_PROFILES` (`agent-profiles.ts:122-131`).
2. A system prompt + `SEARCH_TOOLS` + `temperature:0.4` in the topology node (`topology-defaults.ts:268-279`).
3. A forced-empty `lensIds:[]` (`topology-defaults.ts:106`).
4. Grouping as `'Analytical'` in `prompt-audit-service.ts:27`.

Everything else — execution, memory, stats, lifecycle, debate participation, invocation — is generic and shared with all other agents.

## What happens when it "runs"

- **Debate path:** When a human starts a debate and includes `agent-research` as a participant, `debate-agent-executor.ts:38-80` calls `deps.callLLM(...)` with the participant's node config (provider `openrouter`, model `openrouter/meta-llama/llama-3.3-70b-instruct`, the research system prompt, `SEARCH_TOOLS`). `debate-query-engine.ts` resolves a key/provider/model for it. A persona injection (most likely `cautious_scientist`) may be prepended (`persona-selector.ts`). It emits NO cognitive events (VERIFIED: debate runtime does not emit `COGNITIVE_*` — only `agent-journal-service` listens to `debate:runtime:agent:error` at `agent-journal-service.ts:174`).
- **ConversationCore / Director path:** `ConversationOrchestrator` resolves the node via `agentService.resolveAgent` (`agent-service.ts:337-390`) and speaks the turn with the pinned model/prompt. Emits `COGNITIVE_STEP_COMPLETED` / `COGNITIVE_STEP_ACTIVE` (`agent-service.ts:184,219`) which `AgentService` consumes for stats and `AgentJournalService` consumes for journaling.
- **Invocation path:** `phase21-invocation.ts` hands off to `ConversationDirectorService` (chat) or `DebateSyncManager` (debate). agent-research is just the target id.
- **Topology routing path:** if the `router` node routes a task to it (`topology-defaults.ts:476`), the orchestrator executes the node generically.

## What it does NOT do (despite its name)

- It does **not** call any real web/search tool at the kernel level. `SEARCH_TOOLS = ['web_search','summarize','document_query']` (`topology-defaults.ts:10`) are declared tool names; whether they are bound to a real adapter for this agent is not established by the profile/topology alone (INFERRED: tools are declarative here, wired by the debate/conversation execution harness, not guaranteed to resolve to a live web_search for this node).
- It does **not** produce citations, literature reviews, or structured bibliographies natively. Those are just words in its system prompt; there is no citation-extraction, source-tracking, or literature-graph service attached to it.
- It is **not** wired into the Knowledge Generator, Crystal Vault, Synthesis, or the Research Engine subsystem (VERIFIED by grep: no `agent-research` reference in those services).
- It has **no lens**, so it never benefits from `lens:critical`/`meta-uncertainty` etc. (`topology-defaults.ts:106`).
- It has **no agent-specific memory** beyond the generic `AgentJournalService` keyed by nodeId (`agent-journal-service.ts:253 listByAgent`).

## Operational reality

- Its stats (`calls/tokens/latency/errors/cost`) are accumulated by `AgentService` from `COGNITIVE_STEP_COMPLETED` + `STREAM_END` (`agent-service.ts:184-244`) and persisted to Dexie KV (`agent-service.ts:68-69,158-173`).
- Its lifecycle (ready/busy/paused/terminated) is tracked generically (`agent-service.ts:588-594`).
- Auto-spawn clones it only if it is the chosen source and load triggers (`agent-service.ts:614-665`).

**Bottom line:** Today `agent-research` is a _prompt-and-model preset_ wearing a lab-coat avatar. Its "research" capability is purely the text in its system prompt. The system has far richer research machinery (phase9 Research Engine, Crystal Vault, Synthesis, Knowledge Generator) that this agent is currently disconnected from.
