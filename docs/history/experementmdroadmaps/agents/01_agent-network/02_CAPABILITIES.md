# 02_CAPABILITIES — Capability matrix for `agent-network`

Legend: **EXISTS** (real code), **USED** (actually exercised), **UI** (exposed in UI), **Flags**: EXISTS-BUT-UNUSED / UI-HIDDEN / PARTIAL / DEAD / POTENTIAL.

| #   | Capability                              | Exists                             | Used                                                       | UI                        | Evidence                                                       | Flag                                    |
| --- | --------------------------------------- | ---------------------------------- | ---------------------------------------------------------- | ------------------------- | -------------------------------------------------------------- | --------------------------------------- |
| 1   | Debate participant (pro/con/neutral)    | YES                                | YES                                                        | YES (DebatePanel)         | `debate-agent-executor.ts:38`, `topology-defaults.ts:145`      | PARTIAL - side not specialization-aware |
| 2   | ConversationCore / Director participant | YES                                | YES                                                        | YES (DirectorPanel)       | `conversation-execution-engine.ts:40-73`                       | OK                                      |
| 3   | Invocation by human (RoomPanel)         | YES                                | YES (mechanism)                                            | YES                       | `RoomPanel.tsx:121-141`, `phase21-invocation.ts:125-144`       | OK                                      |
| 4   | Invocation by expertise/role            | YES (engine supports)              | NO (no policy/UI)                                          | NO                        | `invocation-engine-service.ts:163-173` (role/expertise target) | EXISTS-BUT-UNUSED                       |
| 5   | Research participation                  | NO (agent-specific)                | N/A                                                        | NO                        | no network research flow                                       | N/A                                     |
| 6   | Memory read/write (semantic/episodic)   | YES (generic stores)               | NO (agent-specific)                                        | NO                        | `episodic-memory.ts:53`, `service-backed-memory.ts:46`         | EXISTS-BUT-UNUSED                       |
| 7   | Agent Journal (per-agent record)        | YES                                | YES (if it emits cognitive/debate events)                  | NO (no panel)             | `agent-journal-service.ts:130,150,174`                         | UI-HIDDEN                               |
| 8   | Cognitive-stream visibility             | YES (events exist)                 | PARTIAL (only COGNITIVE_STEP_COMPLETED, not during debate) | NO                        | `event-registry.ts:763`, `agent-service.ts:184`                | PARTIAL                                 |
| 9   | Workflow (Builder) participation        | NO (agent-specific)                | N/A                                                        | NO                        | `agent-network` not referenced in builder                      | N/A                                     |
| 10  | Forum participation (author)            | YES (generic)                      | POTENTIAL                                                  | YES (AuthorBadge)         | Forum `AuthorBadge` (AGENTS.md)                                | POTENTIAL                               |
| 11  | Knowledge / Crystal contribution        | NO (agent-specific)                | N/A                                                        | NO                        | cross-cutting only                                             | N/A                                     |
| 12  | Scheduler / auto-invoke                 | YES (engine supports module-event) | NO (no policy)                                             | NO                        | `invocation-engine-service.ts:124-144`                         | EXISTS-BUT-UNUSED                       |
| 13  | Analytics / stats (calls/tokens/cost)   | YES                                | YES                                                        | PARTIAL (Dashboard board) | `agent-service.ts:15-23,288-304`                               | PARTIAL                                 |
| 14  | UI card / avatar / role                 | YES                                | YES                                                        | YES                       | `AgentAvatar.tsx:47`, `AgentsPanel`                            | OK                                      |
| 15  | Health / auto-recovery                  | YES                                | YES (if health monitor runs)                               | PARTIAL                   | `agent-health-monitor.ts`, `agent-service.ts:493`              | PARTIAL                                 |
| 16  | Groups / teams                          | YES (service)                      | NO (no seeded group)                                       | NO (no UI for this agent) | `agent-service.ts:667-686`                                     | EXISTS-BUT-UNUSED                       |
| 17  | Lens attachment                         | YES (mechanism)                    | NO (lensIds:[])                                            | NO                        | `topology-defaults.ts:106`                                     | EXISTS-BUT-UNUSED                       |
| 18  | Tools (MCP/code)                        | NO                                 | N/A                                                        | N/A                       | `tools: []` (`topology-defaults.ts:152`)                       | N/A                                     |
| 19  | Auto-spawn clone                        | YES (service)                      | POTENTIAL                                                  | NO                        | `agent-service.ts:614-665`                                     | POTENTIAL                               |

## Interpretation

- **No DEAD capability** for this agent directly. The only system-level DEAD item is `cognitive:decision:made` (AGENTS.md) - it affects all agents equally, not Nadia alone.
- **EXISTS-BUT-UNUSED** cluster (rows 4, 6, 12, 16, 17): the engine/services support expertise targeting, memory, scheduler invocation, groups, and lenses, but none are wired to `agent-network`. These are the highest-leverage quick wins because the infrastructure already exists.
- **UI-HIDDEN** (row 7): the Agent Journal records Nadia's activity but there is no panel surfacing it per-agent.
- **PARTIAL** (rows 8, 11, 13, 15): cognitive visibility is missing during debate; stats exist but the Dashboard's `AgentLiveBoard` may or may not include Nadia depending on activity.

## Capability gaps (VERIFIED)

- Specializations (TCP/IP/SDN/Latency) are **never used at runtime** to differentiate Nadia's behavior - only for display and expertise-targeted invocation (which is itself unused).
- No tools -> cannot measure latency, run `iperf`, read topology configs, or call any network API. It can only _talk_ about networking.
