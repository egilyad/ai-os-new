# 02_CAPABILITIES — Capability Matrix for `agent-data`

Legend: **EXISTS** (real code), **USED** (actually exercised), **UI** (exposed in UI), **EXISTS-BUT-UNUSED**, **UI-HIDDEN**, **PARTIAL**, **DEAD**, **POTENTIAL**.
Evidence = file:line.

| Capability                                     | Exists                | Used    | UI                                       | Flag                                      | Evidence                                                              |
| ---------------------------------------------- | --------------------- | ------- | ---------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Debate participant (model/provider pinned)     | ✅                    | ✅      | ✅ (DebateRuntimePanel)                  | —                                         | debate-api.ts:308-320, topology-defaults.ts:257-267                   |
| Debate persona from specializations            | ❌                    | ❌      | ❌                                       | **EXISTS-BUT-UNUSED gap**                 | persona-selector.ts:243-290 ignores specializations                   |
| ConversationCore / Director participant        | ✅                    | ✅      | ✅ (DirectorPanel chip)                  | —                                         | agent-service.ts:337 resolveAgent; conversation-orchestrator          |
| Invocation (human, Room)                       | ✅                    | ✅      | ✅ (RoomPanel)                           | —                                         | phase21-invocation.ts:43-58,125-139                                   |
| Invocation expertise match via specializations | ✅                    | ✅      | ❌ (no UI)                               | **UI-HIDDEN**                             | invocation-engine-service.ts:167-173                                  |
| Research subsystem wiring                      | ❌                    | ❌      | ❌                                       | **N/A** (no research module)              | grep `src/**/research/**` → 0 matches                                 |
| Memory write (generic, by nodeId)              | ✅                    | ✅      | ❌ (no per-agent view)                   | **UI-HIDDEN**                             | memory-engine.ts:181                                                  |
| Memory read / continuity per agent             | ✅                    | Partial | ❌                                       | **PARTIAL**                               | memory-orchestrator.ts:82 store(); no agent-keyed query               |
| Cognitive stream (step completed)              | ✅                    | ✅      | ✅ (AgentStatsDashboard)                 | —                                         | agent-service.ts:184; orchestration-service.ts:414                    |
| Cognitive decision surfacing                   | ✅                    | ❌      | ❌                                       | **DEAD**                                  | cognitive-service.ts:414 emits; no consumer (grep)                    |
| Agent journal entry                            | ✅                    | ✅      | ✅ (AgentJournalPanel)                   | **PARTIAL** (name=nodeId not displayName) | agent-journal-service.ts:150-171                                      |
| Workflow / Builder participation               | ✅                    | Generic | ✅ (BuilderPanel)                        | **PARTIAL**                               | workflows are user-defined; no auto-bind                              |
| Forum participation (identity)                 | ✅                    | Generic | ✅ (AuthorBadge)                         | —                                         | ForumPanel/AuthorBadge via resolveAgentIdentity                       |
| Knowledge/Crystal participation                | ✅                    | Generic | ✅                                       | **PARTIAL**                               | knowledge-generator uses lenses not agents; crystal bridge generic    |
| Scheduler participation                        | ✅ (scheduler exists) | Generic | ❌                                       | **UI-HIDDEN**                             | scheduler infra; no agent-data-specific schedule                      |
| Analytics / stats                              | ✅                    | ✅      | ✅ (AgentStatsDashboard, EloLeaderboard) | —                                         | agent-service.ts:288-304; AgentStatsDashboard.tsx                     |
| Agent UI card / detail / editor                | ✅                    | ✅      | ✅                                       | —                                         | AgentsPanel/*                                                         |
| Health / auto-recovery                         | ✅                    | ✅      | ✅ (AgentObservabilityTab)               | —                                         | agent-health-monitor.ts:66; agent-service.ts:614 autoSpawn            |
| Groups / teams                                 | ✅                    | ✅      | ✅ (AgentGroupsSection)                  | —                                         | agent-service.ts:667-799                                              |
| Avatar (curated 🔬 #14b8a6)                    | ✅                    | ✅      | ✅                                       | **NOTE**                                  | via node.config.avatar (topology-defaults.ts:103), NOT getAgentAvatar |
| Lens assignment                                | ❌                    | ❌      | ❌                                       | **EXISTS-BUT-UNUSED** (lensIds:[])        | topology-defaults.ts:106; no data/statistics lens                     |
| Specializations display                        | ✅                    | ✅      | ✅                                       | —                                         | agent-identity.ts:135                                                 |

## Key flags explained

- **DEAD — `cognitive:decision:made`**: emitted by `cognitive-service.ts:414`, but no `on`/`onSafe` consumer exists in the codebase (grep). Agents never observe it. For `agent-data` this means no "decision log" surfaces.
- **UI-HIDDEN — Invocation expertise match**: the engine _can_ match "Statistics" to `agent-data`, but no UI lets a user request by expertise; RoomPanel only does free human pick.
- **EXISTS-BUT-UNUSED — Lens**: `agent-data.lensIds` is `[]`; even if a `lens:statistical` existed, it is not attached.
- **AVATAR NOTE (correcting the brief)**: `AgentAvatar.tsx:47 getAgentAvatar` is a **deterministic hash fallback** — it does NOT read `AGENT_PROFILES`. The curated 🔬 comes from `node.config.avatar` (injected by `normalizeAgentIdentity`), surfaced through `resolveAgentIdentity` (`agent-identity.ts:102-114`). The brief's claim is inaccurate; behavior is correct but routed differently.
- **PARTIAL — Journal name**: `agent-journal-service.ts:135,161` stores `agentName: e.nodeId` ("agent-data") instead of "Sam Okafor", so the journal shows the id, not the display name.
