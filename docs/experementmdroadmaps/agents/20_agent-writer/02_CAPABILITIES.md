# 02_CAPABILITIES — Capability Matrix for `agent-writer`

Legend: **EXISTS** = implemented & reachable; **EXISTS-BUT-UNUSED** = code exists but never triggered for this agent; **UI-HIDDEN** = data exists, not surfaced in UI; **PARTIAL** = stub/limited; **DEAD** = registered but no producer/consumer; **POTENTIAL** = feasible with existing infra; **N/A** = not applicable.

| Capability                                           | Status            | Used?                         | In UI?                          | Evidence                                                                     |
| ---------------------------------------------------- | ----------------- | ----------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| LLM generation (chat/debate)                         | EXISTS            | Yes                           | Yes (runtime)                   | `agent-service.ts:337` resolveAgent; `debate-llm-caller.ts`; `ChatExecutor`  |
| Model pinning (groq/llama-3.1-8b-instant)            | EXISTS            | Yes                           | Yes (AgentDetailPanel)          | `agent-profiles.ts:218-219`; `topology-defaults.ts:104-105`                  |
| Static system prompt (Technical Writer)              | EXISTS            | Yes                           | Partial (editor can view)       | `topology-defaults.ts:388`                                                   |
| Specialization: Documentation/Tutorials/API Docs     | EXISTS-BUT-UNUSED | No (not consulted)            | UI-only (label)                 | `agent-profiles.ts:220`; never read by `persona-selector.ts`                 |
| Lens association                                     | N/A               | —                             | —                               | No documentation lens in `lens-library.ts:12-284`                            |
| Persona injection (debate)                           | PARTIAL           | Yes, but generic              | n/a                             | `persona-selector.ts:243-308` (topic-keyword, ignores spec)                  |
| Debate participant                                   | EXISTS            | If topology includes node     | Yes (DebateRuntimePanel)        | `topology-defaults.ts:382`; `debate-engine.ts:262`                           |
| ConversationCore / Director turn                     | EXISTS            | If named participantId        | Yes (DirectorPanel)             | `agent-service.ts:337`; Orchestrator resolve                                 |
| Invocation (human RoomPanel pick)                    | EXISTS            | Yes (policy-gated)            | Yes (RoomPanel)                 | `phase21-invocation.ts`; RoomPanel agent `<select>`                          |
| Memory read/write (agent-journal)                    | EXISTS            | Yes (passive)                 | UI-HIDDEN                       | `agent-journal-service.ts:150-171`                                           |
| ~16 memory stores                                    | POTENTIAL         | No direct binding             | UI-HIDDEN                       | AGENTS.md "Memory: agent-journal-service; ~16 memory stores"                 |
| Cognitive event emission                             | DEAD-at-writer    | No (writer doesn't emit)      | n/a                             | `COGNITIVE_DECISION_MADE` dead-at-consumer; writer is a consumer target only |
| Cognitive event consumption (stats)                  | EXISTS            | Yes                           | Partial (AgentCard)             | `agent-service.ts:184-210`                                                   |
| Research/Knowledge participation                     | N/A               | —                             | —                               | No `agent-writer` ref in research/knowledge services                         |
| Crystal / Forum / Workflow / Scheduler participation | N/A               | —                             | —                               | grep: zero references in crystal/forum/builder/scheduler                     |
| Analytics / stats dashboard                          | EXISTS            | Yes                           | Yes (AgentLiveBoard/top agents) | `agent-service.ts:292-304`                                                   |
| UI card / detail / identity editor / wizard          | EXISTS            | Yes                           | Yes                             | `AgentsPanel/*`                                                              |
| Health / auto-recovery                               | EXISTS            | Indirect                      | UI-HIDDEN                       | `agent-health-monitor.ts:66` subscribes `COGNITIVE_STEP_COMPLETED`           |
| Auto-spawn / clone                                   | EXISTS            | General (not writer-specific) | n/a                             | `agent-service.ts:81-87,392` spawnAgent                                      |
| Groups / teams                                       | EXISTS            | No writer team defined        | UI-HIDDEN                       | `agent-service.ts:27-35` AgentGroup; no doc team seeded                      |
| Workflow (Builder) trigger                           | N/A               | —                             | —                               | No `agent-writer` in builder/workflow code                                   |

## Key findings

- **Specialization is metadata only.** `Documentation/Tutorials/API Docs` are stored (`agent-profiles.ts:220`) and shown in the UI (via `resolveAgentIdentity.specializations`, `agent-identity.ts:135`), but **no runtime path uses them** to route, select persona, or gate tasks. `[VERIFIED]`
- **No lens.** The 11 lenses (`lens-library.ts:12-284`) are all analytical (critical, security, economic, meta-*, etc.); none targets documentation. Writer's `lensIds` is empty.
- **No documentation-specific memory or tooling.** The node uses generic `SEARCH_TOOLS` (`topology-defaults.ts:390`); it cannot read the codebase, existing docs, or crystals to write _accurate_ docs. `[INFERRED]` This is why doc-* agents exist separately with their own prompts.
- **No writer-exclusive event producer.** Writer is a _target_ of cognitive/agent events, never a _source_ of documentation-domain events.
