# 02_CAPABILITIES — Capability matrix

> Legend: Exists (real machinery), Used (actually invoked), Exposed in UI, Evidence (file:line).
> Flags: EXISTS-BUT-UNUSED, UI-HIDDEN, PARTIAL, DEAD, POTENTIAL.

## Core agent capabilities

| Capability                                               | Exists | Used                     | Exposed in UI                      | Evidence                                          | Flag                                     |
| -------------------------------------------------------- | ------ | ------------------------ | ---------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Registered/seeded agent                                  | ✅     | ✅                       | ✅                                 | topology-defaults.ts:157, agent-profiles.ts:32    | —                                        |
| Static risk-analyst system prompt                        | ✅     | ✅ (debate/conversation) | ❌ (prompt visible in editor only) | topology-defaults.ts:162                          | UI-HIDDEN (not shown in card)            |
| Declared model pin (llama-3.3)                           | ✅     | ❌                       | ✅ (profile)                       | agent-profiles.ts:39                              | EXISTS-BUT-UNUSED (overridden by `auto`) |
| Execution model routing (`auto`)                         | ✅     | ✅                       | ✅                                 | topology-defaults.ts:165                          | —                                        |
| Analytics tools (data_analysis/visualization/web_search) | ✅     | ✅ (if tools honored)    | ❌                                 | topology-defaults.ts:8,164                        | PARTIAL (tool-use depends on executor)   |
| Lifecycle pause/resume                                   | ✅     | ✅                       | ✅                                 | agent-service.ts:460-491                          | —                                        |
| Stats (calls/tokens/cost)                                | ✅     | ✅                       | ✅                                 | agent-service.ts:184-209, AgentStatsDashboard.tsx | —                                        |
| Groups/teams                                             | ✅     | ✅                       | ✅                                 | agent-service.ts:667-799, AgentGroupsSection.tsx  | —                                        |

## Debate

| Capability                      | Exists | Used | Exposed | Evidence                              | Flag                          |
| ------------------------------- | ------ | ---- | ------- | ------------------------------------- | ----------------------------- |
| Debate participant              | ✅     | ✅   | ✅      | debate-api.ts:299-321                 | —                             |
| Side assigned by specialization | ❌     | ❌   | ❌      | debate-api.ts:307-311 (positional)    | DEAD (specialization ignored) |
| Risk/compliance persona variant | ❌     | ❌   | ❌      | persona-selector.ts (no risk variant) | POTENTIAL                     |
| Argument metrics / Elo          | ✅     | ✅   | ✅      | debate-metrics.ts, EloLeaderboard.tsx | —                             |

## ConversationCore / Director

| Capability               | Exists | Used                         | Exposed                         | Evidence                            | Flag    |
| ------------------------ | ------ | ---------------------------- | ------------------------------- | ----------------------------------- | ------- |
| Conversation participant | ✅     | ✅ (if scenario includes it) | ✅ (Director AgentIdentityChip) | agent-service.ts:337, DirectorPanel | PARTIAL |
| Scenario/override turn   | ✅     | ✅                           | ✅                              | B5.4c RunTab                        | —       |

## Invocation

| Capability                   | Exists | Used | Exposed | Evidence                                     | Flag |
| ---------------------------- | ------ | ---- | ------- | -------------------------------------------- | ---- |
| Human invocation (RoomPanel) | ✅     | ✅   | ✅      | RoomPanel.tsx:121-141, phase21-invocation.ts | —    |
| Mode chat/debate/scenario    | ✅     | ✅   | ✅      | RoomPanel.tsx:26-30                          | —    |
| Open session navigation      | ✅     | ✅   | ✅      | RoomPanel.tsx:110-113                        | —    |

## Research / Knowledge / Crystal / Forum / Workflow / Scheduler

| Capability              | Exists             | Used | Exposed | Evidence                        | Flag      |
| ----------------------- | ------------------ | ---- | ------- | ------------------------------- | --------- |
| Risk-specific research  | ❌                 | ❌   | ❌      | (none)                          | POTENTIAL |
| Crystal proposal (risk) | ❌                 | ❌   | ❌      | crystal-debate-bridge (generic) | POTENTIAL |
| Forum authoring         | ✅ (as author)     | ✅   | ✅      | ForumPanel/AuthorBadge          | —         |
| Workflow participation  | ✅ (topology node) | ✅   | ✅      | builder-agent-service           | PARTIAL   |
| Scheduler triggers      | ❌                 | ❌   | ❌      | (no agent-specific schedule)    | POTENTIAL |

## Memory

| Capability                | Exists | Used                 | Exposed                | Evidence                                   | Flag              |
| ------------------------- | ------ | -------------------- | ---------------------- | ------------------------------------------ | ----------------- |
| Agent-scoped memory query | ✅     | ❌ (not auto-loaded) | ❌                     | episodic-memory.ts:53, social-memory.ts:33 | EXISTS-BUT-UNUSED |
| Self journaling           | ✅     | ❌                   | ✅ (AgentJournalPanel) | agent-journal-service.ts:96                | EXISTS-BUT-UNUSED |
| Write debate memory       | ✅     | ✅ (debate-global)   | ❌                     | debate-knowledge-sync.ts:60,84             | UI-HIDDEN         |

## Cognitive-stream

| Capability                       | Exists | Used       | Exposed         | Evidence                                        | Flag      |
| -------------------------------- | ------ | ---------- | --------------- | ----------------------------------------------- | --------- |
| COGNITIVE_STEP_COMPLETED         | ✅     | ✅ (stats) | ❌ (stats only) | agent-service.ts:184                            | UI-HIDDEN |
| cognitive:decision:made surfaced | ✅     | ✅ (emit)  | ❌              | cognitive-service.ts:414, event-recorder.ts:232 | DEAD      |

## Analytics / Health / Auto-recovery

| Capability        | Exists | Used | Exposed | Evidence                                           | Flag      |
| ----------------- | ------ | ---- | ------- | -------------------------------------------------- | --------- |
| Health monitor    | ✅     | ✅   | ✅      | agent-health-monitor.ts, AgentObservabilityTab.tsx | —         |
| Auto-spawn clones | ✅     | ✅   | ❌      | agent-service.ts:614-665                           | UI-HIDDEN |
| Elo leaderboard   | ✅     | ✅   | ✅      | EloLeaderboard.tsx                                 | —         |

## Summary of flags

- **EXISTS-BUT-UNUSED:** declared model pin; agent-scoped memory query; self-journaling.
- **UI-HIDDEN:** risk prompt; cognitive step events; memory writes; auto-spawn.
- **DEAD:** specialization-aware debate side; cognitive:decision:made consumer.
- **POTENTIAL:** risk/compliance debate persona; risk research; crystal risk proposals; scheduler triggers.
- **PARTIAL:** conversation participant; workflow; tools (depend on executor honoring them).
