# 08_MEMORY — Memory & Journal

**Status:** VERIFIED (infra exists) + N/A (no dedicated store). doc-checker and memory.

## Agent Journal

`src/kernel/services/agent-journal-service.ts:96` `AgentJournalService` records per-agent journal entries. Registered in `phase2-infrastructure.ts:56`, exposed as `agentJournalService` lazyService (`services-core.ts:118`), surfaced at route `/agent-journal` (`route-registry-system.ts:36`, `route-imports.ts:49,246`).

- The journal listens to `COGNITIVE_STEP_ACTIVE` (agent-journal-service.ts:143) and other cognitive lifecycle events to record entries (agent-journal-service.ts:169-187).
- Because doc-checker emits cognitive steps during ConversationCore/Director execution (see 07), **it can accrue journal entries** if the journal service is active. No doc-checker-specific code exists; it is recorded by `nodeId` generically.

## Dedicated memory store?

- There is **NO** `agent-doc-checker`-specific memory store. The AGENTS.md note "agent-journal-service.ts; ~16 memory stores" refers to a fleet of ~16 generic memory stores, not per-agent stores.
- doc-checker's "memory" is therefore: (a) its `AgentService` stats (03), (b) its optional journal entries (above), (c) any conversation/debate session history it participates in (persisted via ConversationCore/Debate/Dexie).

## Memory stores count

INFERRED: the "~16 memory stores" are shared infrastructure (e.g. `debateLiveStore`, `directorStore`, `invocationStore`, crystal/forum/junction stores, etc.), not agent-keyed. doc-checker does not own one.

## Confidence

- Journal service + route: VERIFIED (grep + read header).
- No dedicated store: VERIFIED via Grep (`agent-doc-checker` absent from memory code) + OPINION on "~16 stores" interpretation (INFERRED from architecture).
