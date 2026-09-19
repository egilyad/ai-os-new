# 02_CAPABILITIES — Capability Matrix

Legend: **Exists** (code present) · **Used** (actually exercised) · **Exposed in UI** · Flags: `EXISTS-BUT-UNUSED`, `UI-HIDDEN`, `PARTIAL`, `DEAD`, `POTENTIAL`.

| Capability                                   | Exists | Used               | Exposed in UI           | Flag                                       | Evidence                                                |
| -------------------------------------------- | ------ | ------------------ | ----------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Be selected as topology node                 | ✅     | ✅                 | ✅ (AgentsPanel)        | —                                          | `topology-defaults.ts:245-255`                          |
| Execute via LLM with fixed persona prompt    | ✅     | ✅                 | ⚠️ indirect             | —                                          | `topology-defaults.ts:250`, `agent-service.ts:337-390`  |
| Pinned provider/model (nvidia/llama-3.3-70b) | ✅     | ✅                 | ✅ (AgentDetail)        | —                                          | `agent-profiles.ts:108-109`, `topology-defaults.ts:105` |
| Low-temperature skepticism (0.1)             | ✅     | ✅                 | UI-HIDDEN               | —                                          | `topology-defaults.ts:251`                              |
| Stats tracking (calls/tokens/cost)           | ✅     | ✅ (topology only) | ✅ (AgentCard)          | PARTIAL                                    | `agent-service.ts:184-210`                              |
| Journal entry writing                        | ✅     | ✅ (topology only) | ⚠️ via journal svc      | PARTIAL                                    | `agent-journal-service.ts:150`                          |
| Memory write (memory-engine)                 | ✅     | ✅ (topology only) | UI-HIDDEN               | PARTIAL                                    | `memory-engine.ts:181`                                  |
| Debate participation                         | ✅     | ✅ (manual)        | ✅ (Debate UI)          | —                                          | debate participants via agentService                    |
| Debate persona variant assignment            | ✅     | ✅                 | UI-HIDDEN               | —                                          | `persona-selector.ts:251-290`                           |
| Fallacy detection (structured)               | ❌     | ❌                 | ❌                      | DEAD (string only)                         | `agent-profiles.ts:110` only                            |
| Logic verification (structured)              | ❌     | ❌                 | ❌                      | DEAD (string only)                         | `agent-profiles.ts:110` only                            |
| Critical Lens auto-apply                     | ❌     | ❌                 | ❌                      | EXISTS-BUT-UNUSED (lens exists, not bound) | `lens-library.ts:11-41`, no `lensIds`                   |
| ConversationCore / Director turn             | ✅     | ✅ (manual)        | ✅ (Director)           | —                                          | `agent-service.ts:337` resolveAgent                     |
| Invocation (Room human-pick)                 | ✅     | ✅                 | ✅ (RoomPanel)          | —                                          | `RoomPanel.tsx:89-141`                                  |
| Research module participation                | ⚠️     | ⚠️                 | ⚠️                      | POTENTIAL                                  | generic agent node, no critic-specific wire             |
| Knowledge/Crystal participation              | ⚠️     | ⚠️                 | ⚠️                      | POTENTIAL                                  | generic agent node                                      |
| Forum participation (AuthorBadge)            | ✅     | ✅ (as author)     | ✅                      | —                                          | forum uses agentService identity                        |
| Workflow/Builder participation               | ⚠️     | ⚠️                 | ⚠️                      | POTENTIAL                                  | generic node, no critic-specific                        |
| Scheduler trigger                            | ❌     | ❌                 | ❌                      | DEAD                                       | no scheduler→critic binding found                       |
| Analytics/stats aggregation                  | ✅     | ✅                 | ✅ (Dashboard)          | PARTIAL                                    | `agent-service.ts:296-304` getTopAgents                 |
| Health/auto-recovery                         | ✅     | ✅                 | ✅ (AgentCard status)   | —                                          | `agent-health-monitor.ts:66`                            |
| Groups/teams membership                      | ✅     | ✅ (user-defined)  | ✅ (AgentCard groups)   | —                                          | `agent-service.ts:667-799`                              |
| Auto-spawn clone                             | ✅     | ✅                 | UI-HIDDEN               | —                                          | `agent-service.ts:614-665`                              |
| Cognitive event emission (as node)           | ✅     | ✅ (topology)      | ✅ (LiveActivityStream) | PARTIAL                                    | `orchestration-service.ts:414`                          |
| Cognitive event in debate                    | ❌     | ❌                 | ❌                      | DEAD                                       | no debate COGNITIVE_STEP_COMPLETED emit                 |

## Flag explanations

- **EXISTS-BUT-UNUSED:** `lens:critical` (`lens-library.ts:11-41`) is registered and functional, but no code binds it to `agent-critic`. The agent's specializations are not surfaced to the lens engine.
- **PARTIAL:** Stats/journal/memory update only during _topology_ execution, never during debate or conversation (no `COGNITIVE_STEP_COMPLETED` from those paths).
- **DEAD:** "Fallacy Detection" / "Logic" appear only as profile strings; no structured detection or verification exists or is consumed anywhere.
- **UI-HIDDEN:** Temperature, lens availability, and the fact that the agent is a debate participant are not surfaced in any critic-specific UI.
- **POTENTIAL:** Research/Knowledge/Workflow can include the agent as a generic node but nothing leverages its critique specialty.
