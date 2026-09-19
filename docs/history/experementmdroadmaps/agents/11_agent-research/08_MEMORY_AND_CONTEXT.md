# 08 — MEMORY AND CONTEXT

## Memory available to agent-research (VERIFIED)

1. **AgentJournalService** (`agent-journal-service.ts`): keyed by `nodeId`. Records every `COGNITIVE_STEP_ACTIVE/COMPLETED` and `debate:runtime:agent:error` as a `JournalEntry` (`agent-journal-service.ts:129-191`). Read by `listByAgent('agent-research')` (`agent-journal-service.ts:253`), surfaced in `AgentDetailPanel` history tab.
2. **AgentService stats** (`agent-service.ts:68,158-173`): calls/tokens/latency/errors/cost persisted to Dexie KV `super_agents_agent_stats`.
3. **Generic memory stores (~16 per AGENTS.md):** INFERRED to exist (e.g. conversation blackboard, trace store, synthesis/crystal stores) but **none are agent-research-specific**. There is no `agent-research` memory namespace.

## Memory written BY agent-research

- It does **not** write structured memory of its own. Its outputs (debate arguments, conversation turns) are persisted only insofar as the host subsystem persists them (debate session store, conversation scenario, journal entries). No "research notes / source list / citation index" is stored.

## Memory read BY agent-research

- At turn time it receives only the prompt + injected persona + (debate) argument history + (conversation) blackboard. It does **not** load its own past journal, past debates, or any Crystal/Synthesis artifact. Each invocation is effectively amnesic regarding its own history.

## Continuity improvements (recommended)

1. **Auto-load prior journal** — when agent-research is invoked (debate/conversation/invocation), seed its system prompt with a condensed summary of `listByAgent('agent-research')` (last N entries). Reuses `AgentJournalService.listByAgent` — no new store.
2. **Tag research outputs** — extend `JournalEntry.tags` to include `literature-review`/`synthesis`/`citations` based on the turn objective, enabling `listByTag` (`agent-journal-service.ts:257`).
3. **Bridge to Crystal Vault** — when it produces a synthesis, offer one-click crystallize (Crystal Vault already supports `propose`/`crystallize`; agent-research is not wired to it — see 03). This gives it persistent, queryable knowledge.
4. **Lens memory** — attach `lens:critical`/`meta-uncertainty` so its reasoning is recorded with those perspectives (lenses are otherwise unused by this agent).

## Risk / dependencies

- All improvements are **additive** and reuse existing stores. No new Dexie table required for #1–#2. #3 depends on Crystal Vault APIs (exist). #4 depends only on seed data (`topology-defaults.ts:106`).
