# 02 — CAPABILITIES matrix

> Capability | Exists | Used | Exposed in UI | Evidence. Flags: **EXISTS-BUT-UNUSED**, **UI-HIDDEN**, **PARTIAL**, **DEAD**, **POTENTIAL**.
> Status legend: Exists = data/code present; Used = a runtime path consumes it; UI = shown to user.

| #   | Capability                            | Exists | Used (runtime)             | Exposed in UI              | Flag                  | Evidence                                                                                                                    |
| --- | ------------------------------------- | ------ | -------------------------- | -------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Seeded identity (name/emoji/color)    | ✅     | ✅                         | ✅                         | —                     | `agent-profiles.ts:182-191`; `normalizeAgentIdentity` `topology-defaults.ts:91-119`                                         |
| 2   | System prompt (PM persona)            | ✅     | ✅ (chat/debate)           | ✅ (detail)                | —                     | `topology-defaults.ts:348-350`; `agent-identity.ts:142`                                                                     |
| 3   | Pinned model `llama-3.3-70b`          | ✅     | ✅ (via config override)   | ✅ (card "engine")         | **CORRECTION**        | `agent-profiles.ts:189` → `normalizeAgentIdentity` `topology-defaults.ts:104-105` → `agent-service.ts:351-353`              |
| 4   | Pinned provider `openrouter`          | ✅     | ✅ (config override)       | ✅ (identity providerName) | —                     | `agent-profiles.ts:188`; `topology-defaults.ts:104`                                                                         |
| 5   | Specializations `Planning/Agile/Risk` | ✅     | ❌                         | PARTIAL (tags)             | **EXISTS-BUT-UNUSED** | `agent-profiles.ts:190`; no consumer in `persona-selector.ts`/`debate-agent-executor.ts`/`conversation-execution-engine.ts` |
| 6   | Lens assignment                       | ❌     | ❌                         | ❌                         | **N/A**               | no `lensIds`; `normalizeAgentIdentity` sets `[]` `topology-defaults.ts:106`; no PM lens in `lens-library.ts`                |
| 7   | Debate participant                    | ✅     | ✅ (routed)                | ✅ (runtime panel)         | —                     | edges `topology-defaults.ts:482,534`; `PersonaSelector` `persona-selector.ts:3-241`                                         |
| 8   | ConversationCore participant          | ✅     | ✅ (if in scenario)        | ✅ (Director chip)         | —                     | `agentService.resolveAgent` `agent-service.ts:337`; `ConversationOrchestrator`                                              |
| 9   | Human invocation (RoomPanel)          | ✅     | ✅                         | ✅ (picker)                | —                     | `phase21-invocation.ts:43-58,125-139`                                                                                       |
| 10  | Agent stats / Elo                     | ✅     | ✅ (event-driven)          | ✅ (dashboards)            | —                     | `agent-service.ts:175-256,288`; `EloLeaderboard.tsx`                                                                        |
| 11  | Agent journal entries                 | ✅     | ✅ (COGNITIVE_STEP events) | ✅ (history tab)           | —                     | `agent-journal-service.ts:129-191`                                                                                          |
| 12  | Prompt-audit membership (Management)  | ✅     | ✅ (by name)               | ❌ (UI-HIDDEN)             | **UI-HIDDEN**         | `prompt-audit-service.ts:18,192`                                                                                            |
| 13  | Lifecycle (pause/resume/restart)      | ✅     | ✅                         | ✅ (AgentConfigTab)        | —                     | `agent-service.ts:460-515`                                                                                                  |
| 14  | Groups / teams                        | ✅     | ❌ (none defined for pm)   | PARTIAL (section exists)   | **POTENTIAL**         | `agent-service.ts:667-686`; `AgentGroupsSection.tsx`                                                                        |
| 15  | Structured planning output            | ❌     | ❌                         | ❌                         | **POTENTIAL**         | only free-text from LLM; no planner tool                                                                                    |
| 16  | Memory scope (agent-pm owned)         | ❌     | ❌                         | ❌                         | **N/A**               | ~16 memory stores are subsystem-scoped, not agent-pm                                                                        |

## Flags explained

- **EXISTS-BUT-UNUSED (row 5):** the three specializations are the agent's defining trait yet no code reads them for behavior. Highest-leverage cheap fix (see `11_OPPORTUNITIES.md` Q1).
- **UI-HIDDEN (row 12):** `agent-pm` is in the `Management` audit group — a real behavioral fact, but invisible in any panel. Surfacing it would explain why PM/PO/Lead are audited despite `tools:[]`.
- **CORRECTION (row 3):** prior docs in this folder marked the model pin as DEAD. Source shows `normalizeAgentIdentity` overwrites `config.model`, so the 70B pin **is** live. The flag here corrects that.
- **POTENTIAL (rows 14, 15):** groups and structured planning are real seams with no PM-specific wiring yet.

## Summary

`agent-pm` is **capable as a generic node** but its _distinctive_ PM capability (specializations, structured planning) is **decorative today**. The model/provider pin is genuinely applied.
