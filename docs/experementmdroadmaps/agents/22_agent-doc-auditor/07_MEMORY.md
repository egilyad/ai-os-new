# 07_MEMORY — `agent-doc-auditor` in Memory / Journal

**VERIFIED.** Doc-auditor is persisted and journaled through shared memory infrastructure; there is no doc-auditor-specific memory store.

## Agent Journal

- `AgentJournalService` (`src/kernel/services/agent-journal-service.ts:96`) records `JournalEntry` (`agentId, agentName, taskType, taskDescription, outcome, durationMs, tokensUsed, notes, tags, timestamp`, `:7-19`).
- The service is event-driven (`eventBus.on`, `:22`) and keyed generically by `agentId`; doc-auditor's completed tasks land in `agent_journal_v1` (`STORAGE_KEY`, `:36`) via the `IDatabaseService` KV store (capped `MAX_ENTRIES = 1000`, `:37`).
- UI: `components/AgentJournalPanel/JournalEntryCard.tsx` renders any agent's entries, using `AgentAvatar` (`AgentsPanel/AgentAvatar`) — doc-auditor shows its 🔍.

## ~16 memory stores

**INFERRED.** The AGENTS.md note references "~16 memory stores". A grep of `agent-journal`/memory shows `debate-memory.ts` (per-session reasoning steps keyed by `agentId`), `AgentJournalService`, `BucketStorageAdapter.AGENTS` (`storage-adapter.ts:77`), plus generic `kvector`/semantic-memory stores. Doc-auditor participates in whatever memory the subsystem it runs in uses (debate memory when debating, journal when tasked, conversation history when in Director). No store is keyed to `agent-doc-auditor` specifically.

## Stats as lightweight memory

- `AgentService.stats` (`agent-service.ts:15-23`, `:75`) is per-agent long-lived memory of calls/tokens/errors/cost; doc-auditor's stats live here (`getStats`, `getAllStats`). Persisted to KV on unload/destroy (`:103-128`).

## OPINION

Doc-auditor has no persistent "auditor knowledge base" of its own (no dedicated table/store). Its institutional memory is the shared journal + debate memory + the code-manifest it cross-checks against at prompt time. If a true "audit trail of documentation defects" is desired, that would require a NEW store — currently not present (see `15_DO_NOT_BUILD_YET.md`).

## INFERRED

Because `tools: []` (00_PROFILE), doc-auditor cannot _write_ to memory stores at runtime (no tool to call `AgentJournalService`); its journal entries are produced by the host subsystem (AgentService/debate pipeline), not by the agent itself.
