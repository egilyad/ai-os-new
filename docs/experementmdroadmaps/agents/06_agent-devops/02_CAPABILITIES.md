# 02_CAPABILITIES — capability matrix

Legend: **Exists** = implemented; **Used** = actually exercised in devops path; **UI** = exposed in UI.
Flags: `EXISTS-BUT-UNUSED`, `UI-HIDDEN`, `PARTIAL`, `DEAD`, `POTENTIAL`.

| Capability                              | Exists | Used (devops)               | Exposed in UI                            | Flag                                  | Evidence                                                                         |
| --------------------------------------- | ------ | --------------------------- | ---------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| Topology node / lifecycle               | ✅     | ✅                          | ✅                                       | —                                     | `topology-defaults.ts:206-217`, `agent-service.ts:588`                           |
| Curated identity (name/avatar/model)    | ✅     | ✅                          | ✅                                       | —                                     | `agent-profiles.ts:72-81` → `normalizeAgentIdentity`                             |
| Fixed model `llama-3.1-8b-instant`      | ✅     | ✅                          | ✅ (in identity chip)                    | —                                     | `agent-profiles.ts:79`, `agent-service.ts:351`                                   |
| Specializations (CI/CD,K8s,Obs)         | ✅     | ⚠️ Partial                  | ⚠️ UI-HIDDEN (shown only in detail chip) | PARTIAL                               | `agent-profiles.ts:80`; used by Invocation dir only (`phase21-invocation.ts:54`) |
| System prompt (DevOps)                  | ✅     | ✅                          | ❌                                       | —                                     | `topology-defaults.ts:212`                                                       |
| Debate participation + persona          | ✅     | ✅                          | ✅ (card)                                | POTENTIAL (persona ignores specialty) | `persona-selector.ts:251`                                                        |
| ConversationCore / Director turn        | ✅     | ✅                          | ✅                                       | —                                     | `agent-service.ts:337`                                                           |
| Human invocation (Room)                 | ✅     | ✅                          | ✅                                       | —                                     | `phase21-invocation.ts:43-58`, `RoomPanel.tsx`                                   |
| Agent stats (calls/tokens/cost)         | ✅     | ✅                          | ✅ (AgentLiveBoard)                      | —                                     | `agent-service.ts:184,288`                                                       |
| Agent journal entries                   | ✅     | ✅                          | ❌ (no UI consumer found)                | EXISTS-BUT-UNUSED                     | `agent-journal-service.ts:130,150`                                               |
| Memory store (~16 stores)               | ✅     | ⚠️ Indirect                 | ❓                                       | PARTIAL                               | no devops-specific wiring; see `08_MEMORY_AND_CONTEXT.md`                        |
| Cognitive event display                 | ✅     | ⚠️ Stats only               | ⚠️ UI-HIDDEN                             | PARTIAL                               | `agent-service.ts:184`; `COGNITIVE_DECISION_MADE` DEAD                           |
| Lens stack                              | ✅     | ❌ (empty)                  | ❌                                       | UI-HIDDEN + POTENTIAL                 | `topology-defaults.ts:106`; no ops lens                                          |
| Health monitor                          | ✅     | ✅                          | ⚠️ UI-HIDDEN                             | PARTIAL                               | `phase4-agents-roles.ts:123` (`agentHealthMonitor`)                              |
| Auto-recovery / auto-spawn              | ✅     | ✅ (generic)                | ❌                                       | —                                     | `agent-service.ts:614-665`                                                       |
| Groups / teams                          | ✅     | ❌ (no devops group seeded) | ❌                                       | EXISTS-BUT-UNUSED                     | `agent-service.ts:667`                                                           |
| Workflow/Builder invocation             | ✅     | ⚠️ Broken                   | ❌                                       | DEAD                                  | `builder-agent-service.ts:40` (`debate:start` nonexistent)                       |
| Forum authorship                        | ✅     | ❌ (not wired)              | ❌                                       | POTENTIAL                             | no refs                                                                          |
| Knowledge/Crystal contribution          | ✅     | ❌ (not wired)              | ❌                                       | POTENTIAL                             | no refs                                                                          |
| Scheduler trigger                       | ❌     | —                           | —                                        | POTENTIAL                             | no scheduler found                                                               |
| Real tool/API integration (kubectl, CI) | ❌     | —                           | —                                        | POTENTIAL                             | `CODER_TOOLS` only (`topology-defaults.ts:7`)                                    |

## Key flags explained

- **EXISTS-BUT-UNUSED:** Agent journal (`08`), Groups (no devops group), Builder debate hook (dead).
- **UI-HIDDEN:** specializations only appear in `AgentIdentityChip` detail view; cognitive decision stream is never shown; health status not surfaced per agent.
- **PARTIAL:** memory is system-wide, not devops-tuned; stats accrue but no devops-specific analytics.
- **DEAD:** `builder-agent-service.ts:40` emits `debate:start` which no consumer handles (workflow-service has no dispatch).
- **POTENTIAL:** ops lens, real K8s/CI tools, incident runbooks, scheduler, forum/knowledge authorship.

## Capability gaps vs. its own specialization (OPINION)

The agent is _named_ DevOps with CI/CD/Kubernetes/Observability specializations, yet **none** of those specializations are operationalized: no CI/CD tool, no cluster access, no observability data source, no runbook memory. The capability is declarative metadata, not functional.
