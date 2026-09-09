# 01_CURRENT_STATE — what `agent-devops` ACTUALLY does now

> Research-only. VERIFIED = read in source; INFERRED = derived; OPINION = assessment.

## Registration & life (VERIFIED)

- Defined as a curated profile (`agent-profiles.ts:72-81`) and a topology node (`topology-defaults.ts:206-217`).
- At boot `normalizeAgentIdentity` (`topology-defaults.ts:91-119`) rewrites the node config so the node _carries_ Tomas Berg's name, avatar, `groq` provider, `llama-3.1-8b-instant` model, specializations, and empty `lensIds`.
- `AgentService` is registered in `phase4-agents-roles.ts:86` and implements `IAgentResolver` (`agent-service.ts:71`). Tomas Berg is one of 25 seeded nodes; there is **no per-agent code** — behavior is 100% shared infrastructure.

## Selection & execution (VERIFIED contract, INFERRED for devops specifically)

- When selected, `AgentService.resolveAgent('agent-devops')` (`agent-service.ts:337-390`) returns the node config: `model: 'llama-3.1-8b-instant'`, `provider: 'groq'`, `baseRole: 'DevOps Engineer'`, `specializations: ['CI/CD','Kubernetes','Observability']`, `avatar: {⚙️,#f59e0b}`, `systemPrompt` = the node `prompt` (the generic DevOps sentence; node has no custom `systemPrompt`).
- The model is honored because it is non-`auto`/`default` (`agent-service.ts:351-353`).
- Execution flows through `OrchestrationService.execute` → LLM client → `groq`/`llama-3.1-8b-instant`.

## Prompts actually sent (VERIFIED)

- Debate/Conversation turn prompt = node `config.prompt` (the 1-sentence DevOps instruction, `topology-defaults.ts:212`) + any persona injection from `PersonaSelector` (topic-driven, NOT specialization-driven — see `04_DEBATE_ROLE.md`) + ConversationCore/Director context.
- There is **no** curated "Tomas Berg" backstory injected; the name/avatar are UI-only.

## Events in / out (VERIFIED)

- **In (consumed):** `AgentService` listens to `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184`) and `STREAM_END` (`agent-service.ts:219`) for stats, `AGENT_LIFECYCLE_CHANGE` (`:249`), `AGENT_HEALTH_CHANGE` (`:252`).
- **Out:** `AGENT_LIFECYCLE_CHANGE`, `AGENT_RESTARTED`, `SYSTEM_NODE_SPAWN/REMOVED` (emitted by `AgentService`). Debate/conversation emit their own events; `agent-devops` does not emit bespoke events.
- **Cognitive stream:** `COGNITIVE_STEP_COMPLETED` is emitted _about_ devops when it runs (producer side, consumed for stats + journal). `COGNITIVE_DECISION_MADE` is dead-at-consumer (per AGENTS.md), so devops "decisions" are never surfaced. Debate emits **no** cognitive events.

## Participation matrix (current)

| Subsystem                      | Participates?                                | Evidence                                          |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------- |
| Debate                         | Yes (when selected)                          | `persona-selector.ts`; node in topology           |
| ConversationCore / Director    | Yes                                          | `agent-service.ts:337` resolveAgent; ChatExecutor |
| Invocation (human Room)        | Yes                                          | `phase21-invocation.ts:43-58`, `RoomPanel.tsx`    |
| Research / Knowledge / Crystal | Indirect only (no devops-specific wiring)    | no references found (grep)                        |
| Memory (agent-journal)         | Yes, passively                               | `agent-journal-service.ts:130,150,174`            |
| Cognitive-stream display       | Partial (stats only)                         | `agent-service.ts:184`                            |
| Workflow / Builder             | Broken dispatch                              | `builder-agent-service.ts:40`                     |
| Forum                          | Via other agents' posts, not devops-specific | no refs                                           |
| Scheduler                      | No dedicated scheduler                       | no refs                                           |
| Analytics / stats              | Yes                                          | `agent-service.ts:288-304`                        |

## UI state (VERIFIED)

- Renders in AgentsPanel as a card (⚙️ Tomas Berg, DevOps Engineer).
- In `RoomPanel` agent picker (`RoomPanel.tsx:89`) as `Tomas Berg — DevOps Engineer`.
- `AgentLiveBoard` shows live lifecycle/calls.
- No agent-specific screens; no devops-specific dashboard, runbooks, or incident view.

## Settings editable (VERIFIED)

- Via `AgentIdentityEditor`/`AgentWizard` the node config (prompt, model, temperature, tools) can be edited; persisted to topology (`agent-service.ts:432 updateAgent`). The curated `AGENT_PROFILES` entry itself is **not** mutated (it is a static seed).

## Honest summary (OPINION)

`agent-devops` today is a **generic LLM node wearing a DevOps costume**: the name, emoji, and `groq`/`llama-3.1-8b-instant` model are fixed, the _only_ behavior signal is one generic prompt line about CI/CD/IaC/reliability. No tool connects it to real Kubernetes/CI systems, no ops-specific lens, no incident/runbook memory, and its debate persona ignores its specialization entirely.
