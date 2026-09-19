# 02_CAPABILITIES — Capability matrix

Legend: **EXISTS** (wired & working) · **EXISTS-BUT-UNUSED** (data present, never acted on) ·
**UI-HIDDEN** (capability in data, not surfaced) · **PARTIAL** (works generically, not design-aware) ·
**DEAD** (code path dead) · **POTENTIAL** (feasible from existing infra).

| Capability                     | Status            | Used?             | Exposed in UI           | Evidence                                               |
| ------------------------------ | ----------------- | ----------------- | ----------------------- | ------------------------------------------------------ |
| Debate participant             | EXISTS            | Yes               | Yes (generic)           | `debate-agent-executor.ts:45`                          |
| Debate design persona          | POTENTIAL         | No                | No                      | `persona-selector.ts` has 0 design variants            |
| ConversationCore/Director turn | EXISTS            | Yes               | Yes                     | `agent-service.ts:337`                                 |
| Invocation (human pick)        | EXISTS            | Yes               | Yes (RoomPanel)         | `phase21-invocation.ts:43`                             |
| Research participation         | N/A               | —                 | —                       | no research subsystem binding                          |
| Memory — journal write         | PARTIAL           | Yes (nodeId)      | Yes (journal tab)       | `agent-journal-service.ts:130-172`                     |
| Memory — design continuity     | POTENTIAL         | No                | No                      | `listByAgent` is generic `:253`                        |
| Cognitive stream — stats       | EXISTS            | Yes               | Yes (stats dash)        | `agent-service.ts:184`                                 |
| Cognitive — decision surfacing | DEAD              | No                | No                      | `cognitive:decision:made` dead-at-consumer (AGENTS.md) |
| Workflow / Builder             | PARTIAL           | Yes (generic)     | Yes                     | builder uses agents generically                        |
| Forum participation            | PARTIAL           | Yes (AuthorBadge) | Yes                     | generic across 25 agents                               |
| Knowledge / Crystal            | N/A               | —                 | —                       | no design-specific binding                             |
| Lenses                         | EXISTS-BUT-UNUSED | No                | No                      | `lensIds:[]` `topology-defaults.ts:106`                |
| Scheduler                      | N/A               | —                 | —                       | no scheduler subsystem                                 |
| Analytics / stats dashboard    | EXISTS            | Yes               | Yes                     | `AgentStatsDashboard.tsx`                              |
| Agent UI card                  | EXISTS            | Yes               | Yes                     | `AgentCard.tsx`                                        |
| Health / auto-recovery         | PARTIAL           | Yes               | Yes (lifecycle)         | `agent-service.ts:588` + `evaluateAutoSpawn:614`       |
| Groups / teams                 | EXISTS            | Yes               | Yes                     | `createGroup:667`                                      |
| Specializations (UX/Proto/DS)  | EXISTS-BUT-UNUSED | No                | Display only            | `AgentCard.tsx:68`; unused in runtime (grep)           |
| Tools / prototyping            | EXISTS-BUT-UNUSED | No                | Shows "no capabilities" | `tools:[]` `topology-defaults.ts:314`                  |
| Design-specific system prompt  | POTENTIAL         | No                | No                      | prompt is generic `:312`                               |

## Flagged items

- **EXISTS-BUT-UNUSED ×3:** specializations, lensIds, tools — the agent's entire "design" identity
  is display metadata. (VERIFIED via grep + reads.)
- **DEAD:** `cognitive:decision:made` aggregation for the designer is inert (AGENTS.md states dead-at-consumer).
- **UI-HIDDEN:** model `groq/llama-3.3-70b-versatile` and provider are shown, but the _impact_ of
  "design on a 70b groq model with no tools" is never surfaced as a limitation.
- **PARTIAL:** memory/journal stores `agentName` as the raw `nodeId` (not "Kai Mendez") —
  `agent-journal-service.ts:135,160` — a minor correctness gap affecting every agent, designer included.
