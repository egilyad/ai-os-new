# 02_CAPABILITIES — Capability Matrix

> Legend: **EXISTS** (code present), **USED** (actually exercised at runtime),
> **UI** (exposed in UI), flags: **UI-HIDDEN**, **PARTIAL**, **DEAD**, **POTENTIAL**.

| #   | Capability                         | Exists       | Used | UI               | Evidence                                                                    | Flag                                             |
| --- | ---------------------------------- | ------------ | ---- | ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | Identity (name/role/avatar/model)  | ✅           | ✅   | ✅               | `agent-profiles.ts:142-151`, `topology-defaults.ts:91-119`, `AgentCard.tsx` | —                                                |
| 2   | Execute as LLM node (chat)         | ✅           | ✅   | ✅               | `chat-executor.ts:121`, `conversation-execution-engine.ts:40`               | —                                                |
| 3   | Debate participant                 | ✅           | ✅   | ✅               | `debate-orchestrator.ts`, `phase21-invocation.ts:75-86`                     | —                                                |
| 4   | Invocation (human)                 | ✅           | ✅   | ✅               | `phase21-invocation.ts:44-89`, `RoomPanel`                                  | —                                                |
| 5   | Specializations surfaced           | ✅           | ✅   | ✅               | `AgentCard.tsx:68-77`, `agent-profiles.ts:150`                              | —                                                |
| 6   | Specializations → invocation match | ✅           | ✅   | ⚠️               | `invocation-engine-service.ts:167-173`                                      | UI-HIDDEN (only via expertise target)            |
| 7   | Specializations → debate persona   | ❌           | ❌   | ❌               | `persona-selector.ts:243-290`                                               | DEAD-for-this-agent (keyword-only)               |
| 8   | Specializations → router filter    | ❌           | ❌   | ❌               | `chat-executor.ts:201-232` (no spec filter)                                 | POTENTIAL                                        |
| 9   | Lens assignment                    | ✅ (empty)   | ❌   | ✅ (editor)      | `topology-defaults.ts:106`, `lens-library.ts` (no creative lens)            | PARTIAL/UI-HIDDEN                                |
| 10  | Stats (calls/tokens/cost)          | ✅           | ✅   | ✅               | `agent-service.ts:184-210`, `AgentStatsDashboard`                           | —                                                |
| 11  | Journal / history                  | ✅           | ✅   | ✅               | `agent-journal-service.ts:129-191`, `AgentHistoryTab`                       | —                                                |
| 12  | Lifecycle control (pause/restart)  | ✅           | ✅   | ✅               | `agent-service.ts:460-515`                                                  | —                                                |
| 13  | Health monitor                     | ✅           | ✅   | ✅               | `agent-health-monitor.ts`, `AGENT_HEALTH_CHANGE` `event-registry.ts:938`    | —                                                |
| 14  | Auto-spawn clone                   | ✅           | ✅   | ✅               | `agent-service.ts:614-665`                                                  | EXISTS-BUT-UNUSED for creative (clones busy src) |
| 15  | Groups / teams                     | ✅           | ✅   | ✅               | `agent-service.ts:667-799`, `AgentGroupsSection`                            | —                                                |
| 16  | Memory write (journal)             | ✅           | ✅   | ✅               | `agent-journal-service.ts`                                                  | —                                                |
| 17  | Memory read (semantic)             | ❌           | ❌   | ❌               | no agent-keyed memory store                                                 | POTENTIAL                                        |
| 18  | Cognitive event emit               | ✅ (generic) | ✅   | ⚠️               | `COGNITIVE_STEP_COMPLETED` `event-registry.ts:763`                          | UI-HIDDEN (no creative-specific view)            |
| 19  | Cognitive decision event           | ✅ (schema)  | ❌   | ❌               | `COGNITIVE_DECISION_MADE` `event-registry.ts:776`                           | DEAD-at-consumer                                 |
| 20  | Research module participation      | ⚠️           | ⚠️   | ⚠️               | generic topology node; no creative-specific path                            | POTENTIAL                                        |
| 21  | Knowledge/Crystal participation    | ⚠️           | ⚠️   | ⚠️               | generic; `crystal-debate-bridge` topic-keyed                                | POTENTIAL                                        |
| 22  | Forum participation                | ⚠️           | ⚠️   | ✅ (AuthorBadge) | `ForumPanel/AuthorBadge`                                                    | PARTIAL                                          |
| 23  | Workflow/Builder participation     | ⚠️           | ⚠️   | ⚠️               | generic node; no creative-specific                                          | POTENTIAL                                        |
| 24  | Scheduler participation            | ⚠️           | ❌   | ❌               | no scheduler→agent-creative binding found                                   | POTENTIAL                                        |
| 25  | Prompt-audit grouping              | ✅           | ✅   | ✅               | `prompt-audit-service.ts:21-24` (Creative group)                            | —                                                |
| 26  | Elo / leaderboard                  | ✅           | ✅   | ✅               | `EloLeaderboard.tsx`                                                        | —                                                |
| 27  | Comparison view                    | ✅           | ✅   | ✅               | `AgentComparison.tsx`                                                       | —                                                |
| 28  | Wizard (create clones)             | ✅           | ✅   | ✅               | `AgentWizard.tsx`, `agent-wizard-service.ts`                                | —                                                |
| 29  | Marketplace                        | ✅           | ⚠️   | ✅               | `agent-marketplace.ts`                                                      | PARTIAL                                          |
| 30  | Protocol service                   | ✅           | ⚠️   | ⚠️               | `agent-protocol-service.ts`                                                 | PARTIAL                                          |
| 31  | Version service                    | ✅           | ⚠️   | ⚠️               | `agent-version-service.ts`                                                  | PARTIAL                                          |

## Flag summary

- **DEAD-for-this-agent:** Debate `PersonaSelector` ignores `specializations`
  (`persona-selector.ts:243-290`). The "Creative Visionary" identity has zero influence
  on debate persona selection.
- **DEAD-at-consumer:** `COGNITIVE_DECISION_MADE` exists in schema but is documented as
  dead-at-consumer (AGENTS.md). `agent-creative` never emits it.
- **UI-HIDDEN:** Specialization→invocation expertise match works but is only reachable
  when a caller sets `target.expertise`; the friendly RoomPanel picker uses agent _pick_,
  not expertise.
- **EXISTS-BUT-UNUSED (for creative):** Auto-spawn clones the _busy_ agent, so
  `agent-creative` is a clone _source_ only if it is busy; it is never auto-targeted for
  creative tasks.
- **PARTIAL:** Lens editor exists but there is no creative lens to assign; Forum/Marketplace/
  Protocol/Version services are generic over all agents, so `agent-creative` is one of many.
- **POTENTIAL:** Research, Knowledge/Crystal, Workflow, Scheduler have no creative-specific
  path today — all are generic topology-node consumers.
