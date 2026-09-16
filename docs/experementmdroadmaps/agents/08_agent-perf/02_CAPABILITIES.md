# 02_CAPABILITIES — Capability Matrix

Legend: `EXISTS` (code present) · `USED` (actually exercised for agent-perf) · `UI` (exposed in UI) · Flags: `UI-HIDDEN` (capability exists but not surfaced for this agent) · `PARTIAL` · `DEAD` · `POTENTIAL` (does not exist, should).

| #   | Capability                                   | Exists        | Used                                  | Exposed in UI              | Evidence                                                    | Flag                                            |
| --- | -------------------------------------------- | ------------- | ------------------------------------- | -------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| 1   | Appear as routed topology node               | ✅            | ✅                                    | ✅ (card)                  | `topology-defaults.ts:231,472,524`                          | —                                               |
| 2   | System-prompt persona (perf engineer)        | ✅            | ✅                                    | ✅ (card desc)             | `topology-defaults.ts:236`                                  | —                                               |
| 3   | Pinned model/provider (groq/llama-3.3-70b)   | ✅            | ✅                                    | ✅ (card "Provider/Model") | `agent-profiles.ts:98-99`; `AgentCard.tsx:162-169`          | —                                               |
| 4   | Resolve identity (name/avatar/specs)         | ✅            | ✅                                    | ✅                         | `agent-identity.ts:62`; `AgentCard.tsx:23`                  | —                                               |
| 5   | Participate in Debate                        | ✅            | ✅ (if selected)                      | ✅ (DebateRuntimePanel)    | `debate-agent-executor.ts:38`                               | PARTIAL (no perf persona; no agent-level stats) |
| 6   | Participate in ConversationCore/Director     | ✅            | ✅ (if selected)                      | ✅ (DirectorPanel chip)    | `agent-service.ts:337`; `phase21-invocation.ts:91-108`      | —                                               |
| 7   | Human invocation via Room                    | ✅            | ✅                                    | ✅ (RoomPanel picker)      | `phase21-invocation.ts:43-58`; AGENTS.md RoomPanel          | —                                               |
| 8   | Lifecycle pause/resume/restart               | ✅            | ✅                                    | ✅                         | `agent-service.ts:460-515`                                  | —                                               |
| 9   | Agent-level stats (calls/latency/cost)       | ✅            | ⚠️ only via ConversationCore          | ✅ (card)                  | `agent-service.ts:184,288`; debate emits none               | PARTIAL (UI-HIDDEN gap in debate)               |
| 10  | Agent journal entries                        | ✅            | ⚠️ only cognitive_step / debate error | ✅ (AgentHistoryTab)       | `agent-journal-service.ts:129-190`                          | PARTIAL                                         |
| 11  | `benchmark` / `profiler` tools               | ✅ (declared) | ❓ likely no-op                       | ✅ (card tags)             | `topology-defaults.ts:238`; no tool registry entry          | UI-HIDDEN / DEAD-ish                            |
| 12  | Lens attachment                              | ✅ (infra)    | ❌ none                               | ✅ (identity editor)       | `lens-library.ts` (no perf lens); `agent-perf` `lensIds:[]` | POTENTIAL                                       |
| 13  | Group membership                             | ✅            | ❌ (user action)                      | ✅ (AgentGroupsSection)    | `agent-service.ts:667`                                      | —                                               |
| 14  | Elo / leaderboard scoring                    | ✅            | ✅ (if debated)                       | ✅ (EloLeaderboard)        | `AgentsPanel/EloLeaderboard.tsx`                            | PARTIAL (needs debate events)                   |
| 15  | Health monitor / auto-recovery               | ✅ (infra)    | ✅ (generic)                          | ✅ (AgentObservabilityTab) | `agent-health-monitor.ts` (generic)                         | —                                               |
| 16  | Memory continuity (journal)                  | ✅            | ⚠️ partial                            | ✅                         | `agent-journal-service.ts`                                  | PARTIAL (see 01)                                |
| 17  | Research / Knowledge / Crystal participation | ✅ (infra)    | ❌ not auto                           | ❌                         | no agent-perf-specific wiring                               | POTENTIAL                                       |
| 18  | Forum participation (authored posts)         | ✅ (infra)    | ❌ not auto                           | ✅ (AuthorBadge)           | `ForumPanel/AuthorBadge`                                    | —                                               |
| 19  | Workflow / Builder participation             | ✅ (infra)    | ❌ not auto                           | ✅                         | BuilderPanel                                                | —                                               |
| 20  | Scheduler participation                      | ✅ (infra)    | ❌ not auto                           | ❌                         | no agent-perf schedule                                      | POTENTIAL                                       |
| 21  | Cognitive-event surfacing (decision:made)    | ✅            | ❌ dead-at-consumer                   | ❌                         | `event-registry.ts:776`; AGENTS.md                          | DEAD                                            |
| 22  | Performance-specific measurement             | ❌            | —                                     | ❌                         | no perf tooling/benchmark infra                             | POTENTIAL (biggest gap)                         |

## Headline flags

- **PARTIAL #9 / #10**: `agent-perf` accrues its own stats/journal only on the ConversationCore path, not in Debate (verified: debate-runtime emits no `COGNITIVE_STEP_COMPLETED`). The UI shows these counters but they under-report real activity.
- **UI-HIDDEN / DEAD-ish #11**: `benchmark`/`profiler` tools are shown as tags but are not in any tool-constant set → almost certainly cosmetic.
- **POTENTIAL #12/#22**: no performance lens and no real measurement tooling — the single largest unrealized capability.
- **DEAD #21**: `cognitive:decision:made` is dead-at-consumer; `agent-perf` cannot surface decisions through it.
