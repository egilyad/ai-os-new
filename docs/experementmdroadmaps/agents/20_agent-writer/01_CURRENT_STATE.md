# 01_CURRENT_STATE — What `agent-writer` ACTUALLY does now

> Honest, shared-infrastructure view. The agent has **no code of its own** — it is a topology node + a curated profile. All behavior is inherited from shared services.

## The honest summary

`agent-writer` is **one record** in two shared tables:

1. `AGENT_PROFILES['agent-writer']` — a curated identity blob (`agent-profiles.ts:212-221`).
2. A topology node `{ id, type:'agent', label, config }` (`topology-defaults.ts:382-393`), whose config is enriched at load time by `normalizeAgentIdentity` merging the profile (`topology-defaults.ts:91-118`).

There is **no `writer.ts`, no `writer-service.ts`, no writer-specific logic anywhere** in the codebase. `[VERIFIED]` grep for `agent-writer` outside topology/profile/audit/role returns nothing; grep for `WritingAgent`/`Technical Writer` only hits the profile and `role-service.ts:300`.

## What it does when invoked

When the runtime (router, debate, Director turn, or Invocation) speaks "as `agent-writer`":

- `AgentService.resolveAgent('agent-writer')` returns the merged config: name "Clara Bengtsson", role "Technical Writer", model `llama-3.1-8b-instant`, provider `groq`, systemPrompt from node `config.prompt` (`agent-service.ts:337-390`). `[VERIFIED]`
- That identity is handed to the LLM caller (debate `debate-llm-caller.ts`, `ChatExecutor`, `ConversationOrchestrator`). The LLM is prompted with the node's static `prompt` (`topology-defaults.ts:388`) plus any persona injection.
- In a **debate**, the persona injected is chosen by `PersonaSelector.selectForTopic` purely from **topic keywords** (`persona-selector.ts:243-308`) — e.g. `technologist` for "AI/software" topics, `cautious_scientist` for "research". The node's `specializations: ['Documentation','Tutorials','API Docs']` are **never consulted** for persona or participant selection. `[VERIFIED]`

## So its "Documentation" identity is decorative in debate

The writer can be made to argue as a _Philosopher_ or _Military Strategist_ in a debate, because `PersonaSelector` ignores specializations (`persona-selector.ts:3-241` — no reference to `specializations` or `AGENT_PROFILES`). `[INFERRED]` This means Clara's actual expertise is not guaranteed to be used; she is a generic LLM mouthpiece labeled "Technical Writer."

## Lifecycle / stats

- `AgentService` tracks per-node `AgentStats` (calls, tokens, latency, errors, cost) updated from `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184-210`). The writer accrues stats whenever it executes a cognitive step.
- Lifecycle states (`initializing/ready/running/busy/paused/terminated`) are managed by `transitionLifecycle` (`agent-service.ts`). The writer is `ready` by default in the loaded topology.
- `getStats('agent-writer')` is the data behind `AgentCard`/dashboard "top agents" (`agent-service.ts:292-304`, `getTopAgents`).

## Storage footprint

- Identity: in-memory topology node (no dedicated Dexie table for agent identity).
- Stats: persisted to KV `super_agents_agent_stats` (`agent-service.ts:68,103`).
- Journal entries: `AgentJournalService` records each cognitive step / debate error keyed by `nodeId` (`agent-journal-service.ts:150-171`).
- No writer-specific memory, no writer-specific documents table. `[VERIFIED]` grep shows no `agent-writer` references in memory-engine, crystal, forum, workflow/builder, scheduler.

## Bottom line

`agent-writer` **exists as a labeled, model-pinned LLM persona**. It "does" exactly what any other agent node does: receives a prompt + persona and generates text. Its documentation specialization is **currently inert** except as human-readable metadata shown in the UI. It is indistinguishable in capability from the five `doc-*` siblings except by its static prompt string and specialization labels.
