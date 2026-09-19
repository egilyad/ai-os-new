# 02_CAPABILITIES — Capability Matrix (VERIFIED unless noted)

Legend: **Exists** = implemented in code; **Used** = actually invoked in the agent's runtime path; **UI** = exposed in some panel; Flags: `EXISTS-BUT-UNUSED`, `UI-HIDDEN`, `PARTIAL`, `DEAD`, `POTENTIAL`.

| Capability                                             | Exists              | Used | UI                         | Evidence                                                                           | Flag                               |
| ------------------------------------------------------ | ------------------- | ---- | -------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| Generic LLM chat (system prompt + model)               | ✅                  | ✅   | ✅                         | `topology-defaults.ts:224`, `agent-service.ts:337`, `orchestration-service.ts:414` | —                                  |
| Curated model pin (`llama-3.3-70b-instruct`)           | ✅                  | ✅   | ✅                         | `agent-profiles.ts:89` → `topology-defaults.ts:105`                                | —                                  |
| DB-engineer system prompt                              | ✅                  | ✅   | ❌ (prompt hidden in UI)   | `topology-defaults.ts:224`                                                         | UI-HIDDEN                          |
| Specializations (SQL Tuning/Replication/Data Modeling) | ✅                  | ❌   | PARTIAL                    | `agent-profiles.ts:90`; read only for display (`agent-identity.ts:135`)            | EXISTS-BUT-UNUSED                  |
| `sql_executor` tool                                    | ✅ (declared)       | ❌   | ❌                         | `topology-defaults.ts:226`; **absent** from `tool-executor.ts:174-257`             | EXISTS-BUT-UNUSED / DEAD           |
| `data_analysis` tool                                   | ✅ (declared)       | ❌   | ❌                         | same as above                                                                      | EXISTS-BUT-UNUSED / DEAD           |
| Lens (data/sql)                                        | ❌                  | ❌   | ❌                         | `lensIds:[]` (`topology-defaults.ts:106`); no data lens exists                     | POTENTIAL                          |
| Debate participation                                   | ✅                  | ✅   | ✅                         | generic via `persona-selector.ts` (no DB variant)                                  | PARTIAL                            |
| ConversationCore / Director turn                       | ✅                  | ✅   | ✅                         | `conversation-director-service.ts` → `resolveAgent`                                | —                                  |
| Human Invocation (Room)                                | ✅                  | ✅   | ✅                         | `phase21-invocation.ts:125-144`                                                    | —                                  |
| Agent groups (parallel/consensus/debate)               | ✅                  | ✅   | ✅ (AgentGroupsSection)    | `agent-service.ts:688`                                                             | —                                  |
| Stats (calls/tokens/latency/cost)                      | ✅                  | ✅   | ✅ (AgentStatsDashboard)   | `agent-service.ts:184,219,288`                                                     | —                                  |
| Lifecycle pause/resume/restart                         | ✅                  | ✅   | ✅                         | `agent-service.ts:460,493`                                                         | —                                  |
| Auto-spawn clone                                       | ✅                  | ✅   | ❌                         | `agent-service.ts:614`                                                             | UI-HIDDEN                          |
| Agent journal entry                                    | ✅                  | ✅   | ✅ (AgentHistoryTab)       | `agent-journal-service.ts:130-150`                                                 | —                                  |
| Health monitor                                         | ✅                  | ✅   | ✅ (AgentObservabilityTab) | `agent-health-monitor.ts:66`                                                       | —                                  |
| Memory mesh read/write                                 | ✅ (shared)         | ✅   | ✅                         | `src/kernel/services/memory/*` (15 stores)                                         | PARTIAL (no DB-specific partition) |
| Cognitive event emit/consume                           | ✅                  | ✅   | PARTIAL                    | `orchestration-service.ts:414`; `agent-service.ts:184`                             | —                                  |
| `cognitive:decision:made`                              | ✅                  | ❌   | ❌                         | `event-registry.ts:776`; "dead-at-consumer" per AGENTS.md                          | DEAD                               |
| Research / Knowledge / Crystal participation           | ❌ (agent-specific) | N/A  | N/A                        | no route to `agent-database` in those modules                                      | POTENTIAL                          |
| Forum / Workflow / Scheduler participation             | ❌ (agent-specific) | N/A  | N/A                        | generic agent only                                                                 | POTENTIAL                          |
| SQL execution / schema introspection / EXPLAIN         | ❌                  | ❌   | ❌                         | no connector exists                                                                | POTENTIAL (biggest gap)            |

## Summary flags

- **EXISTS-BUT-UNUSED:** `sql_executor`, `data_analysis` (declared, never registered), `specializations` (display-only).
- **UI-HIDDEN:** system prompt, auto-spawn clones.
- **PARTIAL:** Debate (generic persona, no DB framing), memory (shared, no domain partition), cognitive display.
- **DEAD:** `cognitive:decision:made` (no consumer); the declared DB tools.
- **POTENTIAL:** real SQL tooling, data lens, domain memory, research/knowledge routing.
