# 08_MEMORY_AND_CONTEXT — Memory available to / saved for `agent-security`

> VERIFIED storage + INFERRED continuity gaps.

## What is persisted about `agent-security` today (VERIFIED)

| Store                   | Key                           | Content                                                                                                                                           | Source                                                   |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Topology config (Dexie) | node `agent-security`         | `prompt`, `temperature`, `tools`, `model`, `provider`, `displayName`, `firstName`, `lastName`, `baseRole`, `specializations`, `avatar`, `lensIds` | `topology-defaults.ts:194-205`, `normalizeAgentIdentity` |
| Agent stats KV          | `super_agents_agent_stats`    | per-node `calls/tokens/latency/errors/cost`                                                                                                       | `agent-service.ts:68,133-145`                            |
| Agent groups KV         | `super_agents_agent_groups`   | generic groups (none seed `agent-security`)                                                                                                       | `agent-service.ts:69`                                    |
| Agent journal KV        | `agent_journal_v1`            | step records (`agentId`, `taskType`, `outcome`, `durationMs`, `tags`)                                                                             | `agent-journal-service.ts:36,41-80`                      |
| Invocation records      | `invocations` (Dexie v20)     | when invoked via Room (requested→done)                                                                                                            | `phase21-invocation.ts`                                  |
| Conversation scenarios  | `conversationScenarios` (v19) | if used as Director participant                                                                                                                   | schema-types                                             |
| Debate sessions         | debate tables                 | if used as debate participant                                                                                                                     | debate DAL                                               |

## What is NOT available (INFERRED — gaps)

1. **No semantic memory of past security findings.** The journal stores `taskDescription` (truncated output ≤200 chars, `agent-journal-service.ts:163`) — not structured findings, CVEs, or decisions. `agent-security` cannot recall "last time we reviewed the auth gateway."
2. **No cross-session continuity of identity edits.** `updateAgent` mutates the in-memory topology (`agent-service.ts:432-441`) but persistence depends on orchestrator mount + KV; specializations edited in UI are not guaranteed durable across reloads unless the topology is saved.
3. **`specializations` are metadata, not context.** They are not loaded into a memory module before a run, so each invocation starts "cold" with only the static prompt.
4. **No agent-scoped memory store.** The ~16 memory stores in the system (per shared context) are not keyed to `agent-security`. INFERRED: none reference it (grep `agent-security` in `src` returns only topology + profiles).

## Continuity improvements (OPINION → see 11/13)

- **SEC-MEM-1 (QW):** Extend `AgentJournalService` to persist a structured `securityFinding` shape (severity, category, recommendation) extracted from `COGNITIVE_STEP_COMPLETED`/`debate:argument` for `domain:security` agents, queryable later.
- **SEC-MEM-2 (Medium):** On invocation, prepend the last N security findings (from journal) into the agent's system prompt as "prior context" — gives `agent-security` memory without a new store.
- **SEC-MEM-3 (Big):** Bind the existing `lens:security` + a memory store so `agent-security` can "crystallize" recurring threats into the Crystal Vault (`crystal-types.ts:17` already has a `security` domain).
