# 02 — CAPABILITIES matrix: `agent-ethics`

> Legend: **Exists** (built somewhere in shared infra), **Used** (agent actually exercises it), **UI** (exposed in UI), Flags: **EXISTS-BUT-UNUSED**, **UI-HIDDEN**, **PARTIAL**, **DEAD**, **POTENTIAL**.

| Capability                            | Exists                     | Used by agent           | Exposed in UI              | Evidence                                                  | Flag                                                                 |
| ------------------------------------- | -------------------------- | ----------------------- | -------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| Debate participant                    | ✅                         | ✅                      | ✅ (debate UI)             | `debate-agent-executor.ts`, `debate-orchestrator.ts`      | —                                                                    |
| ConversationCore/Director participant | ✅                         | ✅ (when in scenario)   | ✅ (Director RunTab)       | `conversation-execution-engine.ts:40`, AGENTS.md B3/B4    | —                                                                    |
| Human invocation (Room)               | ✅                         | ✅                      | ✅ (RoomPanel)             | phase21-invocation, AGENTS.md Step 6                      | —                                                                    |
| Agent-group execution                 | ✅                         | ✅ (if added)           | ✅ (AgentsPanel groups)    | `agent-service.ts:667-799`                                | —                                                                    |
| Topology auto-routing                 | ✅                         | ✅ (default edges)      | ⚠️ indirect                | `topology-defaults.ts:486,538`                            | UI-HIDDEN                                                            |
| System prompt persona                 | ✅                         | ✅                      | ✅ (editor)                | `topology-defaults.ts:174`                                | —                                                                    |
| Model nvidia/llama-3.3-70b            | ✅                         | ✅                      | ✅ (editor)                | `agent-profiles.ts:48-49`, `topology-defaults.ts:104-105` | —                                                                    |
| Lifecycle / pause / restart           | ✅                         | ✅                      | ✅                         | `agent-service.ts:460-515`                                | —                                                                    |
| Health monitor / auto-recovery        | ✅                         | ✅                      | ✅ (AgentObservabilityTab) | `agent-health-monitor.ts`                                 | —                                                                    |
| Agent stats (calls/tokens/cost)       | ✅                         | ✅                      | ✅ (AgentStatsDashboard)   | `agent-service.ts:184-210`                                | —                                                                    |
| Journal history                       | ✅                         | PARTIAL                 | ✅ (AgentJournalPanel)     | `agent-journal-service.ts:129-191`                        | PARTIAL (keyed by nodeId, no ethics tags; debate-success not logged) |
| Lens application                      | ✅ (LensEngine)            | ❌                      | ✅ (LensesPanel)           | `lens-library.ts` has NO ethics lens; `lensIds: []`       | EXISTS-BUT-UNUSED (for this agent)                                   |
| Bias audit (specialization)           | ✅ (debate `biasProfiler`) | INDIRECT                | ❌ agent-specific          | `bias-profiler.ts`; not bound to agent                    | EXISTS-BUT-UNUSED (generic)                                          |
| Ethical-framework debate constraint   | ✅                         | INDIRECT (topic-driven) | ✅ (debate config)         | `debate-prompt-constants.ts:37,55`                        | EXISTS-BUT-UNUSED (not agent-bound)                                  |
| Expert-witness `expert-ethics`        | ✅                         | INDIRECT                | ✅ (debate)                | `expert-witness-service.ts:35`                            | EXISTS-BUT-UNUSED (separate feature)                                 |
| Cognitive-stream visibility           | ✅                         | PARTIAL                 | ✅ (LiveActivityStream)    | `event-registry.ts:755,763`; debate emits none            | PARTIAL (debate path invisible)                                      |
| Memory continuity (cross-session)     | ✅ (journal KV)            | PARTIAL                 | ⚠️                         | `agent-journal-service.ts`                                | PARTIAL                                                              |
| Knowledge / Crystal review            | ✅ (CrystalVault)          | ❌ auto                 | ✅ (CrystalVaultPanel)     | no ethics hook                                            | POTENTIAL                                                            |
| Forum moderation/announcement         | ✅ (ForumService)          | ❌ auto                 | ✅ (ForumPanel)            | no ethics hook                                            | POTENTIAL                                                            |
| Workflow/Scheduler trigger            | ✅ (Builder/Scheduler)     | ❌ auto                 | ✅                         | no ethics hook                                            | POTENTIAL                                                            |
| Identity editing (wizard/editor)      | ✅                         | ✅                      | ✅                         | `AgentWizard.tsx`, `AgentIdentityEditor.tsx`              | —                                                                    |
| Avatar 🛡️ render                      | ✅                         | ✅                      | ✅                         | `agent-identity.ts:100-114`                               | —                                                                    |

## Summary flags

- **EXISTS-BUT-UNUSED (agent-bound)**: none of the ethics-specific _shared_ features (bias profiler, ethical_framework constraint, expert-ethics witness) are actually attached to Elena. She is a generic node wearing an ethics-themed system prompt.
- **UI-HIDDEN**: default-topology routing into her is not surfaced as "ethics review" anywhere.
- **PARTIAL**: cognitive visibility (debate path silent), journal tagging (no ethics tag, nodeId-only name), memory continuity (journal exists but thin).
- **DEAD**: `cognitive:decision:made` event is dead-at-consumer (`event-registry.ts:776`); even if emitted, nothing renders it.
- **POTENTIAL**: Crystal/Forum/Workflow/Scheduler auto-ethics-review hooks do not exist; this is the largest upside.
