# 02_CAPABILITIES — Capability Matrix for `agent-ux`

Legend: **Exists** = implemented in shared infra · **Used** = actually exercised for agent-ux · **Exposed in UI** = surfaced to user · Flags: `EXISTS-BUT-UNUSED`, `UI-HIDDEN`, `PARTIAL`, `DEAD`, `POTENTIAL`.

| #   | Capability                                         | Exists       | Used by agent-ux    | Exposed in UI                       | Evidence                                                    | Flag                                  |
| --- | -------------------------------------------------- | ------------ | ------------------- | ----------------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| 1   | LLM execution (chat)                               | ✅           | ✅                  | ✅                                  | `chat-executor.ts:98-160`, `cognitive-service.ts:472-547`   | —                                     |
| 2   | Debate participation                               | ✅           | ✅ (if added)       | ✅ (DebateRuntimePanel)             | `debate-agent-executor.ts:38-117`                           | PARTIAL (no UX persona)               |
| 3   | ConversationCore/Director turn                     | ✅           | ✅                  | ✅ (DirectorPanel/RunTab)           | `conversation-orchestrator.ts:55-60`, `phase20-director.ts` | —                                     |
| 4   | Invocation (human)                                 | ✅           | ✅                  | ✅ (RoomPanel)                      | `phase21-invocation.ts:43-167`                              | —                                     |
| 5   | Persona overlay (debate)                           | ✅           | ✅ but generic      | ⚠️ hidden                           | `persona-selector.ts:243-309`                               | EXISTS-BUT-UNUSED (UX-tuned)          |
| 6   | Stats (calls/tokens/latency/errors/cost)           | ✅           | ✅                  | ✅ (AgentCard, AgentStatsDashboard) | `agent-service.ts:184-210, 288-304`                         | —                                     |
| 7   | Lifecycle (ready/paused/busy/idle)                 | ✅           | ✅                  | ✅ (AgentCard toggle)               | `agent-service.ts:588-613`                                  | —                                     |
| 8   | Auto-spawn clones                                  | ✅           | ✅ (generic)        | ❌ hidden                           | `agent-service.ts:614-665`                                  | UI-HIDDEN                             |
| 9   | Groups / teams                                     | ✅           | ✅ (generic)        | ✅ (AgentGroupsSection)             | `agent-service.ts:667-799`                                  | —                                     |
| 10  | Memory read/write                                  | ✅           | ✅ (generic)        | ⚠️ generic only                     | `memory-engine.ts:52`                                       | EXISTS-BUT-UNUSED (UX-scoped)         |
| 11  | Cognitive event emission (step completed)          | ✅           | ✅ (indirect)       | ✅ (LiveActivityStream)             | `cognitive-service.ts:229-259`                              | —                                     |
| 12  | Cognitive decision event                           | ✅           | ❌                  | ❌                                  | `event-registry.ts:776`                                     | DEAD (no producer→consumer for agent) |
| 13  | Agent journal                                      | ✅           | ✅ (generic)        | ✅ (AgentHistoryTab)                | `agent-journal-service.ts:129-191`                          | —                                     |
| 14  | Lens application                                   | ✅ (engine)  | ❌ (lensIds=[])     | N/A                                 | `lens-library.ts` (no UX lens)                              | EXISTS-BUT-UNUSED                     |
| 15  | Health/auto-recovery monitor                       | ✅           | ✅ (generic)        | ✅ (AgentObservabilityTab)          | `agent-health-monitor` registered `phase4:123-132`          | —                                     |
| 16  | Prompt audit (grouping)                            | ✅           | ✅ (Creative group) | ⚠️ hidden                           | `prompt-audit-service.ts:24`                                | UI-HIDDEN                             |
| 17  | Research module participation                      | ✅ (generic) | ⚠️ indirect         | ✅ (identity)                       | knowledge-generator-service (generic)                       | POTENTIAL                             |
| 18  | Knowledge/Crystal participation                    | ✅ (generic) | ⚠️ indirect         | ✅ (AuthorBadge etc.)               | crystal-vault, forum (generic identity)                     | POTENTIAL                             |
| 19  | Workflow/Scheduler participation                   | ✅ (generic) | ⚠️ indirect         | ⚠️                                  | `scheduler-service.ts:47` (time-based, not role-aware)      | EXISTS-BUT-UNUSED (role-aware)        |
| 20  | Forum posting (agent provenance)                   | ✅           | ✅ (if posts)       | ✅ (ForumPanel/AuthorBadge)         | forum-service (generic)                                     | —                                     |
| 21  | UX-specific tooling (surveys/heuristics/analytics) | ❌           | ❌                  | ❌                                  | none found                                                  | MISSING (POTENTIAL)                   |
| 22  | Usability heuristic evaluator                      | ❌           | ❌                  | ❌                                  | none found                                                  | MISSING (POTENTIAL)                   |
| 23  | User-research interview instrument                 | ❌           | ❌                  | ❌                                  | none found                                                  | MISSING (POTENTIAL)                   |

## Summary flags

- **EXISTS-BUT-UNUSED (UX-tuned):** Persona overlay (5) is generic, never UX-aware; Lenses (14) engine exists but agent has none; Memory (10) is available but nothing writes UX knowledge; Workflow/Scheduler (19) is generic and role-blind.
- **UI-HIDDEN:** Auto-spawn (8), Prompt-audit grouping (16).
- **DEAD:** Cognitive decision event (12) — no producer wires it to agent-ux.
- **PARTIAL:** Debate participation (2) works but the persona selector has no UX variant (`persona-selector.ts` variants are scientist/advocate/economist/legal/historian/technologist/philosopher/diplomat/critic/strategist — none UX/research-oriented).
- **POTENTIAL / MISSING:** Real UX differentiation (21-23) does not exist; this is the gap the roadmap targets.

**[VERIFIED]** rows 1-20 are in shared infra and exercised generically. **[INFERRED]** rows 17-20 (generic participation). **[OPINION]** rows 21-23 are the strategic opportunity.
